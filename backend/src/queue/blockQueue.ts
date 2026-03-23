// CraftaStudio — src/queue/blockQueue.ts
import { Queue, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'

/**
 * Shared Redis connection for BullMQ.
 * Connection URL is sourced from the REDIS_URL environment variable.
 */
const redisConnection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
})

/**
 * Block generation queue — orchestrates parallel AI agent jobs.
 *
 * Job payload shape:
 *  - runId:     UUID of the WorkflowRun record
 *  - projectId: UUID of the project being generated
 *  - prompt:    The user's natural-language design intent
 *
 * Concurrency is set to 5 — up to 5 block agents run in parallel per worker.
 */
export const blockQueue = new Queue('block-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

/**
 * Job payload type for the orchestrate job.
 * Add additional fields as the agent protocol evolves.
 */
export interface OrchestrateJobData {
  runId: string
  projectId: string
  prompt: string
}

/**
 * Block queue worker — processes orchestrate jobs.
 *
 * ⚠️  STUB — not production-ready.
 *
 * This worker intentionally contains no real orchestration logic.
 * It exists to:
 *   • Prove the BullMQ / Redis connection is healthy at startup.
 *   • Reserve the correct queue name ('block-generation').
 *   • Serve as the implementation target for the pipeline below.
 *
 * ─── Implementation roadmap ────────────────────────────────────────────────
 * Phase 1 — Sort
 *   const orderedBlockIds = await topologicalSort(projectId)
 *   // Returns blocks in dependency order (leaves first).
 *
 * Phase 2 — Plan
 *   const context = await fetch(`${AGENT_URL}/plan`, {
 *     method: 'POST',
 *     body: JSON.stringify({ projectId, prompt, orderedBlockIds }),
 *   }).then(r => r.json())
 *   // Builds a SharedContext the agents will read.
 *
 * Phase 3 — Dispatch
 *   for (const blockId of orderedBlockIds) {
 *     await blockQueue.add('generate', { runId, projectId, blockId, context })
 *   }
 *   // One job per block; workers call POST /generate on the agent service.
 *
 * Phase 4 — Collect
 *   // Listen for completed jobs and update WorkflowRun.status in Prisma.
 *   // Mark run as FAILED on first error, COMPLETE when all blocks finish.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * @param job - BullMQ Job containing OrchestrateJobData
 */
export const blockWorker = new Worker<OrchestrateJobData>(
  'block-generation',
  async (job: Job<OrchestrateJobData>) => {
    const { runId, projectId, prompt } = job.data

    // Stub: log receipt and report 10 % so the queue UI shows activity.
    job.log(`[Worker] Received orchestrate job — run=${runId} project=${projectId}`)
    job.log(`[Worker] Prompt preview: "${prompt.slice(0, 80)}..."`)
    await job.updateProgress(10)

    // TODO: Replace stub body with the four-phase pipeline above.
    job.log('[Worker] ⚠️  Stub — no real orchestration performed')
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
)

/** Attach error listener so failures don't crash the Node process */
blockWorker.on('failed', (job, err) => {
  console.error(`[BlockWorker] Job ${job?.id} failed:`, err.message)
})
