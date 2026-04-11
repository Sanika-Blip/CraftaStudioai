import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // Clean DB in correct order
  await prisma.blockOutput.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.block.deleteMany();
  await prisma.workflowRun.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create User
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  // Create Team
  const team = await prisma.team.create({
    data: {
      name: "Workspace Alpha",
      userId: user.id,
    },
  });

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: "Crafta Demo Project",
      teamId: team.id,
    },
  });

  // Create Blocks
  const block1 = await prisma.block.create({
    data: {
      projectId: project.id,
      blockType: "frontend",
      blockJson: {
        name: "Frontend UI",
        description: "Handles UI rendering",
      },
    },
  });

  const block2 = await prisma.block.create({
    data: {
      projectId: project.id,
      blockType: "backend",
      blockJson: {
        name: "Backend API",
        description: "Handles business logic",
      },
    },
  });

  // Create Connection
  await prisma.connection.create({
    data: {
      projectId: project.id,
      fromBlockId: block1.id,
      toBlockId: block2.id,
      connectionType: "dependency",
    },
  });

  // Create Workflow Run (Memory)
const run = await prisma.workflowRun.create({
  data: {
    projectId: project.id,
    prompt: "Build a full stack app",
    status: "done",
    version: 1,
    sharedContextJson: {
      version: 1,
      userPrompt: "Build a full stack app",
      techStack: ["Next.js", "Node.js"],
      blocks: {
        frontend: "UI logic",
        backend: "API logic"
      },
      globalState: {
        auth: true,
        database: "PostgreSQL"
      }
    }
  }
});

  // Create Block Outputs
  await prisma.blockOutput.createMany({
    data: [
      {
        runId: run.id,
        blockId: block1.id,
        blockType: "frontend",
        outputCode: "Frontend code generated",
        status: "done",
      },
      {
        runId: run.id,
        blockId: block2.id,
        blockType: "backend",
        outputCode: "Backend code generated",
        status: "done",
      },
    ],
  });

  console.log("✅ Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });