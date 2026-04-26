/**
 * Workflow route — direct generation (no Redis/BullMQ required).
 * Calls the agent service directly for each block, updates DB in real-time,
 * and broadcasts WebSocket events to the frontend.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { verifyClerk } from '../middleware/clerkAuth'
import { getOrCreateUser } from '../lib/getOrCreateUser'
import { broadcastToProject } from '../ws/wsManager'

const RunWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(2),
})

export async function workflowRoutes(app: FastifyInstance) {

  /** POST /api/workflow/run — triggers code generation for all blocks */
  app.post('/run', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)

    const parsed = RunWorkflowSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const { projectId, prompt } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.code(404).send({ error: 'Project not found' })

    const blocks = await prisma.block.findMany({ where: { projectId } })
    if (blocks.length === 0) {
      return reply.code(400).send({ error: 'No blocks found. Please generate a plan first.' })
    }

    console.log(`[workflow] ${blocks.length} blocks found — starting direct generation`)

    // Create a workflow run record
    const run = await prisma.workflowRun.create({
      data: { projectId, prompt, status: 'running', sharedContextJson: {} },
    })

    // Respond immediately so the frontend doesn't wait
    reply.code(202).send({ runId: run.id, status: 'running', blockCount: blocks.length })

    // Generate each block directly (async, in the background)
    const agentUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8005'

    for (const block of blocks) {
      const { id: blockId, blockType, blockJson } = block

      // Notify frontend: starting
      broadcastToProject(projectId, {
        event: 'block:status_update',
        blockId,
        status: 'running',
        runId: run.id,
      })

      try {
        console.log(`[workflow] Generating block ${blockType} (${blockId})`)
        const agentRes = await fetch(`${agentUrl}/api/v1/generate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: run.id,
            block_id: blockId,
            block_type: blockType,
            block_name: (blockJson as any)?.title ?? blockType,
            block_json: blockJson ?? {},
            shared_context: { prompt, project_id: projectId },
          }),
          signal: AbortSignal.timeout(120_000),
        })

        if (!agentRes.ok) {
          const err = await agentRes.text()
          throw new Error(`Agent ${agentRes.status}: ${err.slice(0, 200)}`)
        }

        const agentData = await agentRes.json() as { output_code: string; tokens_used: number }
        const outputCode = agentData.output_code
        const tokensUsed = agentData.tokens_used ?? 0

        // Save to DB
        await prisma.blockOutput.create({
          data: { runId: run.id, blockId, blockType, outputCode, tokensUsed, status: 'done' },
        })

        console.log(`[workflow] ✅ Block ${blockType} done — ${outputCode.length} chars`)

        // Notify frontend: done
        broadcastToProject(projectId, {
          event: 'block:status_update',
          blockId,
          status: 'done',
          output: outputCode,
          runId: run.id,
        })

      } catch (err: any) {
        console.error(`[workflow] ❌ Block ${blockType} failed:`, err.message)

        await prisma.blockOutput.create({
          data: { runId: run.id, blockId, blockType, outputCode: '', status: 'failed', errorMsg: err.message },
        }).catch(() => {})

        broadcastToProject(projectId, {
          event: 'block:status_update',
          blockId,
          status: 'failed',
          error: err.message,
          runId: run.id,
        })
      }
    }

    // Mark run complete
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: 'done' },
    }).catch(() => {})

    broadcastToProject(projectId, { event: 'workflow:completed', runId: run.id })
    console.log(`[workflow] All ${blocks.length} blocks processed for run ${run.id}`)
  })

  /** GET /api/workflow/runs/:id */
  app.get('/runs/:id', { preHandler: verifyClerk }, async (req: any, reply) => {
    await getOrCreateUser(req.user.sub)
    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.id },
      include: { blockOutputs: true },
    })
    if (!run) return reply.code(404).send({ error: 'Workflow not found' })
    return run
  })
}