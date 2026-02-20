import { z } from 'zod';

export const AnswerSchema = z.enum(['A', 'B', 'C', 'D']);

export const DifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const QuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: DifficultySchema,
  stem: z.string().min(1, 'Question stem is required'),
  choices: z.array(z.string().min(1, 'Choice cannot be empty')).length(4, 'Exactly 4 choices are required'),
  answer: AnswerSchema,
  explanation: z.string().min(1, 'Explanation is required'),
  tags: z.array(z.string()),
  source: z.string().min(1, 'Source is required'),
  createdAt: z.string().optional().default(() => new Date().toISOString()),
});

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionSetMetaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  versionLabel: z.string().min(1, 'Version label is required'),
});

export type QuestionSetMeta = z.infer<typeof QuestionSetMetaSchema>;

export const QuestionSetSchema = z.object({
  setId: z.string(),
  title: z.string(),
  description: z.string(),
  versionLabel: z.string(),
  createdAt: z.string(),
  questionCount: z.number(),
  isLocked: z.boolean().default(true),
  parentSetId: z.string().optional(),
  questions: z.array(QuestionSchema),
});

export type QuestionSet = z.infer<typeof QuestionSetSchema>;

// Import formats
export const ImportFormatASchema = z.object({
  setMeta: QuestionSetMetaSchema,
  questions: z.array(QuestionSchema),
});

export const ImportFormatBSchema = z.array(QuestionSchema);

export const TrainConfigSchema = z.object({
  topics: z.array(z.string()).min(1, 'At least one topic required'),
  difficulties: z.array(DifficultySchema).min(1, 'At least one difficulty required'),
  questionCount: z.number().min(1).max(100).default(20),
  randomSeed: z.string().optional(),
  sourceSetIds: z.array(z.string()).default([]),
});

export type TrainConfig = z.infer<typeof TrainConfigSchema>;

export const UserAnswerSchema = z.object({
  selected: AnswerSchema,
  isCorrect: z.boolean(),
  answeredAt: z.string(),
});

export type UserAnswer = z.infer<typeof UserAnswerSchema>;

export const ProgressAnswersSchema = z.record(z.string(), UserAnswerSchema);

export const UserProgressSchema = z.object({
  scope: z.enum(['set', 'train', 'mistakeSnapshot']),
  scopeId: z.string(),
  answers: ProgressAnswersSchema,
  lastQuestionIndex: z.number().default(0),
  updatedAt: z.string(),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;

export const MistakeSnapshotSchema = z.object({
  snapshotId: z.string(),
  baseScope: z.enum(['set', 'train']),
  baseScopeId: z.string(),
  createdAt: z.string(),
  title: z.string(),
  wrongQuestionIds: z.array(z.string()),
  correctStreak: z.record(z.string(), z.number()),
  isArchived: z.boolean().default(false),
  deletedAt: z.string().optional(),
});

export type MistakeSnapshot = z.infer<typeof MistakeSnapshotSchema>;
