import { z } from 'zod';

export const KycStatusSchema = z.enum(['none', 'pending', 'approved', 'rejected']);
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const SubmitKycSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK must be exactly 16 digits'),
  fullName: z.string().min(2).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  ktpImageUrl: z.string().url(),
  selfieImageUrl: z.string().url(),
});
export type SubmitKycInput = z.infer<typeof SubmitKycSchema>;

export const ReviewKycSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().min(1).optional(),
});
export type ReviewKycInput = z.infer<typeof ReviewKycSchema>;
