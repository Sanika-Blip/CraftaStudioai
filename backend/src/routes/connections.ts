// CraftaStudio — src/routes/connections.ts
import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

/** Zod schema for creating a connection edge */
const CreateConnectionSchema = z.object({
  projectId:      z.string().uuid(),
  fromBlockId:    z.string().uuid(),
  toBlockId:      z.string().uuid(),
  connectionType: z.enum(['dependency', 'data-flow', 'event']).default('dependency'),
})

/**
 * Registers CRUD routes for Connection (edge) resources.
 *
 * Routes:
 *  GET    /api/connections?projectId=uuid  — list all edges for a project
 *  POST   /api/connections                 — create an edge (with cycle check)
 *  DELETE /api/connections/:id             — remove an edge
 *
 * @param app - Fastify server instance
 */
export async function connectionsRoutes(app: FastifyInstance) {
  /** GET /api/connections?projectId=uuid */
  app.get<{ Querystring: { projectId: string } }>('/', async (req, reply) => {
    const { projectId } = req.query

    if (!projectId) {
      return reply.code(400).send({ error: 'projectId query param is required' })
    }

    const connections = await prisma.connection.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    })

    return connections
  })

  /** POST /api/connections */
  app.post('/', async (req, reply) => {
    const parsed = CreateConnectionSchema.safeParse(req.body)

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    // TODO: Run cycleDetection.pathExists(fromBlockId, toBlockId) before creating
    // to prevent circular dependencies in the block graph.

    try {
      const connection = await prisma.connection.create({
        data: {
          projectId:      parsed.data.projectId,
          fromBlockId:    parsed.data.fromBlockId,
          toBlockId:      parsed.data.toBlockId,
          connectionType: parsed.data.connectionType,
        },
      })
      return reply.code(201).send(connection)
    } catch (err: unknown) {
      // Prisma unique constraint violation — duplicate edge
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
        return reply.code(409).send({ error: 'Connection already exists between these blocks' })
      }
      throw err
    }
  })

  /** DELETE /api/connections/:id */
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await prisma.connection.delete({ where: { id: req.params.id } })
    return reply.code(204).send()
  })
}
