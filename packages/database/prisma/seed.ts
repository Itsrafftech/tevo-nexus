import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UnitType,
  UserRole,
} from "../generated/prisma/client.js";
import { requireDatabaseUrl } from "../src/env.js";
import { permissions, roleTemplates } from "../src/permissions.js";

const connectionString = requireDatabaseUrl();

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const birdeps = [
  {
    code: "BPH",
    slug: "bph",
    name: "Badan Pengurus Harian",
    unitType: UnitType.BPH,
    description: "Badan Pengurus Harian Ormawa Eksekutif PKU IPB.",
    focusArea: "Koordinasi, pengawasan, dan pengambilan keputusan organisasi.",
  },
  {
    code: "INTERNAL",
    slug: "internal",
    name: "Biro Internal",
    unitType: UnitType.BIRO,
    description: "Biro Internal Ormawa Eksekutif PKU IPB.",
    focusArea: "Manajemen internal, kaderisasi, dan iklim organisasi.",
  },
  {
    code: "MEDBRAND",
    slug: "medbrand",
    name: "Biro Media Branding",
    unitType: UnitType.BIRO,
    description: "Biro Media Branding Ormawa Eksekutif PKU IPB.",
    focusArea: "Publikasi, visual identity, dokumentasi, dan kanal media.",
  },
  {
    code: "RISTEK",
    slug: "ristek",
    name: "Biro Riset dan Teknologi",
    unitType: UnitType.BIRO,
    description: "Biro Riset dan Teknologi Ormawa Eksekutif PKU IPB.",
    focusArea: "Riset data, sistem informasi, dan inovasi teknologi organisasi.",
  },
  {
    code: "KOMIT",
    slug: "komit",
    name: "Biro Kolaborasi dan Kemitraan",
    unitType: UnitType.BIRO,
    description: "Biro Kolaborasi dan Kemitraan Ormawa Eksekutif PKU IPB.",
    focusArea: "Relasi eksternal, kolaborasi, sponsorship, dan kemitraan.",
  },
  {
    code: "ADKESMAH",
    slug: "adkesmah",
    name: "Departemen Advokasi dan Kesejahteraan Mahasiswa",
    unitType: UnitType.DEPARTEMEN,
    description:
      "Departemen Advokasi dan Kesejahteraan Mahasiswa Ormawa Eksekutif PKU IPB.",
    focusArea: "Advokasi, aspirasi, dan kesejahteraan mahasiswa PKU.",
  },
  {
    code: "AKPRES",
    slug: "akpres",
    name: "Departemen Akademik dan Prestasi",
    unitType: UnitType.DEPARTEMEN,
    description: "Departemen Akademik dan Prestasi Ormawa Eksekutif PKU IPB.",
    focusArea: "Pengembangan akademik, prestasi, dan budaya belajar.",
  },
  {
    code: "KASTRAT",
    slug: "kastrat",
    name: "Departemen Kajian dan Aksi Strategis",
    unitType: UnitType.DEPARTEMEN,
    description:
      "Departemen Kajian dan Aksi Strategis Ormawa Eksekutif PKU IPB.",
    focusArea: "Kajian isu, aksi strategis, dan literasi kebijakan.",
  },
  {
    code: "PERAGA",
    slug: "peraga",
    name: "Departemen Pemuda dan Olahraga",
    unitType: UnitType.DEPARTEMEN,
    description: "Departemen Pemuda dan Olahraga Ormawa Eksekutif PKU IPB.",
    focusArea: "Kegiatan kepemudaan, olahraga, dan kebugaran mahasiswa.",
  },
  {
    code: "PSDM",
    slug: "psdm",
    name: "Departemen Pengembangan Sumber Daya Mahasiswa",
    unitType: UnitType.DEPARTEMEN,
    description:
      "Departemen Pengembangan Sumber Daya Mahasiswa Ormawa Eksekutif PKU IPB.",
    focusArea: "Pengembangan kapasitas, karakter, dan kepemimpinan mahasiswa.",
  },
  {
    code: "SENBUD",
    slug: "senbud",
    name: "Departemen Seni dan Budaya",
    unitType: UnitType.DEPARTEMEN,
    description: "Departemen Seni dan Budaya Ormawa Eksekutif PKU IPB.",
    focusArea: "Apresiasi seni, budaya, dan ekspresi kreatif mahasiswa.",
  },
  {
    code: "SLH",
    slug: "slh",
    name: "Departemen Sosial dan Lingkungan Hidup",
    unitType: UnitType.DEPARTEMEN,
    description:
      "Departemen Sosial dan Lingkungan Hidup Ormawa Eksekutif PKU IPB.",
    focusArea: "Gerakan sosial, pengabdian, dan kepedulian lingkungan.",
  },
  {
    code: "EKRAF",
    slug: "ekraf",
    name: "Departemen Ekonomi Kreatif",
    unitType: UnitType.DEPARTEMEN,
    description: "Departemen Ekonomi Kreatif Ormawa Eksekutif PKU IPB.",
    focusArea: "Kewirausahaan, ekonomi kreatif, dan pendanaan organisasi.",
  },
] as const;

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function seedRolesAndPermissions() {
  const permissionByCode = new Map<string, string>();

  for (const permission of permissions) {
    const record = await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        group: permission.group,
        description: permission.description,
      },
      create: permission,
    });
    permissionByCode.set(record.code, record.id);
  }

  for (const roleTemplate of roleTemplates) {
    const role = await prisma.role.upsert({
      where: { code: roleTemplate.code },
      update: {
        name: roleTemplate.name,
        description: roleTemplate.description,
      },
      create: {
        code: roleTemplate.code,
        name: roleTemplate.name,
        description: roleTemplate.description,
      },
    });

    for (const permissionCode of roleTemplate.permissions) {
      const permissionId = permissionByCode.get(permissionCode);
      if (!permissionId) {
        throw new Error(`Permission tidak ditemukan: ${permissionCode}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@nexus.local";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: UserRole.SUPER_ADMIN },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Super Admin Nexus",
      isActive: true,
    },
    create: {
      email,
      name: "Super Admin Nexus",
      passwordHash: hashPassword(password),
      mustChangePassword: true,
    },
  });

  await prisma.roleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });
}

async function main() {
  console.log("Memulai proses seed database...");

  const cabinetPeriod = await prisma.cabinetPeriod.upsert({
    where: {
      slug: "astana-angkasa-2025-2026",
    },
    update: {
      name: "Kabinet Astana Angkasa",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      isActive: true,
    },
    create: {
      name: "Kabinet Astana Angkasa",
      slug: "astana-angkasa-2025-2026",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      isActive: true,
    },
  });

  console.log(`Periode kabinet tersedia: ${cabinetPeriod.name}`);

  for (const birdep of birdeps) {
    await prisma.birdep.upsert({
      where: {
        cabinetPeriodId_code: {
          cabinetPeriodId: cabinetPeriod.id,
          code: birdep.code,
        },
      },
      update: {
        name: birdep.name,
        slug: birdep.slug,
        unitType: birdep.unitType,
        description: birdep.description,
        focusArea: birdep.focusArea,
        isActive: true,
        archivedAt: null,
      },
      create: {
        cabinetPeriodId: cabinetPeriod.id,
        code: birdep.code,
        slug: birdep.slug,
        name: birdep.name,
        unitType: birdep.unitType,
        description: birdep.description,
        focusArea: birdep.focusArea,
        isActive: true,
      },
    });
  }

  await seedRolesAndPermissions();
  await seedSuperAdmin();

  console.log(`${birdeps.length} unit organisasi berhasil disiapkan.`);
  console.log(`${permissions.length} permission dan ${roleTemplates.length} role template tersedia.`);
  console.log("Seed database selesai.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed database gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
