import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyClerk } from '../middleware/clerkAuth'
import { getOrCreateUser } from '../lib/getOrCreateUser'

const PlanDocSchema = z.object({
  prompt: z.string().min(5),
  project_name: z.string().optional().default('My Project'),
})

export async function planRoutes(app: FastifyInstance) {

  /**
   * POST /api/plan
   * Authenticated proxy to the agents /api/v1/plan/doc endpoint.
   * Calls Sarvam LLM and returns a structured architecture plan.
   */
  app.post('/', { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub
    await getOrCreateUser(clerkId)

    const parsed = PlanDocSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() })
    }

    const agentUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000'

    try {
      const agentRes = await fetch(`${agentUrl}/api/v1/plan/doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(30_000), // 30s timeout for LLM
      })

      if (!agentRes.ok) {
        const err = await agentRes.text()
        console.error('[plan] Agent service error:', err)
        return reply.code(agentRes.status).send({ error: 'Agent service failed', details: err })
      }

      const plan = await agentRes.json()
      return reply.send(plan)

    } catch (err: any) {
      console.error('[plan] Failed to reach agent service:', err.message)
      return reply.code(503).send({ error: 'Agent service unavailable', message: err.message })
    }
  })
}
