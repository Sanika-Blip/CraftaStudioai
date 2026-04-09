import { verifyToken } from "@clerk/clerk-sdk-node";
import { FastifyRequest, FastifyReply } from "fastify";

export async function verifyClerk(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const session = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Attach user to request
    (request as any).user = session;

  } catch (err) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}