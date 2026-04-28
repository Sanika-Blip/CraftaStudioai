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

    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: { projects: true }
        }
      },
    });

    const teams = memberships.map(m => ({ ...m.team, role: m.role }));

    return { user, teams };
  });
}