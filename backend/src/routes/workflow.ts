/**
 * Workflow route — sequential block-by-block generation.
 * Calls the agent service directly for each block, pauses for user confirmation,
 * and broadcasts WebSocket events to the frontend.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { verifyClerk } from "../middleware/clerkAuth"
import { getOrCreateUser } from "../lib/getOrCreateUser"
import { broadcastToProject } from '../ws/wsManager'
import { emitWorkflowStarted, emitWorkflowCompleted } from '../graph/graphEvents'
import { graphRegistry } from '../graph/graphEngine'

const RunWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(2),
})

const ConfirmBlockSchema = z.object({
  projectId: z.string().uuid(),
  runId: z.string().uuid(),
})

// Helper function to generate a single block asynchronously
async function generateBlock(runId: string, projectId: string, blockId: string, blockType: string, blockJson: any, prompt: string) {
  // Notify frontend: starting
  broadcastToProject(projectId, {
    event: 'block:status_update',
    blockId,
    status: 'running',
    runId,
  })

  const agentUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000'
  let outputCode = ''

  try {
    console.log(`[workflow] Generating block ${blockType} (${blockId})`)
    const agentRes = await fetch(`${agentUrl}/api/v1/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: runId,
        block_id: blockId,
        block_type: blockType,
        block_name: blockJson?.title ?? blockType,
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
    outputCode = agentData.output_code
    const tokensUsed = agentData.tokens_used ?? 0

    // Save to DB as awaiting_confirm
    await prisma.blockOutput.create({
      data: { runId, blockId, blockType, outputCode, tokensUsed, status: 'awaiting_confirm' },
    })

    console.log(`[workflow] ⏸️ Block ${blockType} generated and awaiting confirm — ${outputCode.length} chars`)

    // Notify frontend: awaiting_confirm
    broadcastToProject(projectId, {
      event: 'block:status_update',
      blockId,
      status: 'awaiting_confirm',
      output: outputCode,
      runId,
    })

  } catch (err: any) {
    console.error(`[workflow] ❌ Block ${blockType} failed:`, err.message)

    await prisma.blockOutput.create({
      data: { runId, blockId, blockType, outputCode: '', status: 'failed', errorMsg: err.message },
    }).catch(() => {})

    broadcastToProject(projectId, {
      event: 'block:status_update',
      blockId,
      status: 'failed',
      error: err.message,
      runId,
    })
  }
}

export async function workflowRoutes(app: FastifyInstance) {

  // ✅ GET all runs for a project — filtered by the authenticated user
  app.get('/runs', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)
    const { projectId } = req.query as { projectId?: string }
    if (!projectId) return reply.code(400).send({ error: 'projectId is required' })

    const runs = await prisma.workflowRun.findMany({
      where: {
        projectId,
        triggeredByUserId: user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        blockOutputs: {
          select: {
            id: true,
            blockId: true,
            blockType: true,
            status: true,
            tokensUsed: true,
            errorMsg: true,
            createdAt: true,
            outputCode: true,
          },
          orderBy: { createdAt: 'asc' },
        }
      }
    })

    return runs
  })

  /** POST /api/workflow/run — triggers code generation for the FIRST block */
  app.post('/run', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const parsed = RunWorkflowSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() })

    const { projectId, prompt } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.code(404).send({ error: 'Project not found' })

    const blocks = await prisma.block.findMany({ 
      where: { projectId },
      orderBy: { createdAt: 'asc' } 
    })

    if (blocks.length === 0) {
      return reply.code(400).send({ error: 'No blocks found. Please generate a plan first.' })
    }

    console.log(`[workflow] ${blocks.length} blocks found — computing generation order`)

    // Use topological sort for correct generation order
    let orderedBlockIds: string[] = []
    try {
      const engine = await graphRegistry.get(projectId)
      orderedBlockIds = engine.topologicalSort()
    } catch {
      // Fallback to creation order if cycle detected
      orderedBlockIds = blocks.map(b => b.id)
    }
    const blockMap = new Map(blocks.map(b => [b.id, b]))
    const orderedBlocks = orderedBlockIds
      .map(id => blockMap.get(id))
      .filter(Boolean) as typeof blocks

    // Create a workflow run record
    const run = await prisma.workflowRun.create({
      data: { 
        projectId, 
        prompt, 
        status: 'running', 
        sharedContextJson: {},
        triggeredByUserId: user.id 
      },
    })

    // Respond immediately so the frontend doesn't wait
    reply.code(202).send({ runId: run.id, status: 'running', blockCount: blocks.length })

    // Emit workflow started event
    emitWorkflowStarted(projectId, run.id, user.id).catch(() => {})

    // Generate only the first block (in topo order)
    const firstBlock = orderedBlocks[0]
    generateBlock(run.id, projectId, firstBlock.id, firstBlock.blockType, firstBlock.blockJson, prompt)
  })

  /** POST /api/workflow/confirm/:blockId — marks block done, triggers next block */
  app.post('/confirm/:blockId', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const { blockId } = req.params
    const parsed = ConfirmBlockSchema.safeParse(req.body)
    
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }
    const { projectId, runId } = parsed.data

    // Find the current block output
    const blockOutput = await prisma.blockOutput.findFirst({
      where: { blockId, runId }
    })

    if (!blockOutput) {
      return reply.code(404).send({ error: 'BlockOutput not found for this run' })
    }

    // Update current block to done
    await prisma.blockOutput.update({
      where: { id: blockOutput.id },
      data: { status: 'done' }
    })

    // Notify frontend current is done
    broadcastToProject(projectId, {
      event: 'block:status_update',
      blockId,
      status: 'done',
      runId,
    })

    // Find the next block that does not have an output for this run
    const nextBlock = await prisma.block.findFirst({
      where: { 
        projectId,
        blockOutputs: { none: { runId } }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (nextBlock) {
      // Trigger the next block
      const run = await prisma.workflowRun.findUnique({ where: { id: runId } })
      if (run) {
        generateBlock(run.id, projectId, nextBlock.id, nextBlock.blockType, nextBlock.blockJson, run.prompt)
      }
      return reply.send({ status: 'next_block_started', nextBlockId: nextBlock.id })
    } else {
      // No more blocks, workflow is complete
      await prisma.workflowRun.update({
        where: { id: runId },
        data: { status: 'done' },
      })
      broadcastToProject(projectId, { event: 'workflow:completed', runId })
      emitWorkflowCompleted(projectId, runId).catch(() => {})
      return reply.send({ status: 'workflow_completed' })
    }
  })

  // ✅ GET single run by ID — verify it belongs to the requesting user
  app.get('/runs/:id', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const run = await prisma.workflowRun.findFirst({
      where: {
        id: req.params.id,
        triggeredByUserId: user.id,
      },
      include: {
        blockOutputs: {
          orderBy: { createdAt: 'asc' },
        }
      },
    })

    if (!run) return reply.code(404).send({ error: 'Workflow not found' })
    return run
  })

  // ✅ PATCH /runs/:id/status — update run status
  app.patch('/runs/:id/status', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const { status } = req.body as { status: string }

    const run = await prisma.workflowRun.findFirst({
      where: { id: req.params.id, triggeredByUserId: user.id }
    })
    if (!run) return reply.code(404).send({ error: 'Run not found' })

    const updated = await prisma.workflowRun.update({
      where: { id: req.params.id },
      data: { status: status as any },
    })

    return updated
  })
}