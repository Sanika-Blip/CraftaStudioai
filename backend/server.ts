/**
 * The above TypeScript code initializes a server, connects to a Redis database, and starts the server
 * on port 3000 after setting up necessary configurations.
 */
import "dotenv/config";
import { buildServer } from "./src/app";
import { redis } from "./src/config/redis";
import { startBlockWorker } from './src/queue/blockWorker'

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    console.log("ENV URL:", process.env.UPSTASH_REDIS_REST_URL);

    const app = await buildServer();

    await redis.set("test", "connected");
    console.log("Redis:", await redis.get("test"));

    startBlockWorker();

    await app.listen({ port: PORT });

    console.log(`Server running on http://localhost:${PORT}`);

  } catch (error) {
    console.error("Startup failed:", error);
  }
}

startServer();