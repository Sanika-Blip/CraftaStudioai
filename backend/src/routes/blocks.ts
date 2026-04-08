// CraftaStudio — src/routes/blocks.ts
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { BLOCK_TYPES } from '../../../shared/types/blocks'
import prisma from '../lib/prisma'

/** Zod schema for creating a new block */
const CreateBlockSchema = z.object({
  projectId: z.string().uuid(),
  blockType: z.enum(BLOCK_TYPES),
  blockJson: z.record(z.unknown()),
})

/**
 * Registers all CRUD routes for Block resources.
 *
 * Routes:
 *  GET    /api/blocks?projectId=uuid   — list all blocks for a project
 *  GET    /api/blocks/:id              — get one block by ID
 *  POST   /api/blocks                  — create a block
 *  PATCH  /api/blocks/:id              — update block JSON
 *  DELETE /api/blocks/:id              — soft-delete a block
 *
 * @param app - Fastify server instance
 */
export async function blocksRoutes(app: FastifyInstance) {
  /** GET /api/blocks?projectId=uuid */
  app.get<{ Querystring: { projectId: string } }>('/', async (req, reply) => {
    const { projectId } = req.query

    if (!projectId) {
      return reply.code(400).send({ error: 'projectId query param is required' })
    }

    const blocks = await prisma.block.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    })

    return blocks
  })

  /** GET /api/blocks/:id */
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const block = await prisma.block.findUnique({ where: { id: req.params.id } })

    if (!block) {
      return reply.code(404).send({ error: 'Block not found' })
    }

    return block
  })

  /** POST /api/blocks */
  app.post('/', async (req, reply) => {
    const parsed = CreateBlockSchema.safeParse(req.body)

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const block = await prisma.block.create({
      data: {
        projectId: parsed.data.projectId,
        blockType: parsed.data.blockType,
        blockJson: parsed.data.blockJson as any,
      },
    })

    return reply.code(201).send(block)
  })

  /** PATCH /api/blocks/:id */
  app.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const body = z.object({ blockJson: z.record(z.unknown()) }).safeParse(req.body)

    if (!body.success) {
      return reply.code(422).send({ error: body.error.flatten() })
    }

    const block = await prisma.block.update({
      where: { id: req.params.id },
      data: { blockJson: body.data.blockJson as any },
    })

    return block
  })

  /** DELETE /api/blocks/:id */
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await prisma.block.delete({ where: { id: req.params.id } })
    return reply.code(204).send()
  })
}
