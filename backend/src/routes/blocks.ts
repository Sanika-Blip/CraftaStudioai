import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { BLOCK_TYPES } from "../../../shared/types/blocks";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyClerk } from "../middleware/clerkAuth";
import { getOrCreateUser } from "../lib/getOrCreateUser";

const CreateBlockSchema = z.object({
  projectId: z.string().uuid(),
  blockType: z.enum(BLOCK_TYPES),
  blockJson: z.record(z.unknown()),
});

export async function blocksRoutes(app: FastifyInstance) {

  /** GET all blocks */
  app.get("/", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { projectId } = req.query;

    if (!projectId) {
      return reply.code(400).send({ error: "projectId is required" });
    }

    const blocks = await prisma.block.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return blocks;
  });

  /** GET block by id */
  app.get("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { id } = req.params;

    const block = await prisma.block.findUnique({
      where: { id },
    });

    if (!block) {
      return reply.code(404).send({ error: "Block not found" });
    }

    return block;
  });

  /** CREATE block */
  app.post("/", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const parsed = CreateBlockSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() });
    }

    const block = await prisma.block.create({
      data: {
        projectId: parsed.data.projectId,
        blockType: parsed.data.blockType,
        blockJson: parsed.data.blockJson as Prisma.InputJsonValue,
      },
    });

    return reply.code(201).send(block);
  });

  /** UPDATE block */
  app.patch("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { id } = req.params;

    const parsed = z.object({
      blockJson: z.record(z.unknown()),
    }).safeParse(req.body);

    if (!parsed.success) {
      return reply.code(422).send({ error: parsed.error.flatten() });
    }

    const block = await prisma.block.update({
      where: { id },
      data: {
        blockJson: parsed.data.blockJson as Prisma.InputJsonValue,
      },
    });

    return block;
  });

  /** GET latest generated output for a block */
  app.get("/:id/output", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { id: blockId } = req.params;
    const { runId } = req.query as { runId?: string };

    const where = runId ? { blockId, runId } : { blockId };

    const output = await prisma.blockOutput.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (!output) {
      return reply.code(404).send({ error: "No output found for this block" });
    }

    return output;
  });

  /** GET all outputs for a block (history) */
  app.get("/:id/outputs", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { id: blockId } = req.params;

    const outputs = await prisma.blockOutput.findMany({
      where: { blockId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return outputs;
  });

  /** DELETE block */
  app.delete("/:id", { preHandler: verifyClerk }, async (req: any, reply) => {

    const clerkId = req.user.sub;
    await getOrCreateUser(clerkId);

    const { id } = req.params;

    await prisma.block.delete({
      where: { id },
    });

    return reply.code(204).send();
  });
}