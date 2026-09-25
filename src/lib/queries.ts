import { getGuestCode } from "@/lib/auth";
import { normalizeCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { topicsFromJson } from "@/lib/validators";

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/**
 * Charge tout le contenu public de la page d'accueil.
 * Les albums privés ne sont pas inclus.
 */
export async function getHomeData() {
  const [setting, facts, skills, software, services, categories, clients, projects, formations, packs, modes] =
    await Promise.all([
      prisma.siteSetting.findUnique({ where: { id: 1 } }),
      prisma.fact.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.skill.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.software.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.client.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.project.findMany({ orderBy: { sortOrder: "asc" }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
      prisma.formation.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
      prisma.pack.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
      prisma.trainingMode.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  if (!setting) {
    throw new Error("Contenu absent. Lance npm run db:setup.");
  }

  return {
    setting,
    facts,
    skills,
    software,
    services,
    categories,
    clients,
    projects: projects.map((project) => ({
      ...project,
      tags: parseTags(project.tags),
      gallery: project.images.map((image) => image.src),
    })),
    formations: formations.map(({ createdAt: _created, updatedAt: _updated, topics, ...item }) => ({
      ...item,
      topics: topicsFromJson(topics),
    })),
    packs: packs.map(({ createdAt: _created, updatedAt: _updated, topics, ...item }) => ({
      ...item,
      topics: topicsFromJson(topics),
    })),
    modes: modes.map((item) => ({ ...item, includes: topicsFromJson(item.includes) })),
  };
}

/**
 * Albums visibles pour le code actuellement déverrouillé.
 * @returns null si aucun code valide n'est en session.
 */
export async function getOpenAlbums() {
  const code = await getGuestCode();
  if (!code) return null;
  const albums = await prisma.album.findMany({
    where: { accessCode: normalizeCode(code), published: true },
    orderBy: { sortOrder: "asc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!albums.length) return null;
  return albums.map(({ createdAt: _c, updatedAt: _u, photos, ...album }) => ({
    ...album,
    photos: photos.map((photo) => ({
      id: photo.id,
      originalName: photo.originalName,
      bytes: photo.bytes,
    })),
  }));
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
