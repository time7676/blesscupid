import { z } from 'zod';

export const DenominationSchema = z.enum(['catholic', 'protestant', 'orthodox', 'other']);
export type Denomination = z.infer<typeof DenominationSchema>;

export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;

export const MarriageIntentSchema = z.enum([
  'within_1y',
  'within_2y',
  'within_5y',
  'open_timeline',
]);
export type MarriageIntent = z.infer<typeof MarriageIntentSchema>;

export const ChurchAttendanceSchema = z.enum(['weekly', 'monthly', 'occasional', 'rarely']);
export type ChurchAttendance = z.infer<typeof ChurchAttendanceSchema>;

export const SpiritualGiftSchema = z.enum([
  'teaching',
  'service',
  'mercy',
  'exhortation',
  'giving',
  'leadership',
  'evangelism',
  'hospitality',
]);
export type SpiritualGift = z.infer<typeof SpiritualGiftSchema>;

export const FaithProfileSchema = z.object({
  denomination: DenominationSchema,
  churchAttendance: ChurchAttendanceSchema,
  baptized: z.boolean(),
  marriageIntent: MarriageIntentSchema,
  spiritualGifts: z.array(SpiritualGiftSchema).max(3).default([]),
});
export type FaithProfile = z.infer<typeof FaithProfileSchema>;

export const GeoPointSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;
