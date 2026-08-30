const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const sessions = await prisma.whatsAppSession.findMany();
    console.log("Sessions found:", sessions.length);
  } catch (e) {
    console.error("DB Error:", e.message);
  }
}
main();
