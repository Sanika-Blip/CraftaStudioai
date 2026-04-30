import type { FastifyInstance } from 'fastify'
import { addClient, removeClient } from '../ws/wsManager'
import prisma from '../lib/prisma'

export async function wsRoutes(app: FastifyInstance) {
  app.get('/:projectId', { websocket: true }, (socket, req: any) => {
    const { projectId } = req.params as { projectId: string }
    const ws = socket.socket

    addClient(projectId, ws)

    // Send initial block list so client can hydrate the canvas on connect
    prisma.block
      .findMany({ where: { projectId } })
      .then((blocks: Array<{ id: string; blockType: string }>) => {
        ws.send(JSON.stringify({
          type: 'init',
          blocks: blocks.map((b: { id: string; blockType: string }) => ({
            blockId: b.id,
            blockType: b.blockType,
          })),
        }))
      })
      .catch(() => { /* ignore */ })

    ws.send(JSON.stringify({
      event: 'connected',
      projectId,
      message: `Listening for updates on project ${projectId}`,
    }))

    socket.on('close', () => { removeClient(projectId, ws) })
    socket.on('error', (err: Error) => {
      console.error(`[ws] Socket error project=${projectId}:`, err.message)
      removeClient(projectId, ws)
    })
    socket.on('message', (msg: Buffer) => {
      console.log(`[ws] Message from client project=${projectId}:`, msg.toString())
    })
  })
}
