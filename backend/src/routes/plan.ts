import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyClerk } from '../middleware/clerkAuth'
import prisma from '../lib/prisma'
import { BLOCK_TYPES } from '../shared/types/blocks'

const PlanDocSchema = z.object({
  prompt: z.string().min(2),
  project_name: z.string().optional().default('My Project'),
  projectId: z.string().uuid().optional().nullable(),
})

// Convert title → slug
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'block'
}

export async function planRoutes(app: FastifyInstance) {

  app.post('/', { preHandler: verifyClerk }, async (req: any, reply) => {

    const parsed = PlanDocSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const agentUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000'

    try {
      console.log(`[plan] → ${agentUrl}/api/v1/plan/doc — "${parsed.data.prompt.slice(0, 60)}"`)

      const agentRes = await fetch(`${agentUrl}/api/v1/plan/doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: parsed.data.prompt,
          project_name: parsed.data.project_name
        }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!agentRes.ok) {
        const err = await agentRes.text()
        console.error('[plan] Agent error:', agentRes.status, err)
        return reply.code(agentRes.status).send({ error: 'Agent service failed', details: err })
      }

      const plan = await agentRes.json() as any
      console.log(`[plan] Got "${plan.title}" with ${plan.blocks?.length ?? 0} blocks`)

      let savedBlocks: Array<{ dbId: string; blockType: string; idx: number }> = []
      const projectId = parsed.data.projectId ?? null

      // ✅ Get valid block type values
      const validTypes = BLOCK_TYPES

      if (projectId && plan.blocks?.length > 0) {

        // Save planDoc
        await prisma.project.update({
          where: { id: projectId },
          data: { planDoc: plan.markdown }
        })

        // Remove old blocks
        await prisma.block.deleteMany({ where: { projectId } })

        for (let i = 0; i < plan.blocks.length; i++) {
          const block = plan.blocks[i]

          const rawType = slugifyTitle(
            block.blockType ?? block.title ?? `block-${i}`
          )

          // ✅ Validate enum
          const blockType = validTypes.includes(rawType as any)
            ? rawType
            : 'ui'

          const blockJson = {
            title: block.title ?? rawType,
            stack: block.stack ?? '',
            description: block.description ?? '',
            status: 'idle',
            subBlocks: block.subBlocks ?? [],
            originalType: block.type ?? 'block',
          }

          try {
            const saved = await prisma.block.create({
              data: {
                projectId,
                blockType,
                blockJson,
              },
            })

            savedBlocks.push({
              dbId: saved.id,
              blockType,
              idx: i
            })

            console.log(`[plan] Saved block: ${blockType} (${saved.id})`)

          } catch (e: any) {
            console.warn(`[plan] Block save failed (${blockType}):`, e.message)
          }
        }

        console.log(`[plan] ✅ ${savedBlocks.length}/${plan.blocks.length} blocks saved`)
      }

      // Enrich response with DB IDs
      const enrichedBlocks = (plan.blocks ?? []).map((b: any, i: number) => {
        const saved = savedBlocks.find(s => s.idx === i)
        return {
          ...b,
          id: saved?.dbId ?? b.id,
          blockType: saved?.blockType ?? slugifyTitle(b.blockType ?? b.title ?? `block-${i}`),
        }
      })

      return reply.send({
        ...plan,
        blocks: enrichedBlocks,
        projectId
      })

    } catch (err: any) {
      console.error('[plan] Agent unreachable:', err.message)
      return reply.code(503).send({
        error: 'Agent service unavailable',
        message: err.message
      })
    }
  })
}