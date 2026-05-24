import { z } from 'zod';

export const aiSearchQueryReferenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
});

export const aiSearchQuerySchema = z.object({
  query: z.string().default(''),
  city: aiSearchQueryReferenceSchema.optional(),
  country: aiSearchQueryReferenceSchema.optional(),
  university: aiSearchQueryReferenceSchema.optional(),
  faculty: aiSearchQueryReferenceSchema.optional(),
  ageFrom: z.number().int().positive().optional(),
  ageTo: z.number().int().positive().optional(),
  graduationYear: z.number().int().optional(),
  relation: z
    .enum([
      'VK_RELATION_STATUS_UNSPECIFIED',
      'VK_RELATION_STATUS_UNKNOWN',
      'VK_RELATION_STATUS_NOT_SPECIFIED',
      'VK_RELATION_STATUS_SINGLE',
      'VK_RELATION_STATUS_RELATIONSHIP',
      'VK_RELATION_STATUS_ENGAGED',
      'VK_RELATION_STATUS_MARRIED',
      'VK_RELATION_STATUS_COMPLICATED',
      'VK_RELATION_STATUS_SEARCHING',
      'VK_RELATION_STATUS_IN_LOVE',
      'VK_RELATION_STATUS_CIVIL_UNION',
    ])
    .default('VK_RELATION_STATUS_UNSPECIFIED'),
  onlineOnly: z.boolean().default(false),
});

export type AiSearchQuery = z.infer<typeof aiSearchQuerySchema>;
