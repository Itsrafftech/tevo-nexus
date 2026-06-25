import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email().toLowerCase(),
  name: z.string().min(2),
  roleCodes: z.array(z.string()).min(1),
  primaryBirdepId: z.uuid().optional(),
  memberId: z.uuid().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const permissionOverrideSchema = z.object({
  grants: z.array(z.string()).default([]),
  revokes: z.array(z.string()).default([]),
});
