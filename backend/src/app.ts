import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'

import { blocksRoutes } from './routes/blocks'
import { connectionsRoutes } from './routes/connections'
import { workflowRoutes } from './routes/workflow'

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  })

  await app.register(cors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  await app.register(websocket)

  await app.register(blocksRoutes, { prefix: '/api/blocks' })
  await app.register(connectionsRoutes, { prefix: '/api/connections' })
  await app.register(workflowRoutes, { prefix: '/api/workflow' })

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))
  app.get('/', async () => {
  return { message: "Backend is running 🚀" };
});

  return app
}