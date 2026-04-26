import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { blockGenerationQueue, generationJobsQueue } from '../queue/blockQueue'
import prisma from '../lib/prisma'
import { verifyClerk } from "../middleware/clerkAuth"
import { getOrCreateUser } from "../lib/getOrCreateUser"

const RunWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(2),
})

export async function workflowRoutes(app: FastifyInstance) {

  /** RUN workflow — queues one generation job per saved block */
  app.post('/run', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)

    const parsed = RunWorkflowSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const { projectId, prompt } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' })
    }

    // Fetch the blocks that were saved during /api/plan
    const blocks = await prisma.block.findMany({ where: { projectId } })

    if (blocks.length === 0) {
      console.warn(`[workflow] No blocks found for project ${projectId} — did /api/plan save them?`)
      return reply.code(400).send({ error: 'No blocks found. Please generate a plan first.' })
    }

    console.log(`[workflow] Found ${blocks.length} blocks, creating run...`)

    const run = await prisma.workflowRun.create({
      data: { projectId, prompt, status: 'running', sharedContextJson: {} },
    })

    // Queue one job per block
    for (const block of blocks) {
      await generationJobsQueue.add('generate-block', {
        runId: run.id,
        projectId,
        blockId: block.id,
        blockType: block.blockType,
        blockJson: block.blockJson,
        prompt,
      })
      console.log(`[workflow] Queued job for block ${block.blockType} (${block.id})`)
    }

    return reply.code(202).send({
      runId: run.id,
      status: 'running',
      blockCount: blocks.length,
    })
  })

  /** GET workflow result */
  app.get('/runs/:id', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)

    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.id },
      include: { blockOutputs: true },
    })

    if (!run) return reply.code(404).send({ error: 'Workflow not found' })
    return run
  })
}