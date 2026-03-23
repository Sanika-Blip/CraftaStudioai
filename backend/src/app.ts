// CraftaStudio — src/app.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'

import { blocksRoutes } from './routes/blocks'
import { connectionsRoutes } from './routes/connections'
import { workflowRoutes } from './routes/workflow'

/**
 * Builds and configures the Fastify server instance.
 *
 * Plugins registered:
 *  - @fastify/cors — controlled by CORS_ORIGIN env variable
 *  - @fastify/websocket — for live agent status streaming
 *
 * Routes:
 *  - /api/blocks
 *  - /api/connections
 *  - /api/workflow
 */
async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  })

  // ── Plugins ────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  await app.register(websocket)

  // ── Routes ─────────────────────────────────────────────────
  await app.register(blocksRoutes, { prefix: '/api/blocks' })
  await app.register(connectionsRoutes, { prefix: '/api/connections' })
  await app.register(workflowRoutes, { prefix: '/api/workflow' })

  // ── Health check ───────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  return app
}

/**
 * Entry point — starts the HTTP server on the configured port.
 */
async function main() {
  const server = await buildServer()
  const port = Number(process.env['PORT'] ?? 3001)
  const host = process.env['HOST'] ?? '0.0.0.0'

  try {
    await server.listen({ port, host })
    server.log.info(`CraftaStudio backend listening on ${host}:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

void main()
