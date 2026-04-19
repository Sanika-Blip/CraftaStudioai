import type { FastifyInstance } from "fastify";
import { verifyClerk } from "../middleware/clerkAuth";
import { getOrCreateUser } from "../lib/getOrCreateUser";
import prisma from "../lib/prisma";

export async function userRoutes(app: FastifyInstance) {

  /** GET /api/me */
  app.get("/me", { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub;
    const user = await getOrCreateUser(clerkId);
    return user;
  });

  /** GET /api/workspace */
  app.get("/workspace", { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub;
    const user = await getOrCreateUser(clerkId);

    const teams = await prisma.team.findMany({
      where: { userId: user.id },
      include: { projects: true },
    });

    return { user, teams };
  });
}