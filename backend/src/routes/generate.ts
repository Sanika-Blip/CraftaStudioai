import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { verifyClerk } from '../middleware/clerkAuth'
import { getOrCreateUser } from '../lib/getOrCreateUser'
import { blockGenerationQueue } from '../queue/blockQueue'
import { langfuse } from '../lib/langfuse'
import { processAndStoreMemory } from '../memory/memoryService'
import { buildMemoryContext } from '../memory/memoryRetriever'

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000'

const GenerateSchema = z.object({
  prompt: z.string().min(1),
})

export async function generateRoutes(app: FastifyInstance) {

  app.post('/:id/generate', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const { id: projectId } = req.params

    const parsed = GenerateSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() })

    const { prompt } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.code(404).send({ error: 'Project not found' })

    const blocks = await prisma.block.findMany({ where: { projectId } })
    if (blocks.length === 0) return reply.code(400).send({ error: 'No blocks found in this project' })

    // ── Document Approval Check ─────────────────────────────────────────────
    const document = await prisma.projectDocument.findUnique({ where: { projectId } })
    if (!document || document.status !== 'approved') {
      return reply.code(400).send({
        error: 'Document not approved',
        message: 'Please generate and approve the project document before starting code generation',
        hint: 'POST /api/projects/:id/document → review → POST /api/projects/:id/document/approve',
      })
    }

    // ── Step 2-7: Extract signals from prompt and store in memory ──────────
    await processAndStoreMemory(projectId, prompt, 'user')

    // ── Step 8-9: Retrieve memory context for this project ─────────────────
    const memoryContext = await buildMemoryContext(projectId)

    // Create WorkflowRun with memory context injected
    const run = await prisma.workflowRun.create({
      data: {
        projectId,
        prompt,
        status: 'pending',
        sharedContextJson: { memoryContext } as any,
        triggeredByUserId: user.id,
      },
    })

    // Create Langfuse trace
    const trace = langfuse.trace({
      name: 'block-generation',
      id: run.id,
      userId: clerkId,
      metadata: {
        projectId,
        prompt,
        blockCount: blocks.length,
        memoryKeys: Object.keys(memoryContext),
        documentVersion: document.version,
      },
    })

    // ── Step 1: Call Planner Agent ──────────────────────────────────────────
    let sharedContext: object = { memoryContext }
    try {
      console.log(`[generate] Calling planner for project ${projectId}`)

      const planRes = await fetch(`${AGENT_URL}/api/v1/plan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: run.id,
          project_name: project.name,
          prompt,
          block_types: blocks.map(b => b.blockType),
          memory_context: memoryContext,
          document_content: document.content,
        }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!planRes.ok) {
        console.warn(`[generate] Planner returned ${planRes.status} — using memory context only`)
      } else {
        const planData = await planRes.json() as { shared_context: object }
        sharedContext = { ...planData.shared_context, memoryContext }

        await prisma.workflowRun.update({
          where: { id: run.id },
          data: { sharedContextJson: sharedContext as any },
        })

        console.log(`[generate] SharedContext saved for runId: ${run.id}`)
      }
    } catch (err: any) {
      console.warn(`[generate] Planner call failed: ${err.message} — using memory context only`)
    }

    // ── Step 10: Enqueue jobs with memory-enriched shared context ──────────
    const jobs = await Promise.all(
      blocks.map((block) =>
        blockGenerationQueue.add('generate-block', {
          blockId: block.id,
          projectId,
          blockType: block.blockType,
          blockJson: block.blockJson,
          prompt,
          runId: run.id,
          traceId: trace.id,
          sharedContext,
          documentContent: document.content,
        })
      )
    )

    await langfuse.flushAsync()

    const jobIds = jobs.map((job) => job.id)
    console.log(`[generate] Enqueued ${jobIds.length} jobs, runId: ${run.id}, memoryKeys: ${Object.keys(memoryContext).join(', ')}`)

    return reply.code(202).send({
      message: `${jobIds.length} blocks queued for generation`,
      projectId,
      runId: run.id,
      traceId: trace.id,
      jobIds,
      memoryContext,
    })
  })
}