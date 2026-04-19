import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { pathExists } from '../graph/cycleDetection'
import { verifyClerk } from "../middleware/clerkAuth";
import { getOrCreateUser } from "../lib/getOrCreateUser";

const CreateConnectionSchema = z.object({
  projectId: z.string().uuid(),
  fromBlockId: z.string().uuid(),
  toBlockId: z.string().uuid(),
  connectionType: z.enum(['dependency', 'data_flow', 'trigger']).default('dependency'),
})

export async function connectionsRoutes(app: FastifyInstance) {

  /** GET connections */
  app.get('/', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { projectId } = req.query;

    if (!projectId) {
      return reply.code(400).send({ error: 'projectId required' });
    }

    const connections = await prisma.connection.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return connections;
  });

  /** CREATE connection */
  app.post('/', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const parsed = CreateConnectionSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() });
    }

    const { projectId, fromBlockId, toBlockId } = parsed.data;

    const wouldCycle = await pathExists(projectId, fromBlockId, toBlockId);

    if (wouldCycle) {
      return reply.code(409).send({
        error: 'Cycle detected in graph',
      });
    }

    try {
      const connection = await prisma.connection.create({
        data: parsed.data,
      });

      return reply.code(201).send(connection);
    } catch (err: any) {
      if (err.code === 'P2002') {
        return reply.code(409).send({ error: 'Connection already exists' });
      }
      throw err;
    }
  });

  /** DELETE connection */
  app.delete('/:id', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    await prisma.connection.delete({
      where: { id: req.params.id },
    });

    return reply.code(204).send();
  });
}