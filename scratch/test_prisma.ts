import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.user.count()
    print(`User count: ${count}`)
  } catch (err) {
    print(`Prisma error: ${err.message}`)
  } finally {
    await prisma.$disconnect()
  }
}

main()
