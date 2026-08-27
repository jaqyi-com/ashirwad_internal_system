const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });
  console.log('--- SYSTEM USERS ---');
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
