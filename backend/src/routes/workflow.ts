import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generationJobsQueue } from '../queue/blockQueue'
import prisma from '../lib/prisma'
import { verifyClerk } from "../middleware/clerkAuth"
import { getOrCreateUser } from "../lib/getOrCreateUser"

const RunWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(2),
})

export async function workflowRoutes(app: FastifyInstance) {

  // ✅ GET all runs for a project — filtered by the authenticated user
  app.get('/runs', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const { projectId } = req.query as { projectId?: string }
    if (!projectId) return reply.code(400).send({ error: 'projectId is required' })

    // ✅ Only return runs triggered by THIS user — no data leakage between users
    const runs = await prisma.workflowRun.findMany({
      where: {
        projectId,
        triggeredByUserId: user.id,   // ← per-user filter
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
            outputCode: true,  // included for loading a run into editor
          },
          orderBy: { createdAt: 'asc' },
        }
      }
    })

    return runs
  })

  // ✅ POST /run — trigger a new workflow run
  app.post('/run', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const parsed = RunWorkflowSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() })

    const { projectId, prompt } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.code(404).send({ error: 'Project not found' })

    const blocks = await prisma.block.findMany({ where: { projectId } })
    if (blocks.length === 0) {
      return reply.code(400).send({ error: 'No blocks found. Please generate a plan first.' })
    }

    const run = await prisma.workflowRun.create({
      data: {
        projectId,
        prompt,
        status: 'running',
        sharedContextJson: {},
        triggeredByUserId: user.id,   // ✅ tied to this user
      }
    })

    for (const block of blocks) {
      await generationJobsQueue.add('generate-block', {
        runId: run.id,
        projectId,
        blockId: block.id,
        blockType: block.blockType,
        blockJson: block.blockJson,
        prompt,
      })
    }

    // ✅ Update run status to done after queuing (worker handles individual blocks)
    return reply.code(202).send({
      runId: run.id,
      status: 'running',
      blockCount: blocks.length,
    })
  })

  // ✅ GET single run by ID — verify it belongs to the requesting user
  app.get('/runs/:id', { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub
    const user = await getOrCreateUser(clerkId)

    const run = await prisma.workflowRun.findFirst({
      where: {
        id: req.params.id,
        triggeredByUserId: user.id,   // ✅ security check
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

  // ✅ PATCH /runs/:id/status — update run status (called by worker when all blocks done)
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