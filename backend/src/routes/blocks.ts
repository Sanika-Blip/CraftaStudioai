/**
 * Blocks Routes — src/routes/blocks.ts
 *
 * CHANGED: POST / now calls autoWireNewBlock after block creation.
 * This auto-connects the new block into the existing graph via inference
 * at high confidence (>= 0.75) immediately after creation.
 */

import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma'
import type { InputJsonValue } from '@prisma/client/runtime/library'
import { verifyClerk } from '../middleware/clerkAuth'
import { getOrCreateUser } from '../lib/getOrCreateUser'
import { emitBlockCreated, emitBlockDeleted } from '../graph/graphEvents'
import { autoWireNewBlock } from '../graph/connectionInference'

// ─────────────────────────────────────────────────────────────────────────────

export const BLOCK_TYPES = ['database', 'backend', 'api', 'ui', 'auth', 'frontend'] as const
export type BlockType = typeof BLOCK_TYPES[number]

const CreateBlockSchema = z.object({
  projectId: z.string().uuid(),
  blockType:  z.enum(BLOCK_TYPES),
  blockJson:  z.record(z.unknown()),
})

// ─────────────────────────────────────────────────────────────────────────────

export async function blocksRoutes(app: FastifyInstance) {

  /** GET all blocks */
  app.get('/', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    await getOrCreateUser(req.user.sub)
    const { projectId } = req.query as { projectId?: string }
    if (!projectId) return reply.code(400).send({ error: 'projectId is required' })

    const blocks = await prisma.block.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    })
    return reply.send(blocks)
  })

  /** GET block by id */
  app.get('/:id', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    await getOrCreateUser(req.user.sub)
    const { id } = req.params as { id: string }

    const block = await prisma.block.findUnique({ where: { id } })
    if (!block) return reply.code(404).send({ error: 'Block not found' })
    return reply.send(block)
  })

  /** CREATE block + auto-wire into graph */
  app.post('/', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)

    const parsed = CreateBlockSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() })

    const block = await prisma.block.create({
      data: {
        projectId: parsed.data.projectId,
        blockType:  parsed.data.blockType,
        blockJson:  parsed.data.blockJson as InputJsonValue,
      },
    })

    // Fire graph event + auto-wire (both non-blocking)
    emitBlockCreated(parsed.data.projectId, block.id, block.blockType, clerkId).catch(
      err => console.error('[blocks] emitBlockCreated failed:', err)
    )

    // Auto-wire: connect the new block into the existing graph at high confidence
    autoWireNewBlock(parsed.data.projectId, block.id, clerkId).catch(
      err => console.error('[blocks] autoWireNewBlock failed:', err)
    )

    return reply.code(201).send(block)
  })

  /** UPDATE block */
  app.patch('/:id', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    await getOrCreateUser(req.user.sub)
    const { id } = req.params as { id: string }

    const parsed = z.object({ blockJson: z.record(z.unknown()) }).safeParse(req.body)
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() })

    const block = await prisma.block.update({
      where: { id },
      data:  { blockJson: parsed.data.blockJson as InputJsonValue },
    })
    return reply.send(block)
  })

  /** GET latest generated output */
  app.get('/:id/output', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    await getOrCreateUser(req.user.sub)
    const { id: blockId } = req.params as { id: string }
    const { runId }        = req.query  as { runId?: string }

    const where = runId ? { blockId, runId } : { blockId }
    const output = await prisma.blockOutput.findFirst({ where, orderBy: { createdAt: 'desc' } })
    if (!output) return reply.code(404).send({ error: 'No output found for this block' })
    return reply.send(output)
  })

  /** GET output history */
  app.get('/:id/outputs', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    await getOrCreateUser(req.user.sub)
    const { id: blockId } = req.params as { id: string }

    const outputs = await prisma.blockOutput.findMany({
      where:   { blockId },
      orderBy: { createdAt: 'desc' },
      take:    10,
    })
    return reply.send(outputs)
  })

  /** DELETE block */
  app.delete('/:id', { preHandler: verifyClerk }, async (req: FastifyRequest, reply) => {
    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)
    const { id } = req.params as { id: string }

    const block = await prisma.block.findUnique({ where: { id }, select: { projectId: true } })
    await prisma.block.delete({ where: { id } })

    if (block) {
      emitBlockDeleted(block.projectId, id, clerkId).catch(
        err => console.error('[blocks] emitBlockDeleted failed:', err)
      )
    }
    return reply.code(204).send()
  })
}