import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { blockGenerationQueue } from '../queue/blockQueue'
import prisma from '../lib/prisma'
import { verifyClerk } from "../middleware/clerkAuth";
import { getOrCreateUser } from "../lib/getOrCreateUser";

const RunWorkflowSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(2),
})

export async function workflowRoutes(app: FastifyInstance) {

  /** RUN workflow */
  app.post('/run', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const parsed = RunWorkflowSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() });
    }

    const { projectId, prompt } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const run = await prisma.workflowRun.create({
      data: { projectId, prompt, status: 'pending', sharedContextJson: {} },
    });

    await blockGenerationQueue.add('orchestrate', {
      runId: run.id,
      projectId,
      prompt,
    });

    return reply.code(202).send({
      runId: run.id,
      status: 'pending',
    });
  });

  /** GET workflow result */
  app.get('/runs/:id', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.id },
      include: { blockOutputs: true },
    });

    if (!run) {
      return reply.code(404).send({ error: 'Workflow not found' });
    }

    return run;
  });
}