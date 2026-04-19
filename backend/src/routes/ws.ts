import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'
import { addClient, removeClient } from '../ws/wsManager'

export async function wsRoutes(app: FastifyInstance) {
  app.get('/:projectId', { websocket: true }, (socket, req: any) => {
    const { projectId } = req.params

    addClient(projectId, socket)

    prisma.block.findMany({ where: { projectId } }).then((blocks) => {
      socket.socket.send(JSON.stringify({
        type: 'init',
        blocks: blocks.map(b => ({ blockId: b.id, blockType: b.blockType }))
      }))
    })

    socket.on('close', () => {
      removeClient(projectId, socket)
    })

    socket.on('message', (msg: any) => {
      console.log(`[ws] Message from client:`, msg.toString())
    })
  })
}