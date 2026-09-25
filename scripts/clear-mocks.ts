import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.projectImage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.pack.deleteMany();
  await prisma.trainingMode.deleteMany();
  console.info("Exemples retirés.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
