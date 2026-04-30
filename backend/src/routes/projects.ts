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

  const clerkId = req.user.sub;
  const user = await getOrCreateUser(clerkId); // already imported

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      teamId: parsed.data.teamId,
      createdByUserId: user.id, // 👈 add this
    },
  });
  return reply.code(201).send(project);
});

  /** DELETE /api/projects/:id */
  app.delete("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    await prisma.project.delete({ where: { id } });
    return reply.code(204).send();
  });

  /** PATCH /api/projects/:id — rename a project */
  app.patch("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return reply.code(422).send({ error: parsed.error.flatten() });
    const project = await prisma.project.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    return project;
  });

  /** GET /api/projects/:id/plan */
  /** GET /api/projects/:id/plan — get saved plan document */
app.get('/:id/plan', { preHandler: verifyClerk }, async (req: any, reply) => {
  await getOrCreateUser(req.user.sub)
  const { id: projectId } = req.params
  const doc = await prisma.projectDocument.findUnique({ where: { projectId } })
  if (!doc) return reply.code(404).send({ error: 'No plan found' })
  try {
    return reply.send(JSON.parse(doc.content))
  } catch {
    return reply.send({ content: doc.content })
  }
})
  /** PUT /api/projects/:id/plan */
  app.put("/:id/plan", { preHandler: verifyClerk }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const { content } = req.body as { content: string };

    // Upsert the ProjectDocument record with the plan content
    const doc = await prisma.projectDocument.upsert({
      where: { projectId: id },
      update: { content },
      create: { projectId: id, content, status: 'pending' },
    });
    return { planDoc: doc.content };
  });

  /** GET /api/projects/:id/plan/validate */
  app.get("/:id/plan/validate", { preHandler: verifyClerk }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: { document: true }
    });
    if (!project) return reply.code(404).send({ error: "Project not found" });

    const doc = project.document?.content || "";
    const missing: string[] = [];

    if (!doc.includes("## Overview")) missing.push("Overview");
    if (!doc.includes("## Architecture")) missing.push("Architecture");
    if (!doc.includes("## Blocks") && !doc.includes("| Block ID |")) missing.push("Blocks Table");
    if (!doc.includes("## Pages")) missing.push("Pages");
    if (!doc.includes("## Data Models")) missing.push("Data Models");
    if (!doc.includes("## API Endpoints")) missing.push("API Endpoints");
    if (!doc.includes("## Build Order")) missing.push("Build Order");

    if (missing.length > 0) {
      return reply.code(400).send({ valid: false, missing });
    }

    return { valid: true, missing: [] };
  });
}