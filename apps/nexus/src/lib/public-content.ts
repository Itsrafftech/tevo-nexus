import { prisma } from "@orma/database";

export async function getPublishedContent(type: string, slug?: string) {
  const status = "PUBLISHED" as const;

  switch (type) {
    case "site-settings":
      return prisma.tevoSiteSetting.findMany({ where: { status } });
    case "landing":
      return prisma.tevoLandingSection.findMany({ where: { status }, orderBy: { sortOrder: "asc" } });
    case "about":
      return prisma.tevoOrganizationProfile.findMany({ where: { status } });
    case "structure":
      return prisma.tevoStructureContent.findMany({ where: { status } });
    case "birdeps":
      return slug
        ? prisma.tevoPublicBirdepProfile.findFirst({ where: { status, birdep: { slug } }, include: { birdep: true } })
        : prisma.tevoPublicBirdepProfile.findMany({ where: { status }, include: { birdep: true } });
    case "members":
      return prisma.tevoPublicMemberProfile.findMany({
        where: { status },
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              instagram: true,
              photoAsset: { select: { publicUrl: true, altText: true } },
              memberships: {
                select: {
                  publicTitle: true,
                  subdivision: true,
                  primaryBirdep: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
      });
    case "programs":
      return slug
        ? prisma.tevoPublicProgramWork.findFirst({ where: { status, slug }, include: { program: { include: { primaryBirdep: true, pressRelease: true } } } })
        : prisma.tevoPublicProgramWork.findMany({ where: { status }, include: { program: { include: { primaryBirdep: true } } } });
    case "news":
      return slug
        ? prisma.tevoNewsArticle.findFirst({ where: { status, slug }, include: { image: true } })
        : prisma.tevoNewsArticle.findMany({ where: { status }, orderBy: { publishedAt: "desc" }, include: { image: true } });
    case "angkasa-care":
      return prisma.tevoAngkasaCareContent.findMany({ where: { status } });
    case "store-preview":
      return prisma.tevoStorePreview.findMany({ where: { status } });
    default:
      return null;
  }
}
