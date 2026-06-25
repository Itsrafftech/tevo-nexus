import { prisma, type PermissionOverrideEffect } from "@orma/database";
import type { AuthSession } from "./auth";

export async function getEffectivePermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      permissionOverrides: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  const effective = new Set<string>();
  for (const assignment of user.roles) {
    for (const rolePermission of assignment.role.permissions) {
      effective.add(rolePermission.permission.code);
    }
  }

  for (const override of user.permissionOverrides) {
    applyOverride(effective, override.effect, override.permission.code);
  }

  return Array.from(effective).sort();
}

function applyOverride(
  permissions: Set<string>,
  effect: PermissionOverrideEffect,
  permission: string,
) {
  if (effect === "GRANT") {
    permissions.add(permission);
    return;
  }

  permissions.delete(permission);
}

export function hasPermission(
  user: Pick<AuthSession, "permissions">,
  permission: string,
) {
  return user.permissions.includes(permission);
}

export function canManageOwnBirdep(
  user: Pick<AuthSession, "permissions" | "primaryBirdepId">,
  birdepId: string,
) {
  return (
    user.permissions.includes("birdep.update.all") ||
    (user.primaryBirdepId === birdepId &&
      user.permissions.includes("birdep.update.own"))
  );
}

export function canReadAllPrograms(user: Pick<AuthSession, "permissions">) {
  return user.permissions.includes("program.read.all");
}

export function canReviewTevoContent(user: Pick<AuthSession, "permissions">) {
  return (
    user.permissions.includes("tevo.approval.review") &&
    (user.permissions.includes("tevo.approval.approve") ||
      user.permissions.includes("tevo.approval.reject"))
  );
}
