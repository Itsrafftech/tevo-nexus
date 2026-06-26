import type { AuthSession } from "./auth";

type ProgramRecord = {
  id: string;
  name: string;
  slug: string;
  internalDescription?: string | null;
  publicDescription?: string | null;
  status: string;
  progressPercent: number;
  startDate?: Date | null;
  endDate?: Date | null;
  primaryBirdepId: string;
  primaryBirdep?: {
    id: string;
    name: string;
    slug: string;
    code: string;
  };
  collaborators?: unknown;
  pics?: unknown;
  updates?: unknown;
  issues?: unknown;
  followUps?: unknown;
  pressRelease?: unknown;
  coverImage?: unknown;
  createdBy?: unknown;
  updatedBy?: unknown;
  updatedAt?: Date;
};

export function canReadProgramDetail(session: AuthSession, program: ProgramRecord) {
  return (
    session.permissions.includes("program.read.all_detail") ||
    session.permissions.includes("program.manage.all") ||
    (session.primaryBirdepId === program.primaryBirdepId &&
      session.permissions.includes("program.read.own_detail"))
  );
}

export function canUpdateProgramProgress(session: AuthSession, program: ProgramRecord) {
  return (
    session.permissions.includes("program.manage.all") ||
    (session.primaryBirdepId === program.primaryBirdepId &&
      (session.permissions.includes("program.update.own_progress") ||
        session.permissions.includes("program.update.own_birdep")))
  );
}

export function serializeProgramForSession(
  program: ProgramRecord,
  session: AuthSession,
) {
  if (!canReadProgramDetail(session, program)) {
    return serializeProgramSummary(program);
  }

  return {
    id: program.id,
    name: program.name,
    slug: program.slug,
    internalDescription: program.internalDescription,
    publicDescription: program.publicDescription,
    status: program.status,
    progressPercent: program.progressPercent,
    startDate: program.startDate,
    endDate: program.endDate,
    primaryBirdep: program.primaryBirdep,
    collaborators: program.collaborators,
    pressRelease: program.pressRelease,
    progressUpdates: program.updates,
    issues: program.issues,
    followUps: program.followUps,
    mediaAssets: {
      coverImage: program.coverImage,
      pics: program.pics,
    },
    createdBy: program.createdBy,
    updatedBy: program.updatedBy,
    updatedAt: program.updatedAt,
  };
}

export function serializeProgramSummary(program: ProgramRecord) {
  return {
    id: program.id,
    name: program.name,
    slug: program.slug,
    birdep: program.primaryBirdep
      ? {
          id: program.primaryBirdep.id,
          name: program.primaryBirdep.name,
          slug: program.primaryBirdep.slug,
          code: program.primaryBirdep.code,
        }
      : null,
    status: program.status,
    progressPercent: program.progressPercent,
  };
}
