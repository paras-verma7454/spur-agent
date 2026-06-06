import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .transform((msg) => msg.slice(0, 2000)),
  sessionId: z.string().uuid('Invalid session ID format').nullable().optional(),
});

export const historyQuerySchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});
