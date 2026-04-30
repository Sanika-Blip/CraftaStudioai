import { Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import prisma from '../lib/prisma'
import { broadcastToProject } from '../ws/wsManager'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  family: 0,
})

connection.on('error', (err) => {
  console.error('❌ Redis Worker Connection Error:', err.message)
})

export function startBlockWorker() {
  const worker = new Worker(
    'generation-jobs',
    async (job: Job) => {

      if (job.name === 'merge') {
        console.log(`[worker] Skipping merge job ${job.id}`)
        return
      }

      console.log(`[worker] Processing job ${job.id} for block ${job.data.blockId}`)

      const { blockId, projectId, blockType, blockJson, prompt, runId } = job.data

      // ── Orchestrate job ──────────────────────────────────────────────────
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
          broadcastToProject(projectId, { event: 'workflow:completed', runId, result })
          return
        } catch (err: any) {
          console.error('[worker] Orchestration failed:', err)
          broadcastToProject(projectId, { event: 'workflow:failed', runId, error: err.message })
          throw err
        }
      }

      // ── Notify frontend: block starting ─────────────────────────────────
      broadcastToProject(projectId, {
        event: 'block:status_update',
        blockId,
        status: 'running',
        output: null,
        runId,
      })

      try {
        // ── Call Python agents /generate ─────────────────────────────────
        console.log(`[worker] Calling agent service for block ${blockId}`)

        const agentRes = await fetch(`${process.env.AGENT_SERVICE_URL}/api/v1/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: runId,
            block_id: blockId,
            block_type: blockType,
            block_name: (blockJson as any)?.name ?? blockType,
            block_json: blockJson ?? {},
            shared_context: {
              prompt,
              project_id: projectId,
            },
          }),
        })

        if (!agentRes.ok) {
          const errText = await agentRes.text()
          throw new Error(`Agent error: ${agentRes.status} — ${errText}`)
        }

        const agentData = await agentRes.json() as { output_code: string; tokens_used: number }
        const output = agentData.output_code
        const tokensUsed = agentData.tokens_used ?? 0

        console.log(`[worker] Agent returned output for block ${blockId}`)

        // ── Save to DB ───────────────────────────────────────────────────
        await prisma.blockOutput.create({
          data: {
            runId,
            blockId,
            blockType,
            outputCode: output,
            tokensUsed,
            status: 'done',
          },
        })

        console.log('✅ BlockOutput saved to DB')

        // ── Notify frontend: block done ──────────────────────────────────
        broadcastToProject(projectId, {
          event: 'block:status_update',
          blockId,
          status: 'done',
          output,
          runId,
        })

        // ── Check if ALL blocks for this run are done ────────────────────
        await checkAndFinalizeRun(runId, projectId)

      } catch (error: any) {
        console.error('❌ Worker error:', error)

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

        broadcastToProject(projectId, {
          event: 'block:status_update',
          blockId,
          status: 'failed',
          output: null,
          error: error.message,
          runId,
        })

        await checkAndFinalizeRun(runId, projectId)
      }
    },
    { connection }
  )

  worker.on('completed', (job) => console.log(`[worker] Job ${job.id} completed`))
  worker.on('failed', (job, err) => console.error(`[worker] Job ${job?.id} failed:`, err.message))

  console.log('[worker] Block generation worker started')
  return worker
}

// ── Helper: finalize run when all blocks are done/failed ─────────────────────
async function checkAndFinalizeRun(runId: string, projectId: string) {
  try {
    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
      include: { blockOutputs: { select: { status: true } } }
    })

    if (!run) return

    const allFinished = run.blockOutputs.every(
      b => b.status === 'done' || b.status === 'failed'
    )

    if (allFinished && run.blockOutputs.length > 0) {
      const anyFailed = run.blockOutputs.some(b => b.status === 'failed')
      const finalStatus = anyFailed ? 'failed' : 'done'

      await prisma.workflowRun.update({
        where: { id: runId },
        data: { status: finalStatus as any }
      })

      broadcastToProject(projectId, {
        event: anyFailed ? 'workflow:failed' : 'workflow:completed',
        runId,
        status: finalStatus,
      })

      console.log(`✅ Run ${runId} finalized as ${finalStatus}`)
    }
  } catch (err) {
    console.error('[worker] Failed to finalize run:', err)
  }
}