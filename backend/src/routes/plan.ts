import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyClerk } from '../middleware/clerkAuth'
import prisma from '../lib/prisma'
import { BLOCK_TYPES } from '../../../shared/types/blocks'

const PlanDocSchema = z.object({
  prompt: z.string().min(2),
  project_name: z.string().optional().default('My Project'),
  projectId: z.string().uuid().optional(),
})

// Normalise any block type string the LLM returns to one we support
const VALID_TYPES = new Set(BLOCK_TYPES)
function normaliseType(raw: string): string {
  const lower = (raw ?? '').toLowerCase().replace(/[^a-z]/g, '_')
  if (VALID_TYPES.has(lower as any)) return lower
  if (lower.includes('front') || lower.includes('ui')) return 'frontend'
  if (lower.includes('back') || lower.includes('api')) return 'backend'
  if (lower.includes('auth')) return 'auth'
  if (lower.includes('db') || lower.includes('data')) return 'database'
  return 'backend' // safe fallback
}

export async function planRoutes(app: FastifyInstance) {

  /**
   * POST /api/plan
   * 1. Calls the agent to generate a plan.
   * 2. Saves plan blocks to DB (upsert by type) so Implement This has blockIds.
   * 3. Returns plan + saved block IDs to the frontend.
   */
  app.post('/', { preHandler: verifyClerk }, async (req: any, reply) => {

    const parsed = PlanDocSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    // Resolve at request time so .env changes are always picked up
    const agentUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000'

    try {
      console.log(`[plan] Calling agent at ${agentUrl}/api/v1/plan/doc`)

      const agentRes = await fetch(`${agentUrl}/api/v1/plan/doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: parsed.data.prompt, project_name: parsed.data.project_name }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!agentRes.ok) {
        const err = await agentRes.text()
        console.error('[plan] Agent error:', agentRes.status, err)
        return reply.code(agentRes.status).send({ error: 'Agent service failed', details: err })
      }

      const plan = await agentRes.json() as any
      console.log(`[plan] Got plan "${plan.title}" with ${plan.blocks?.length ?? 0} blocks`)

      // ── Persist blocks to DB so Implement has real blockIds ────────────────
      let savedBlocks: Array<{ dbId: string; blockType: string; idx: number }> = []
      const projectId = parsed.data.projectId ?? null

      if (projectId && plan.blocks?.length > 0) {
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (project) {
          for (let i = 0; i < plan.blocks.length; i++) {
            const block = plan.blocks[i]
            const blockType = normaliseType(block.type ?? block.blockType ?? 'backend')
            const blockJson = {
              title: block.title ?? blockType,
              stack: block.stack ?? '',
              description: block.description ?? '',
              status: 'idle',
              subBlocks: block.subBlocks ?? [],
            }
            try {
              const saved = await prisma.block.upsert({
                where: { projectId_blockType: { projectId, blockType } },
                create: { projectId, blockType, blockJson },
                update: { blockJson },
              })
              savedBlocks.push({ dbId: saved.id, blockType, idx: i })
            } catch (e: any) {
              console.warn(`[plan] Block save failed (${blockType}):`, e.message)
            }
          }
          console.log(`[plan] Persisted ${savedBlocks.length} blocks to DB`)
        }
      }

      // Enrich plan blocks with their real DB IDs
      const enrichedBlocks = (plan.blocks ?? []).map((b: any, i: number) => {
        const saved = savedBlocks.find(s => s.idx === i)
        return {
          ...b,
          id: saved?.dbId ?? b.id,
          blockType: saved?.blockType ?? normaliseType(b.type ?? 'backend'),
        }
      })

      return reply.send({ ...plan, blocks: enrichedBlocks, projectId })

    } catch (err: any) {
      console.error('[plan] Failed to reach agent:', err.message)
      return reply.code(503).send({ error: 'Agent service unavailable', message: err.message })
    }
  })
}
