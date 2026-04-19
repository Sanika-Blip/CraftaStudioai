import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import rateLimit from '@fastify/rate-limit'

import { blocksRoutes } from './routes/blocks'
import { connectionsRoutes } from './routes/connections'
import { workflowRoutes } from './routes/workflow'
import { authRoutes } from './routes/auth'
import { projectsRoutes } from './routes/projects'
import { userRoutes } from './routes/user'
import { generateRoutes } from './routes/generate'
import { wsRoutes } from './routes/ws'
import { mergeRoutes } from './routes/merge'

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  })

  // ── Rate Limiting ──
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You have exceeded the request limit. Please slow down.',
    }),
  })

  // ── CORS ──
  await app.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  await app.register(websocket)

  // ── Global Error Handler ──
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500

    app.log.error({
      err: error,
      method: request.method,
      url: request.url,
      statusCode,
    })

    return reply.code(statusCode).send({
      statusCode,
      error: error.name ?? 'Internal Server Error',
      message: error.message ?? 'An unexpected error occurred',
    })
  })

  // ── Routes ──
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(blocksRoutes, { prefix: '/api/blocks' })
  await app.register(connectionsRoutes, { prefix: '/api/connections' })
  await app.register(workflowRoutes, { prefix: '/api/workflow' })
  await app.register(projectsRoutes, { prefix: '/api/projects' })
  await app.register(userRoutes, { prefix: '/api' })
  await app.register(generateRoutes, { prefix: '/api/projects' })
  await app.register(mergeRoutes, { prefix: '/api/projects' })
  await app.register(wsRoutes, { prefix: '/api/ws' })

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))
  app.get('/', async () => {
    return { message: "Backend is running 🚀" }
  })

  return app
}