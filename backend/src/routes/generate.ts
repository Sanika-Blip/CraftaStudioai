import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { verifyClerk } from '../middleware/clerkAuth'
import { getOrCreateUser } from '../lib/getOrCreateUser'
import { blockGenerationQueue } from '../queue/blockQueue'
import { langfuse } from '../lib/langfuse'

const GenerateSchema = z.object({
  prompt: z.string().min(1),
})

export async function generateRoutes(app: FastifyInstance) {

  app.post('/:id/generate', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)

    const { id: projectId } = req.params

    const parsed = GenerateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const { prompt } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.code(404).send({ error: 'Project not found' })

    const blocks = await prisma.block.findMany({ where: { projectId } })
    if (blocks.length === 0) return reply.code(400).send({ error: 'No blocks found in this project' })

    const run = await prisma.workflowRun.create({
      data: { projectId, prompt, status: 'pending', sharedContextJson: {} },
    })

    // Create Langfuse trace for this generation run
    const trace = langfuse.trace({
      name: 'block-generation',
      id: run.id,
      userId: clerkId,
      metadata: { projectId, prompt, blockCount: blocks.length },
    })

    // Enqueue one job per block with trace_id attached
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
        })
      )
    )

    await langfuse.flushAsync()

    const jobIds = jobs.map((job) => job.id)
    console.log(`[generate] Enqueued ${jobIds.length} jobs for project ${projectId}, runId: ${run.id}, traceId: ${trace.id}`)

    return reply.code(202).send({
      message: `${jobIds.length} blocks queued for generation`,
      projectId,
      runId: run.id,
      traceId: trace.id,
      jobIds,
    })
  })
}