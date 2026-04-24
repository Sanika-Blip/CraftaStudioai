import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyClerk } from '../middleware/clerkAuth'
// NOTE: No DB access needed here — plan generation only calls the agent/LLM service

const PlanDocSchema = z.object({
  prompt: z.string().min(5),
  project_name: z.string().optional().default('My Project'),
})

export async function planRoutes(app: FastifyInstance) {

  /**
   * POST /api/plan
   * Verifies Clerk JWT, then proxies to agents /api/v1/plan/doc.
   * Does NOT touch the database — no getOrCreateUser call.
   */
  app.post('/', { preHandler: verifyClerk }, async (req: any, reply) => {

    const parsed = PlanDocSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const agentUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000'

    try {
      console.log(`[plan] Calling agent at ${agentUrl}/api/v1/plan/doc with prompt: "${parsed.data.prompt.slice(0, 60)}..."`)

      const agentRes = await fetch(`${agentUrl}/api/v1/plan/doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(60_000), // 60s timeout for LLM
      })

      if (!agentRes.ok) {
        const err = await agentRes.text()
        console.error('[plan] Agent service error:', agentRes.status, err)
        return reply.code(agentRes.status).send({ error: 'Agent service failed', details: err })
      }

      const plan = await agentRes.json() as any
      console.log(`[plan] Success — got plan: "${plan.title}" with ${plan.blocks?.length ?? 0} blocks`)
      return reply.send(plan)

    } catch (err: any) {
      console.error('[plan] Failed to reach agent service:', err.message)
      return reply.code(503).send({ error: 'Agent service unavailable', message: err.message })
    }
  })
}
