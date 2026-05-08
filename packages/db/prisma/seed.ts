import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Minimal scaffold seed — just creates empty categories so the manage app
  // has something to start adding parts to. Real data will be added via the
  // admin UI per user request.
  const categories = [
    { name: "车架", sortOrder: 1 },
    { name: "前叉", sortOrder: 2 },
    { name: "把立", sortOrder: 3 },
    { name: "车把", sortOrder: 4 },
    { name: "座管", sortOrder: 5 },
    { name: "坐垫", sortOrder: 6 },
    { name: "轮组", sortOrder: 7 },
    { name: "外胎", sortOrder: 8 },
    { name: "牙盘", sortOrder: 9 },
    { name: "后变速", sortOrder: 10 },
    { name: "飞轮", sortOrder: 11 },
    { name: "刹车", sortOrder: 12 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { sortOrder: c.sortOrder },
      create: c,
    });
  }

  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
