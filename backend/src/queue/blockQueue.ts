import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  tls: {},
  family: 4,
})

connection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message)
})

export const blockGenerationQueue = new Queue('generation-jobs', {
  connection,
})