import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';
import { QuestionSchema, QuestionSetMetaSchema, ImportFormatASchema, ImportFormatBSchema } from '@/lib/schema';
import type { Question } from '@/lib/schema';
import { randomUUID } from 'crypto';

function requireAdminKey(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return true; // No admin key set, allow all
  }

  const providedKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey');
  return providedKey === adminKey;
}

function withQuestionIds(questions: Question[]): Question[] {
  return questions.map((q, index) => ({
    ...q,
    id: q.id || `${randomUUID()}-${index}`,
  }));
}

function validateQuestions(
  questions: Question[],
  existingIds: Set<string> = new Set()
) {
  const validationErrors: Array<{ questionId: string; field: string; message: string }> = [];
  const questionIds = new Set<string>(existingIds);

  for (const q of questions) {
    const result = QuestionSchema.safeParse(q);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        validationErrors.push({
          questionId: q.id || 'unknown',
          field: issue.path.join('.'),
          message: issue.message,
        });
      });
    }

    if (q.id && questionIds.has(q.id)) {
      validationErrors.push({
        questionId: q.id,
        field: 'id',
        message: 'Duplicate question ID',
      });
    }

    if (q.id) {
      questionIds.add(q.id);
    }
  }

  return validationErrors;
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdminKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const mergeByMeta = req.nextUrl.searchParams.get('mergeByMeta') === 'true';

    // Try Format A (with setMeta)
    const formatAResult = ImportFormatASchema.safeParse(body);
    if (formatAResult.success) {
      const { setMeta, questions } = formatAResult.data;

      const questionsWithIds = withQuestionIds(questions);
      let existingSetId: string | null = null;
      let existingCount = 0;
      let existingIds = new Set<string>();

      if (mergeByMeta) {
        const existing = await storage.findQuestionSetByMeta(setMeta.title, setMeta.description);
        if (existing) {
          existingSetId = existing.setId;
          existingCount = existing.questionCount;
          existingIds = new Set(existing.questions.map((q) => q.id).filter((id): id is string => Boolean(id)));
        }
      }

      const validationErrors = validateQuestions(questionsWithIds, existingIds);

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationErrors,
          },
          { status: 400 }
        );
      }

      if (existingSetId) {
        await storage.appendQuestionsToSet(existingSetId, questionsWithIds);

        return NextResponse.json({
          success: true,
          merged: true,
          setId: existingSetId,
          set: {
            title: setMeta.title,
            questionCount: existingCount + questionsWithIds.length,
            addedCount: questionsWithIds.length,
          },
        });
      }

      // Create question set
      const newSet = {
        setId: randomUUID(),
        ...setMeta,
        createdAt: new Date().toISOString(),
        questionCount: questionsWithIds.length,
        isLocked: true,
        questions: questionsWithIds,
      };

      await storage.createQuestionSet(newSet);

      return NextResponse.json({
        success: true,
        setId: newSet.setId,
        set: {
          title: newSet.title,
          questionCount: questionsWithIds.length,
        },
      });
    }

    // Try Format B (questions only)
    const formatBResult = ImportFormatBSchema.safeParse(body);
    if (formatBResult.success) {
      const questions = formatBResult.data;

      const questionsWithIds = withQuestionIds(questions);

      // Auto-generate metadata from questions
      const topics = Array.from(new Set(questions.map((q) => q.topic)));
      const autoTitle = topics.length > 0 
        ? `${topics[0]}${topics.length > 1 ? ` and ${topics.length - 1} more` : ''}`
        : 'Imported Question Set';
      
      const autoMeta = {
        title: autoTitle,
        description: `Imported ${questions.length} questions covering topics: ${topics.slice(0, 5).join(', ')}${topics.length > 5 ? '...' : ''}`,
        versionLabel: `v${new Date().toISOString().split('T')[0]}`,
      };

      let existingSetId: string | null = null;
      let existingCount = 0;
      let existingIds = new Set<string>();

      if (mergeByMeta) {
        const existing = await storage.findQuestionSetByMeta(autoMeta.title, autoMeta.description);
        if (existing) {
          existingSetId = existing.setId;
          existingCount = existing.questionCount;
          existingIds = new Set(existing.questions.map((q) => q.id).filter((id): id is string => Boolean(id)));
        }
      }

      const validationErrors = validateQuestions(questionsWithIds, existingIds);

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationErrors,
          },
          { status: 400 }
        );
      }

      if (existingSetId) {
        await storage.appendQuestionsToSet(existingSetId, questionsWithIds);

        return NextResponse.json({
          success: true,
          merged: true,
          setId: existingSetId,
          set: {
            title: autoMeta.title,
            questionCount: existingCount + questionsWithIds.length,
            addedCount: questionsWithIds.length,
          },
        });
      }

      // Create question set with auto-generated metadata
      const newSet = {
        setId: randomUUID(),
        ...autoMeta,
        createdAt: new Date().toISOString(),
        questionCount: questionsWithIds.length,
        isLocked: true,
        questions: questionsWithIds,
      };

      await storage.createQuestionSet(newSet);

      return NextResponse.json({
        success: true,
        setId: newSet.setId,
        set: {
          title: newSet.title,
          questionCount: questionsWithIds.length,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid import format' }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle setMeta submission for Format B
export async function PUT(req: NextRequest) {
  try {
    if (!requireAdminKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { setMeta, questions } = body;

    const metaResult = QuestionSetMetaSchema.safeParse(setMeta);
    if (!metaResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid setMeta',
          details: metaResult.error.issues,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        {
          error: 'Invalid questions payload',
        },
        { status: 400 }
      );
    }

    const parsedQuestions: Question[] = [];
    const questionParseErrors: Array<{ questionId: string; field: string; message: string }> = [];

    questions.forEach((q: unknown, index: number) => {
      const parsed = QuestionSchema.safeParse(q);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          questionParseErrors.push({
            questionId: (q as { id?: string })?.id || `index-${index}`,
            field: issue.path.join('.'),
            message: issue.message,
          });
        });
        return;
      }
      parsedQuestions.push(parsed.data);
    });

    if (questionParseErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: questionParseErrors,
        },
        { status: 400 }
      );
    }

    const questionsWithIds = withQuestionIds(parsedQuestions);
    const validationErrors = validateQuestions(questionsWithIds);

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Create question set
    const newSet = {
      setId: randomUUID(),
      ...metaResult.data,
      createdAt: new Date().toISOString(),
      questionCount: questionsWithIds.length,
      isLocked: true,
      questions: questionsWithIds,
    };

    await storage.createQuestionSet(newSet);

    return NextResponse.json({
      success: true,
      setId: newSet.setId,
      questionCount: questionsWithIds.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
