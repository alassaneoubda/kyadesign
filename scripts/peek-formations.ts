import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.formation.findMany();
  console.log(JSON.stringify(rows.map((r) => ({ id: r.id, title: r.title, image: r.image })), null, 2));
}

main().finally(() => prisma.$disconnect());
