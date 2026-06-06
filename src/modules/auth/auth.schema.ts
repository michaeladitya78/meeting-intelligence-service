import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('invalid email'),
  password: z.string().min(8, 'min 8 characters'),
  name: z.string().min(1, 'name required'),
});

export const loginSchema = z.object({
  email: z.string().email('invalid email'),
  password: z.string().min(1, 'password required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
