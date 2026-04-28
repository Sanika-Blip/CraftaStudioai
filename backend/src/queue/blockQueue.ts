import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  family: 4,
})

connection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message)
})

export const blockGenerationQueue = new Queue('generation-jobs', {
  connection,
})

// Alias so workflow.ts can import without renaming
export const generationJobsQueue = blockGenerationQueue