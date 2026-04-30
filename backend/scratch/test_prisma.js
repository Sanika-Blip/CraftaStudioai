const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Connecting to DB...")
    const count = await prisma.user.count()
    console.log("User count:", count)
  } catch (err) {
    console.error("Prisma error:", err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
