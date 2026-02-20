import { PrismaClient } from '@prisma/client';
import type { Question, QuestionSet, UserProgress, MistakeSnapshot } from '../schema';

const prisma = new PrismaClient();

export class SQLiteStorage {
  // Question Sets
  async createQuestionSet(set: QuestionSet): Promise<QuestionSet> {
    await prisma.questionSet.create({
      data: {
        setId: set.setId,
        title: set.title,
        description: set.description,
        versionLabel: set.versionLabel,
        createdAt: set.createdAt,
        questionCount: set.questionCount,
        isLocked: set.isLocked,
        parentSetId: set.parentSetId,
      },
    });

    for (const q of set.questions) {
      await prisma.question.create({
        data: {
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          stem: q.stem,
          choices: JSON.stringify(q.choices),
          answer: q.answer,
          explanation: q.explanation,
          tags: JSON.stringify(q.tags),
          source: q.source,
          createdAt: q.createdAt || new Date().toISOString(),
          setId: set.setId,
        },
      });
    }

    return set;
  }

  async getQuestionSets(search?: string, sortBy: 'date' | 'title' | 'count' = 'date'): Promise<QuestionSet[]> {
    const sets = await prisma.questionSet.findMany({
      include: {
        questions: true,
      },
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined,
      orderBy:
        sortBy === 'date'
          ? { createdAt: 'desc' }
          : sortBy === 'title'
          ? { title: 'asc' }
          : { questionCount: 'desc' },
    });

    return sets.map((set) => ({
      setId: set.setId,
      title: set.title,
      description: set.description,
      versionLabel: set.versionLabel,
      createdAt: set.createdAt,
      questionCount: set.questionCount,
      isLocked: set.isLocked,
      parentSetId: set.parentSetId || undefined,
      questions: set.questions.map((q) => ({
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty as 1 | 2 | 3,
        stem: q.stem,
        choices: JSON.parse(q.choices) as [string, string, string, string],
        answer: q.answer as 'A' | 'B' | 'C' | 'D',
        explanation: q.explanation,
        tags: JSON.parse(q.tags) as string[],
        source: q.source,
        createdAt: q.createdAt,
      })),
    }));
  }

  async getQuestionSet(setId: string): Promise<QuestionSet | null> {
    const set = await prisma.questionSet.findUnique({
      where: { setId },
      include: { questions: true },
    });

    if (!set) return null;

    return {
      setId: set.setId,
      title: set.title,
      description: set.description,
      versionLabel: set.versionLabel,
      createdAt: set.createdAt,
      questionCount: set.questionCount,
      isLocked: set.isLocked,
      parentSetId: set.parentSetId || undefined,
      questions: set.questions.map((q) => ({
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty as 1 | 2 | 3,
        stem: q.stem,
        choices: JSON.parse(q.choices) as [string, string, string, string],
        answer: q.answer as 'A' | 'B' | 'C' | 'D',
        explanation: q.explanation,
        tags: JSON.parse(q.tags) as string[],
        source: q.source,
        createdAt: q.createdAt,
      })),
    };
  }

  async deleteQuestionSet(setId: string): Promise<void> {
    await prisma.question.deleteMany({ where: { setId } });
    await prisma.questionSet.delete({ where: { setId } });
  }

  // User Progress
  async saveProgress(progress: UserProgress): Promise<void> {
    await prisma.userProgress.upsert({
      where: {
        scope_scopeId: {
          scope: progress.scope,
          scopeId: progress.scopeId,
        },
      },
      update: {
        answers: JSON.stringify(progress.answers),
        lastQuestionIndex: progress.lastQuestionIndex,
        updatedAt: progress.updatedAt,
      },
      create: {
        scope: progress.scope,
        scopeId: progress.scopeId,
        answers: JSON.stringify(progress.answers),
        lastQuestionIndex: progress.lastQuestionIndex,
        updatedAt: progress.updatedAt,
      },
    });
  }

  async getProgress(scope: string, scopeId: string): Promise<UserProgress | null> {
    const progress = await prisma.userProgress.findUnique({
      where: {
        scope_scopeId: {
          scope,
          scopeId,
        },
      },
    });

    if (!progress) return null;

    return {
      scope: progress.scope as 'set' | 'train' | 'mistakeSnapshot',
      scopeId: progress.scopeId,
      answers: JSON.parse(progress.answers),
      lastQuestionIndex: progress.lastQuestionIndex,
      updatedAt: progress.updatedAt,
    };
  }

  // Train Session
  async createTrainSession(session: Omit<TrainSession, 'trainSessionId'>): Promise<TrainSession> {
    const created = await prisma.trainSession.create({
      data: {
        createdAt: session.createdAt,
        config: JSON.stringify(session.config),
        selectedQuestionIds: JSON.stringify(session.selectedQuestionIds),
        status: session.status,
      },
    });

    return {
      trainSessionId: created.trainSessionId,
      createdAt: created.createdAt,
      config: JSON.parse(created.config),
      selectedQuestionIds: JSON.parse(created.selectedQuestionIds),
      status: created.status as 'active' | 'completed',
    };
  }

  async getTrainSession(trainSessionId: string): Promise<TrainSession | null> {
    const session = await prisma.trainSession.findUnique({
      where: { trainSessionId },
    });

    if (!session) return null;

    return {
      trainSessionId: session.trainSessionId,
      createdAt: session.createdAt,
      config: JSON.parse(session.config),
      selectedQuestionIds: JSON.parse(session.selectedQuestionIds),
      status: session.status as 'active' | 'completed',
    };
  }

  // Mistake Snapshots
  async createMistakeSnapshot(snapshot: MistakeSnapshot): Promise<void> {
    await prisma.mistakeSnapshot.create({
      data: {
        snapshotId: snapshot.snapshotId,
        baseScope: snapshot.baseScope,
        baseScopeId: snapshot.baseScopeId,
        createdAt: snapshot.createdAt,
        title: snapshot.title,
        wrongQuestionIds: JSON.stringify(snapshot.wrongQuestionIds),
        correctStreak: JSON.stringify(snapshot.correctStreak),
        isArchived: snapshot.isArchived,
        deletedAt: snapshot.deletedAt,
      },
    });
  }

  async getMistakeSnapshots(includeArchived = false): Promise<MistakeSnapshot[]> {
    const snapshots = await prisma.mistakeSnapshot.findMany({
      where: includeArchived ? undefined : { isArchived: false, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return snapshots.map((s) => ({
      snapshotId: s.snapshotId,
      baseScope: s.baseScope as 'set' | 'train',
      baseScopeId: s.baseScopeId,
      createdAt: s.createdAt,
      title: s.title,
      wrongQuestionIds: JSON.parse(s.wrongQuestionIds),
      correctStreak: JSON.parse(s.correctStreak),
      isArchived: s.isArchived,
      deletedAt: s.deletedAt || undefined,
    }));
  }

  async getMistakeSnapshot(snapshotId: string): Promise<MistakeSnapshot | null> {
    const snapshot = await prisma.mistakeSnapshot.findUnique({
      where: { snapshotId },
    });

    if (!snapshot) return null;

    return {
      snapshotId: snapshot.snapshotId,
      baseScope: snapshot.baseScope as 'set' | 'train',
      baseScopeId: snapshot.baseScopeId,
      createdAt: snapshot.createdAt,
      title: snapshot.title,
      wrongQuestionIds: JSON.parse(snapshot.wrongQuestionIds),
      correctStreak: JSON.parse(snapshot.correctStreak),
      isArchived: snapshot.isArchived,
      deletedAt: snapshot.deletedAt || undefined,
    };
  }

  async updateMistakeSnapshot(snapshotId: string, updates: Partial<MistakeSnapshot>): Promise<void> {
    await prisma.mistakeSnapshot.update({
      where: { snapshotId },
      data: {
        wrongQuestionIds: updates.wrongQuestionIds
          ? JSON.stringify(updates.wrongQuestionIds)
          : undefined,
        correctStreak: updates.correctStreak ? JSON.stringify(updates.correctStreak) : undefined,
        isArchived: updates.isArchived,
      },
    });
  }

  async deleteMistakeSnapshot(snapshotId: string): Promise<void> {
    await prisma.mistakeSnapshot.update({
      where: { snapshotId },
      data: {
        deletedAt: new Date().toISOString(),
      },
    });
  }

  // Get all questions (for training)
  async getAllQuestions(filters?: {
    topics?: string[];
    difficulties?: (1 | 2 | 3)[];
    sourceSetIds?: string[];
  }): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: {
        AND: [
          filters?.topics ? { topic: { in: filters.topics } } : {},
          filters?.difficulties ? { difficulty: { in: filters.difficulties } } : {},
          filters?.sourceSetIds ? { setId: { in: filters.sourceSetIds } } : {},
        ],
      },
    });

    return questions.map((q) => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty as 1 | 2 | 3,
      stem: q.stem,
      choices: JSON.parse(q.choices) as [string, string, string, string],
      answer: q.answer as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation,
      tags: JSON.parse(q.tags) as string[],
      source: q.source,
      createdAt: q.createdAt,
    }));
  }

  async getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    return questions.map((q) => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty as 1 | 2 | 3,
      stem: q.stem,
      choices: JSON.parse(q.choices) as [string, string, string, string],
      answer: q.answer as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation,
      tags: JSON.parse(q.tags) as string[],
      source: q.source,
      createdAt: q.createdAt,
    }));
  }
}

export const storage = new SQLiteStorage();

export type TrainSession = {
  trainSessionId: string;
  createdAt: string;
  config: any;
  selectedQuestionIds: string[];
  status: 'active' | 'completed';
};
