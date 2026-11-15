import { z } from 'zod';

import { blocksSchema } from '@/features/content/schema';

const courseTrack = z.enum(['pde']);

const exam = z.object({
  course: z.string(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().optional(),
  semester: z.string().optional(),
  track: courseTrack.optional(),
  examiners: z.array(z.string()).optional(),
});

const classSession = z.object({
  course: z.string(),
  day: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().optional(),
  type: z.string().optional(),
  semester: z.string().optional(),
  track: courseTrack.optional(),
  teacher: z.string().optional(),
});

const scheduleDocument = z.object({
  url: z.string(),
  label: z.string(),
  format: z.enum(['docx', 'doc', 'pdf', 'xlsx', 'xls']),
});

export const scheduleResponseSchema = z.object({
  dept: z.string(),
  kind: z.enum(['exams', 'timetable']),
  available: z.boolean(),
  document: scheduleDocument.nullable(),
  exams: z.array(exam),
  classes: z.array(classSession),
  original: blocksSchema,
});

export type Exam = z.infer<typeof exam>;
export type ClassSession = z.infer<typeof classSession>;
export type ScheduleDocument = z.infer<typeof scheduleDocument>;
export type ScheduleResponse = z.infer<typeof scheduleResponseSchema>;
export type ScheduleKind = ScheduleResponse['kind'];
