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
