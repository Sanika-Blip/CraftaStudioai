const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 1
    });
    console.log('Latest Project:', JSON.stringify(projects[0], null, 2));
    
    if (projects[0]) {
        const blocks = await prisma.block.findMany({
            where: { projectId: projects[0].id }
        });
        console.log('Blocks count:', blocks.length);
    }
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
