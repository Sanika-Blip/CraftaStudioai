/**
 * App — src/app.ts
 *
 * CHANGED: onReady hook now runs inference warm-up for projects that
 * have blocks but zero connections. This fixes the edges=0 problem
 * automatically on every server restart.
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import rateLimit from '@fastify/rate-limit'

import { blocksRoutes }      from './routes/blocks'
import { connectionsRoutes } from './routes/connections'
import { workflowRoutes }    from './routes/workflow'
import { authRoutes }        from './routes/auth'
import { projectsRoutes }    from './routes/projects'
import { userRoutes }        from './routes/user'
import { generateRoutes }    from './routes/generate'
import { wsRoutes }          from './routes/ws'
import { mergeRoutes }       from './routes/merge'
import { planRoutes }        from './routes/plan'
import { memoryRoutes }      from './routes/memory'
import { documentRoutes }    from './routes/document'
import { graphRoutes }       from './routes/graph'
import { graphRegistry }     from './graph/graphEngine'
import { inferConnections }  from './graph/connectionInference'

export async function buildServer() {
  const app = Fastify({
    logger: { level: process.env['LOG_LEVEL'] ?? 'info' },
  })

  // ── Plugins ────────────────────────────────────────────────────────────

  await app.register(rateLimit, {
    max:          100,
    timeWindow:   '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error:      'Too Many Requests',
      message:    'You have exceeded the request limit. Please slow down.',
    }),
  })

  await app.register(cors, {
    origin:      true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  await app.register(websocket)

  // ── Error handler ──────────────────────────────────────────────────────

  app.setErrorHandler((error: unknown, request, reply) => {
    const err        = error as { statusCode?: number; name?: string; message?: string }
    const statusCode = err.statusCode ?? 500

    console.error({ err, method: request.method, url: request.url, statusCode })

    return reply.code(statusCode).send({
      statusCode,
      error:   err.name    ?? 'Internal Server Error',
      message: err.message ?? 'An unexpected error occurred',
    })
  })

  // ── Routes ──────────────────────────────────────────────────────────────

  await app.register(authRoutes,        { prefix: '/api/auth' })
  await app.register(blocksRoutes,      { prefix: '/api/blocks' })
  await app.register(connectionsRoutes, { prefix: '/api/connections' })
  await app.register(workflowRoutes,    { prefix: '/api/workflow' })
  await app.register(projectsRoutes,    { prefix: '/api/projects' })
  await app.register(userRoutes,        { prefix: '/api' })
  await app.register(generateRoutes,    { prefix: '/api/projects' })
  await app.register(mergeRoutes,       { prefix: '/api/projects' })
  await app.register(wsRoutes,          { prefix: '/api/ws' })
  await app.register(planRoutes,        { prefix: '/api/plan' })
  await app.register(memoryRoutes,      { prefix: '/api/memory' })
  await app.register(documentRoutes,    { prefix: '/api/projects' })
  await app.register(graphRoutes,       { prefix: '/api/graph' })

  // ── Startup: Graph Cache Warm-up + Inference Repair ───────────────────

  app.addHook('onReady', async () => {
    const { default: prisma } = await import('./lib/prisma')

    try {
      // 1. Find active projects from last 7 days
      const activeProjects = await prisma.project.findMany({
        where: {
          workflowRuns: {
            some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          },
        },
        select: { id: true },
        take: 20,
      })

      console.log(`[startup] Pre-warming graph cache for ${activeProjects.length} active projects`)
      await Promise.allSettled(activeProjects.map(p => graphRegistry.get(p.id)))
      console.log('[startup] Graph cache warm-up complete')

      // 2. Run inference repair for projects that have blocks but zero connections
      //    This is the "edges=0" fix — runs once at startup, idempotent.
      const projectsNeedingInference = await prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT b.project_id AS id
        FROM blocks b
        WHERE b.deleted_at IS NULL
          AND b.project_id NOT IN (
            SELECT DISTINCT c.project_id FROM connections c WHERE c.deleted_at IS NULL
          )
        LIMIT 20
      `

      if (projectsNeedingInference.length > 0) {
        console.log(
          `[startup] Running inference repair for ${projectsNeedingInference.length} projects with edges=0`
        )
        await Promise.allSettled(
          projectsNeedingInference.map(p =>
            inferConnections(p.id, 'system:startup', 0.65, false).catch(err =>
              console.error(`[startup] Inference failed for project=${p.id}:`, err)
            )
          )
        )
        console.log('[startup] Inference repair complete')
      }

    } catch (err) {
      console.error('[startup] Warm-up / inference repair failed (non-fatal):', err)
    }
  })

  // ── Health ──────────────────────────────────────────────────────────────

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))
  app.get('/',       async () => ({ message: 'Backend is running 🚀' }))

  return app
}