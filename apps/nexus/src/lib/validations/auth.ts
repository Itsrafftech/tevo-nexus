import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});
