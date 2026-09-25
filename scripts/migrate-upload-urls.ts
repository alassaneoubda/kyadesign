import { mkdir, copyFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migratePath(image: string): Promise<string | null> {
  if (!image.startsWith("/uploads/")) return null;
  const relative = image.replace(/^\/uploads\//, "");
  const from = path.join(process.cwd(), "public", "uploads", relative);
  const to = path.join(process.cwd(), "storage", "uploads", relative);
  await mkdir(path.dirname(to), { recursive: true });
  try {
    await copyFile(from, to);
  } catch {
    console.warn("Fichier manquant:", from);
    return null;
  }
  return `/api/uploads/${relative.replace(/\\/g, "/")}`;
}

async function main() {
  for (const item of await prisma.formation.findMany()) {
    const next = await migratePath(item.image);
    if (next) {
      await prisma.formation.update({ where: { id: item.id }, data: { image: next } });
      console.info("formation", item.title, "->", next);
    }
  }
  for (const item of await prisma.service.findMany()) {
    const next = await migratePath(item.image);
    if (next) {
      await prisma.service.update({ where: { id: item.id }, data: { image: next } });
      console.info("service", item.title, "->", next);
    }
  }
  for (const item of await prisma.project.findMany()) {
    const next = await migratePath(item.cover);
    if (next) {
      await prisma.project.update({ where: { id: item.id }, data: { cover: next } });
      console.info("project", item.title, "->", next);
    }
  }
  for (const item of await prisma.projectImage.findMany()) {
    const next = await migratePath(item.src);
    if (next) {
      await prisma.projectImage.update({ where: { id: item.id }, data: { src: next } });
      console.info("projectImage", item.id, "->", next);
    }
  }
  for (const item of await prisma.trainingMode.findMany()) {
    const next = await migratePath(item.image);
    if (next) {
      await prisma.trainingMode.update({ where: { id: item.id }, data: { image: next } });
      console.info("mode", item.title, "->", next);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
