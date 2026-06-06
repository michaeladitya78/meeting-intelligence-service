import { z } from 'zod';

const citationSchema = z.object({
  timestamp: z.string().min(1),
  speaker: z.string().min(1, 'speaker required'),
  quote: z.string().min(1),
});

export const createActionItemSchema = z.object({
  meetingId: z.string().uuid('meetingId must be a valid UUID'),
  task: z.string().min(1, 'task required'),
  assignee: z.string().min(1, 'assignee required'),
  dueDate: z.string().optional().nullable(),
  citations: z.array(citationSchema).min(1, 'at least one citation required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    errorMap: () => ({ message: 'invalid status' }),
  }),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
