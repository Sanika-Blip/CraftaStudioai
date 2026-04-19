/**
 * BE-08 / BE-09 — BullMQ worker
 *
 * Processes generation-jobs off the BullMQ queue.
 * After each DB write it broadcasts a block:status_update event
 * to all connected WebSocket clients for that project (BE-09).
 *
 * Payload emitted:
 *   { event: "block:status_update", blockId, status, output, runId }
 */

import { Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import prisma from '../lib/prisma'
import { broadcastToProject } from '../ws/wsManager'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

export function startBlockWorker() {
  const worker = new Worker(
    'generation-jobs',
    async (job: Job) => {

      // Skip merge jobs — handled by Vedant's AI agent
      if (job.name === 'merge') {
        console.log(`[worker] Skipping merge job ${job.id} — handled by AI agent`)
        return
      }

      console.log(`[worker] Processing job ${job.id} for block ${job.data.blockId}`)
      console.log('[worker] Job data:', job.data)

      const { blockId, projectId, blockType, prompt, runId } = job.data

      // Notify frontend: job picked up, generation starting
      broadcastToProject(projectId, {
        event: 'block:status_update',
        blockId,
        status: 'running',
        output: null,
        runId,
      })

      try {
        // 👉 Simulate generation (replace with AI agent call later)
        const output = `Generated output for ${blockType} block`

        // ✅ Save to DB
        await prisma.blockOutput.create({
          data: {
            runId,
            blockId,
            blockType,
            outputCode: output,
            status: 'done',
          },
        })

        console.log('✅ BlockOutput saved')

        // ✅ Notify frontend: block done with output
        broadcastToProject(projectId, {
          event: 'block:status_update',
          blockId,
          status: 'done',
          output,
          runId,
        })

      } catch (error: any) {
        console.error('❌ Worker error:', error)

        // ❌ Save failure case
        await prisma.blockOutput.create({
          data: {
            runId,
            blockId,
            blockType,
            outputCode: '',
            status: 'failed',
            errorMsg: error.message,
          },
        })

        // ❌ Notify frontend: block failed
        broadcastToProject(projectId, {
          event: 'block:status_update',
          blockId,
          status: 'failed',
          output: null,
          error: error.message,
          runId,
        })
      }
    },
    { connection }
  )

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message)
  })

  console.log('[worker] Block generation worker started')
  return worker
}