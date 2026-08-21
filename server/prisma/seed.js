const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ashirwad.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@ashirwad.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Coating types
  const coatings = ['Plating', 'Powder Coating', 'No Coating'];
  for (const name of coatings) {
    await prisma.coatingType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Coating types created');

  // Default categories
  const categories = [
    { name: 'Electronics', color: '#6366f1', icon: 'cpu' },
    { name: 'Mechanical Parts', color: '#f59e0b', icon: 'settings' },
    { name: 'Raw Materials', color: '#10b981', icon: 'package' },
    { name: 'Finished Goods', color: '#3b82f6', icon: 'box' },
    { name: 'Tools & Equipment', color: '#ef4444', icon: 'tool' },
    { name: 'Consumables', color: '#8b5cf6', icon: 'droplet' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created');

  // Default supplier (Ashirwad Enterprises itself)
  await prisma.supplier.upsert({
    where: { id: 'ashirwad-default' },
    update: {},
    create: {
      id: 'ashirwad-default',
      name: 'Ashirwad Enterprises',
      company: 'Ashirwad Enterprises',
      contactPerson: 'Admin',
      phone: '+91-XXXXXXXXXX',
      email: 'info@ashirwad.com',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  });
  console.log('✅ Default supplier created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('Login: admin@ashirwad.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
