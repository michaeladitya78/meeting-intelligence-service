import { z } from 'zod';

const transcriptEntrySchema = z.object({
  timestamp: z.string().min(1, 'timestamp required'),
  speaker: z.string().min(1, 'speaker required'),
  text: z.string().min(1, 'text required'),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'title required'),
  // participants stored as string array, not a relation — simpler for this use case
  participants: z
    .array(z.string().email('invalid participant email'))
    .min(1, 'at least one participant required'),
  meetingDate: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'invalid date' }
  ),
  transcript: z
    .array(transcriptEntrySchema)
    .min(1, 'transcript must be an array'),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
