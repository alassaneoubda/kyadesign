import { prisma } from "../src/lib/prisma";

async function main() {
  if (await prisma.siteSetting.findUnique({ where: { id: 1 } })) {
    console.info("Seed déjà présent.");
    return;
  }

  await prisma.siteSetting.create({
    data: {
      id: 1,
      brand: "Kya Design",
      personName: "Yohann Armel Koukoui",
      aboutName: "Yohann Armel",
      aboutRole: "Graphiste & Directeur Créatif — KYA Design",
      footerLine: "Yohann Armel Koukoui — Designer graphique",
      phone: "+225 05 64 36 95 54",
      whatsapp: "https://wa.me/message/ZHWZ6LIES7PRF1",
      whatsappDisplay: "+225 05 64 36 95 54 · Disponible sur WhatsApp",
      email: "koukouiyohannarmel@gmail.com",
      instagram: "https://instagram.com/kya_designer1",
      instagramHandle: "Kya_designer1",
      tiktok: "https://tiktok.com/@kyadesign0",
      tiktokHandle: "kyadesign0",
      behance: "https://www.behance.net/yohannkoukoui1",
      behanceHandle: "yohann armel koukoui",
      aboutIntro:
        "Yohann Armel, graphiste et directeur créatif derrière KYA Design. Je conçois des identités, des campagnes et des supports qui donnent une présence nette aux marques — du premier regard jusqu’au dernier détail.",
      aboutApproach:
        "Spécialisé en conception graphique, identité visuelle et communication visuelle, je relie l’idée au livrable : affiches, publicité, print et projets digitaux. Peu d’effets. Beaucoup d’intention.",
      aboutExperience:
        "Chaque projet est dirigé comme une pièce de direction artistique : un concept clair, une exécution précise, un résultat qui tient en grand format comme à l’écran.",
      heroImage: "/assets/hero/kya-portfolio-hero.png",
      portraitImage: "/assets/portrait/yohann-armel.png",
      logoImage: "/assets/brand/kya-design-logo.png",
      contactLocation: "Abidjan, Côte d'Ivoire",
      cvFileName: "CV_Yohann_Armel_K.pdf",
    },
  });

  await prisma.fact.createMany({
    data: [
      { value: "08+", label: "Domaines d’expertise", sortOrder: 1 },
      { value: "40+", label: "Projets réalisés", sortOrder: 2 },
      { value: "100%", label: "Sur-mesure", sortOrder: 3 },
    ],
  });

  await prisma.skill.createMany({
    data: [
      "Direction artistique",
      "Identité visuelle",
      "Typographie",
      "Mise en page",
      "Direction photo",
      "Motion design",
      "Stratégie visuelle",
    ].map((label, sortOrder) => ({ label, sortOrder })),
  });

  await prisma.software.createMany({
    data: [
      { name: "Photoshop", level: 95, sortOrder: 1 },
      { name: "Illustrator", level: 95, sortOrder: 2 },
      { name: "After Effects", level: 80, sortOrder: 3 },
      { name: "Premiere Pro", level: 78, sortOrder: 4 },
      { name: "InDesign", level: 85, sortOrder: 5 },
      { name: "Figma", level: 70, sortOrder: 6 },
    ],
  });

  const services = [
    ["01", "Création d'affiches", "Affiches événementielles sur-mesure pour vos événements.", "01-creation-affiches.jpg"],
    ["02", "Identité visuelle / logos", "Charte graphique, logo, palette couleurs, typographies.", "02-identite-visuelle.jpg"],
    ["03", "Réseaux sociaux", "Contenu et visuels pour Instagram, stories, posts.", "03-reseaux-sociaux.jpg"],
    ["04", "Flyers et brochures", "Flyers, dépliants, brochures imprimées pro.", "04-flyers-brochures.jpg"],
    ["05", "Packaging", "Design packaging éco, boîtes kraft sur-mesure.", "05-packaging.jpg"],
    ["06", "Mockups", "Mockups réalistes pour présentation produit.", "06-mockups.jpg"],
    ["07", "Communication publicitaire", "Campagnes publicitaires print & digital intégrées.", "07-communication-pub.jpg"],
    ["08", "Retouche et photomontage", "Retouche photo pro, photomontage, avant/après.", "08-retouche-photo.jpg"],
    ["09", "Photographie", "Portrait, produits, événements et contenus professionnels. Des images soignées qui valorisent votre image et votre activité.", "09-photographie.jpg"],
    ["10", "Captation vidéo", "Événements, interviews, contenus réseaux sociaux et vidéos promotionnelles. Des images dynamiques pensées pour raconter et mettre en valeur votre projet.", "10-captation-video.jpg"],
  ] as const;

  await prisma.service.createMany({
    data: services.map(([number, title, text, file], sortOrder) => ({
      number,
      title,
      text,
      image: `/assets/services/${file}`,
      sortOrder,
    })),
  });

  await prisma.category.createMany({
    data: [
      ["all", "Tous"],
      ["identite", "Identité visuelle"],
      ["social", "Réseaux sociaux"],
      ["pub", "Publicité"],
      ["resto", "Restaurants & commerces"],
      ["entreprise", "Entreprises"],
      ["contenu", "Création de contenu"],
      ["digital", "Supports digitaux"],
    ].map(([id, label], sortOrder) => ({ id, label, sortOrder })),
  });

  console.info("Seed terminé. Les créations, clients et formations s’ajoutent depuis le back-office.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
