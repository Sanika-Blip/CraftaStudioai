import type { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma";
import { verifyClerk } from "../middleware/clerkAuth";
import { getOrCreateUser } from "../lib/getOrCreateUser";

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  teamId: z.string().uuid(),
});

export async function projectsRoutes(app: FastifyInstance) {

  /** GET /api/projects?teamId=xxx */
  app.get("/", { preHandler: verifyClerk }, async (req: any, reply) => {
    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { teamId } = req.query as { teamId?: string };
    if (!teamId) return reply.code(400).send({ error: "teamId is required" });

    const projects = await prisma.project.findMany({
      where: { teamId },
      orderBy: { createdAt: "asc" },
    });
    return projects;
  });

  /** GET /api/projects/:id */
  app.get("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.code(404).send({ error: "Project not found" });
    return project;
  });

  /** POST /api/projects */
  app.post("/", { preHandler: verifyClerk }, async (req: any, reply) => {
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() });

    const project = await prisma.project.create({
      data: { name: parsed.data.name, teamId: parsed.data.teamId },
    });
    return reply.code(201).send(project);
  });

  /** DELETE /api/projects/:id */
  app.delete("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    await prisma.project.delete({ where: { id } });
    return reply.code(204).send();
  });
}