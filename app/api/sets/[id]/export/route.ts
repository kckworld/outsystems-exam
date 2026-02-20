import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const set = await storage.getQuestionSet(params.id);
    if (!set) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    const questions = await storage.getQuestionsForSet(params.id);

    // Export in Format A (with setMeta)
    const exportData = {
      setMeta: {
        name: set.name,
        description: set.description,
        tags: set.tags,
      },
      questions: questions.map((q) => ({
        id: q.id,
        stem: q.stem,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        topics: q.topics,
        difficulty: q.difficulty,
      })),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting question set:', error);
    return NextResponse.json(
      { error: 'Failed to export question set' },
      { status: 500 }
    );
  }
}
