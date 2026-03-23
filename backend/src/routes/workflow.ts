// CraftaStudio — src/routes/workflow.ts
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { blockQueue } from '../queue/blockQueue'
import prisma from '../lib/prisma'

/** Zod schema for a workflow run request */
const RunWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  prompt:    z.string().min(10, 'Prompt must be at least 10 characters'),
})

/**
 * Registers the workflow execution routes.
 *
 * Routes:
 *  POST /api/workflow/run          — triggers a new AI generation pipeline run
 *  GET  /api/workflow/runs/:id     — get status and outputs of a specific run
 *
 * @param app - Fastify server instance
 */
export async function workflowRoutes(app: FastifyInstance) {
  /**
   * POST /api/workflow/run
   *
   * Flow:
   *  1. Validate request body
   *  2. Create a WorkflowRun record in DB (status: queued)
   *  3. Enqueue a job on the BullMQ blockQueue
   *  4. Return the runId immediately — client polls or listens via WS
   */
  app.post('/run', async (req, reply) => {
    const parsed = RunWorkflowSchema.safeParse(req.body)

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const { projectId, prompt } = parsed.data

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' })
    }

    // Create the run record
    const run = await prisma.workflowRun.create({
      data: { projectId, prompt, status: 'queued' },
    })

    // Enqueue the orchestration job
    await blockQueue.add('orchestrate', { runId: run.id, projectId, prompt }, {
      jobId: run.id,
      removeOnComplete: false,
      removeOnFail: false,
    })

    return reply.code(202).send({ runId: run.id, status: 'queued' })
  })

  /**
   * GET /api/workflow/runs/:id
   * Returns the WorkflowRun plus all associated BlockOutputs.
   */
  app.get<{ Params: { id: string } }>('/runs/:id', async (req, reply) => {
    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.id },
      include: { blockOutputs: true },
    })

    if (!run) {
      return reply.code(404).send({ error: 'WorkflowRun not found' })
    }

    return run
  })
}
