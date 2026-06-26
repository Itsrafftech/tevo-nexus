import { z } from "zod";

export const contentPayloadSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
});

export const submitReviewSchema = z.object({
  reviewerId: z.uuid(),
  note: z.string().optional(),
});

export const rejectApprovalSchema = z.object({
  note: z.string().min(1),
});

export const reassignApprovalSchema = z.object({
  reviewerId: z.uuid(),
});

export const newsArticleSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  excerpt: z.string().optional(),
  body: z.string().min(1),
  imageId: z.uuid().optional(),
  status: z
    .enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "REJECTED", "ARCHIVED"])
    .optional(),
});
