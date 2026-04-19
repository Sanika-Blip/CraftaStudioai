import { createRemoteJWKSet, jwtVerify } from "jose";
import { FastifyRequest, FastifyReply } from "fastify";

// Lazily initialised so env vars are loaded before this runs
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const jwksUrl = process.env.CLERK_JWKS_URL;
    if (!jwksUrl) {
      throw new Error("CLERK_JWKS_URL is not set in environment variables");
    }
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwks;
}

export async function verifyClerk(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: process.env.CLERK_ISSUER_URL,
    });

    // Attach the decoded JWT payload (contains sub = clerkId) to the request
    (request as any).user = payload;

  } catch (err) {
    request.log?.error(err, "Clerk token verification failed");
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
