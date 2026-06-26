import { prisma } from "@orma/database";

const status = "PUBLISHED" as const;

export async function getPublishedContent(type: string, slug?: string) {
  switch (type) {
    case "site-settings":
      return prisma.tevoSiteSetting.findMany({
        where: { status },
        select: { key: true, value: true, updatedAt: true },
      });
    case "landing":
      return prisma.tevoLandingSection.findMany({
        where: { status },
        orderBy: { sortOrder: "asc" },
        select: { slug: true, title: true, content: true, sortOrder: true },
      });
    case "about":
      return prisma.tevoOrganizationProfile.findMany({
        where: { status },
        select: { slug: true, title: true, body: true, publishedAt: true },
      });
    case "structure":
      return prisma.tevoStructureContent.findMany({
        where: { status },
        select: { title: true, content: true, publishedAt: true },
      });
    case "navigation":
      return prisma.tevoNavigationItem.findMany({
        where: { status },
        orderBy: { sortOrder: "asc" },
        select: { label: true, href: true, sortOrder: true },
      });
    case "footer":
      return prisma.tevoFooterContent.findMany({
        where: { status },
        select: { slug: true, content: true },
      });
    case "birdeps":
      return slug ? getPublicBirdep(slug) : getPublicBirdeps();
    case "members":
      return getPublicMembers();
    case "programs":
      return slug ? getPublicProgram(slug) : getPublicPrograms();
    case "news":
      return slug ? getPublicNewsArticle(slug) : getPublicNews();
    case "angkasa-care":
      return prisma.tevoAngkasaCareContent.findMany({
        where: { status },
        select: { slug: true, title: true, body: true, publishedAt: true },
      });
    case "store-preview":
      return prisma.tevoStorePreview.findMany({
        where: { status },
        select: { title: true, content: true, publishedAt: true },
      });
    default:
      return null;
  }
}

function getPublicBirdeps() {
  return prisma.tevoPublicBirdepProfile.findMany({
    where: { status },
    select: {
      displayName: true,
      summary: true,
      focusAreas: true,
      publishedAt: true,
      birdep: { select: { id: true, name: true, slug: true, code: true, unitType: true } },
    },
  });
}

function getPublicBirdep(slug: string) {
  return prisma.tevoPublicBirdepProfile.findFirst({
    where: { status, birdep: { slug } },
    select: {
      displayName: true,
      summary: true,
      focusAreas: true,
      publishedAt: true,
      birdep: { select: { id: true, name: true, slug: true, code: true, unitType: true } },
    },
  });
}

function getPublicMembers() {
  return prisma.tevoPublicMemberProfile.findMany({
    where: { status },
    select: {
      displayName: true,
      publicTitle: true,
      instagram: true,
      bio: true,
      publishedAt: true,
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
}

function getPublicPrograms() {
  return prisma.tevoPublicProgramWork.findMany({
    where: { status },
    select: {
      title: true,
      slug: true,
      summary: true,
      statusLabel: true,
      publishedAt: true,
      program: {
        select: {
          id: true,
          name: true,
          slug: true,
          publicDescription: true,
          status: true,
          progressPercent: true,
          startDate: true,
          endDate: true,
          primaryBirdep: { select: { id: true, name: true, slug: true, code: true } },
          pressRelease: {
            select: { title: true, url: true, publishedAt: true, status: true },
          },
        },
      },
    },
  });
}

function getPublicProgram(slug: string) {
  return prisma.tevoPublicProgramWork.findFirst({
    where: { status, slug },
    select: {
      title: true,
      slug: true,
      summary: true,
      statusLabel: true,
      publishedAt: true,
      program: {
        select: {
          id: true,
          name: true,
          slug: true,
          publicDescription: true,
          status: true,
          progressPercent: true,
          startDate: true,
          endDate: true,
          primaryBirdep: { select: { id: true, name: true, slug: true, code: true } },
          pressRelease: {
            select: { title: true, url: true, publishedAt: true, status: true },
          },
        },
      },
    },
  });
}

function getPublicNews() {
  return prisma.tevoNewsArticle.findMany({
    where: { status },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      publishedAt: true,
      image: { select: { publicUrl: true, altText: true } },
    },
  });
}

function getPublicNewsArticle(slug: string) {
  return prisma.tevoNewsArticle.findFirst({
    where: { status, slug },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      publishedAt: true,
      image: { select: { publicUrl: true, altText: true } },
    },
  });
}
