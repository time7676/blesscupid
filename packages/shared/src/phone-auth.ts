import { z } from 'zod';

export const VerifyPhoneSchema = z.object({
  idToken: z.string().min(20),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'E.164 format required (e.g. +6281234567890)'),
});
export type VerifyPhoneInput = z.infer<typeof VerifyPhoneSchema>;
