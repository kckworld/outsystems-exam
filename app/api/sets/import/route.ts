import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';
import { QuestionSchema, QuestionSetMetaSchema, ImportFormatASchema, ImportFormatBSchema } from '@/lib/schema';
import { randomUUID } from 'crypto';

function requireAdminKey(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return true; // No admin key set, allow all
  }

  const providedKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey');
  return providedKey === adminKey;
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdminKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Try Format A (with setMeta)
    const formatAResult = ImportFormatASchema.safeParse(body);
    if (formatAResult.success) {
      const { setMeta, questions } = formatAResult.data;

      // Validate all questions
      const validationErrors: Array<{ questionId: string; field: string; message: string }> = [];
      const questionIds = new Set<string>();

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

        // Check duplicate IDs
        if (questionIds.has(q.id)) {
          validationErrors.push({
            questionId: q.id,
            field: 'id',
            message: 'Duplicate question ID',
          });
        }
        questionIds.add(q.id);
      }

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
        ...setMeta,
        createdAt: new Date().toISOString(),
        questionCount: questions.length,
        isLocked: true,
        questions,
      };

      await storage.createQuestionSet(newSet);

      return NextResponse.json({
        success: true,
        setId: newSet.setId,
        questionCount: questions.length,
      });
    }

    // Try Format B (questions only)
    const formatBResult = ImportFormatBSchema.safeParse(body);
    if (formatBResult.success) {
      const questions = formatBResult.data;

      // Return preview and require setMeta
      return NextResponse.json({
        requiresSetMeta: true,
        preview: {
          questionCount: questions.length,
          topics: Array.from(new Set(questions.map((q) => q.topic))),
          difficulties: Array.from(new Set(questions.map((q) => q.difficulty))).sort(),
          sample: questions.slice(0, 3),
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

    // Validate all questions
    const validationErrors: Array<{ questionId: string; field: string; message: string }> = [];
    const questionIds = new Set<string>();

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

      if (questionIds.has(q.id)) {
        validationErrors.push({
          questionId: q.id,
          field: 'id',
          message: 'Duplicate question ID',
        });
      }
      questionIds.add(q.id);
    }

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
      questionCount: questions.length,
      isLocked: true,
      questions,
    };

    await storage.createQuestionSet(newSet);

    return NextResponse.json({
      success: true,
      setId: newSet.setId,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
