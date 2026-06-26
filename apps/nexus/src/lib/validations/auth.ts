import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password harus mengandung huruf besar.")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil.")
    .regex(/[0-9]/, "Password harus mengandung angka."),
});
