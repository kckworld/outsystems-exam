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

    // Export in Format A (with setMeta)
    const exportData = {
      setMeta: {
        title: set.title,
        description: set.description,
        versionLabel: set.versionLabel,
      },
      questions: set.questions.map((q) => ({
        id: q.id,
        topic: q.topic,
        stem: q.stem,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        tags: q.tags,
        difficulty: q.difficulty,
        source: q.source,
        createdAt: q.createdAt,
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
