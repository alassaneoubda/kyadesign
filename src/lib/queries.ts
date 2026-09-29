import { getGuestCode } from "@/lib/auth";
import { normalizeCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { isSafeExternalUrl } from "@/lib/social";
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
 * Les albums privés et les contenus masqués (réalisations, réseaux, témoignages) ne sont pas inclus :
 * le filtrage est fait en base, jamais seulement dans le navigateur.
 */
export async function getHomeData() {
  const [
    setting,
    facts,
    skills,
    software,
    services,
    categories,
    clients,
    projects,
    formations,
    packs,
    modes,
    socialLinks,
    testimonials,
  ] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: 1 } }),
    prisma.fact.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.skill.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.software.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.client.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.project.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
      take: 200,
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.formation.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
    prisma.pack.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
    prisma.trainingMode.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.socialLink.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 30,
      select: { id: true, platform: true, label: true, handle: true, url: true },
    }),
    prisma.testimonial.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 30,
      select: { id: true, name: true, role: true, company: true, quote: true, photo: true },
    }),
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
    socialLinks: socialLinks.filter((link) => isSafeExternalUrl(link.url)),
    testimonials,
    projects: projects.map((project) => ({
      ...project,
      tags: parseTags(project.tags),
      gallery: project.images.map((image) => image.src),
    })),
    formations: formations.map((formation) => ({
      id: formation.id,
      title: formation.title,
      summary: formation.summary,
      image: formation.image,
      published: formation.published,
      sortOrder: formation.sortOrder,
      topics: topicsFromJson(formation.topics),
    })),
    packs: packs.map((pack) => ({
      id: pack.id,
      title: pack.title,
      summary: pack.summary,
      image: pack.image,
      highlighted: pack.highlighted,
      published: pack.published,
      sortOrder: pack.sortOrder,
      topics: topicsFromJson(pack.topics),
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
  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    persons: album.persons,
    eventDate: album.eventDate,
    eventType: album.eventType,
    place: album.place,
    description: album.description,
    accessCode: album.accessCode,
    maxPhotos: album.maxPhotos,
    cover: album.cover,
    published: album.published,
    kind: album.kind,
    probleme: album.probleme,
    concept: album.concept,
    creation: album.creation,
    resultat: album.resultat,
    sortOrder: album.sortOrder,
    photos: album.photos.map((photo) => ({
      id: photo.id,
      originalName: photo.originalName,
      bytes: photo.bytes,
    })),
  }));
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
