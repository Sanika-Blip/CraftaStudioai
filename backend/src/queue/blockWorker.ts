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
  tls: {},
  family: 4,
})

connection.on('error', (err) => {
  console.error('❌ Redis Worker Connection Error:', err.message)
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

      const { blockId, projectId, blockType, blockJson, prompt, runId, traceId } = job.data

      // Handle full orchestration (Planner + Blocks)
      if (job.name === 'orchestrate') {
        console.log(`[worker] Running orchestrator for run ${runId}`)
        try {
          const res = await fetch(`${process.env.AGENT_SERVICE_URL}/api/v1/orchestrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, prompt, runId }),
          })

          if (!res.ok) throw new Error(`Agent service failed: ${res.statusText}`)
          const result = await res.json()

          // Broadcast that orchestration finished
          broadcastToProject(projectId, {
            event: 'workflow:completed',
            runId,
            result,
          })
          return
        } catch (err: any) {
          console.error('[worker] Orchestration failed:', err)
          broadcastToProject(projectId, {
            event: 'workflow:failed',
            runId,
            error: err.message,
          })
          throw err
        }
      }

      // Notify frontend: job picked up, generation starting
      broadcastToProject(projectId, {
        event: 'block:status_update',
        blockId,
        status: 'running',
        output: null,
        runId,
      })

      try {
        // ✅ Call Python agents /generate endpoint
        console.log(`[worker] Calling agent service for block ${blockId}`)

        const agentRes = await fetch(`${process.env.AGENT_SERVICE_URL}/api/v1/generate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: runId,
            block_id: blockId,
            block_type: blockType,
            block_name: (blockJson as any)?.title ?? blockType,
            block_json: blockJson ?? {},
            shared_context: {
              prompt,
              project_id: projectId,
              trace_id: traceId ?? null,
            },
          }),
        })

        if (!agentRes.ok) {
          const errText = await agentRes.text()
          throw new Error(`Agent service error: ${agentRes.status} — ${errText}`)
        }

        const agentData = await agentRes.json() as { output_code: string, tokens_used: number }
        const output = agentData.output_code
        const tokensUsed = agentData.tokens_used ?? 0
        console.log(`[worker] Agent returned output for block ${blockId}`)

        await prisma.blockOutput.create({
            data: {
              runId,
              blockId,
              blockType,
              outputCode: output,
              tokensUsed: tokensUsed,  // ← added
              status: 'done',
            },
          })
                    
        console.log('✅ BlockOutput saved to DB')

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

