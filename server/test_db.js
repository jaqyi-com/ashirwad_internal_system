const prisma = require('./src/config/prisma');
async function test() {
  const p = await prisma.product.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  console.log("productImages:", p.productImages);
  console.log("designImages:", p.designImages);
}
test();
