import { z } from "zod";

export const birdepUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  focusArea: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const memberSchema = z.object({
  fullName: z.string().min(2),
  nim: z.string().min(3),
  instagram: z.string().regex(/^@[\w.]+$/).optional(),
  primaryBirdepId: z.uuid(),
  organizationalPosition: z.string(),
  internalTitle: z.string().optional(),
  publicTitle: z.string().optional(),
  subdivision: z.string().optional(),
});

export const programSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  primaryBirdepId: z.uuid(),
  internalDescription: z.string().min(1),
  publicDescription: z.string().optional(),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"])
    .optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const progressUpdateSchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
  updateText: z.string().min(1),
  internalIssue: z.string().optional(),
  internalFollowUp: z.string().optional(),
});
