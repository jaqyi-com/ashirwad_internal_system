const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const email = 'admin@ashirwad.com';
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  console.log('✅ Successfully reset password for admin@ashirwad.com to: admin123');
  await prisma.$disconnect();
}

run().catch(console.error);
