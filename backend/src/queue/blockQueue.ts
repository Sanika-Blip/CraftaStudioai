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
 * Current implementation is a stub.
 * TODO:
 *  1. Call topologicalSort(projectId) to get generation order
 *  2. Build SharedContext via POST /plan on the Python agent service
 *  3. Dispatch one BullMQ job per block (agent-specific queues or parallel workers)
 *  4. Collect results and update WorkflowRun status in DB
 *
 * @param job - BullMQ Job containing OrchestrateJobData
 */
export const blockWorker = new Worker<OrchestrateJobData>(
  'block-generation',
  async (job: Job<OrchestrateJobData>) => {
    const { runId, projectId, prompt } = job.data

    job.log(`[Worker] Starting orchestration for run=${runId} project=${projectId}`)
    job.log(`[Worker] Prompt: "${prompt.slice(0, 80)}..."`)

    // TODO: Implement full orchestration pipeline
    // Placeholder: just log progress for now
    await job.updateProgress(10)

    job.log(`[Worker] Stub complete — implement orchestration logic`)
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
