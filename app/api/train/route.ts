import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topics, difficulties, questionCount } = body;

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'At least one topic required' }, { status: 400 });
    }

    if (!difficulties || difficulties.length === 0) {
      return NextResponse.json({ error: 'At least one difficulty required' }, { status: 400 });
    }

    const allQuestions = await storage.getAllQuestions({
      topics,
      difficulties,
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found matching criteria' }, { status: 404 });
    }

    // Shuffle and select questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount || 20, allQuestions.length));

    const trainSessionId = `train-${randomUUID()}`;

    return NextResponse.json({
      trainSessionId,
      questions: selectedQuestions,
      config: {
        topics,
        difficulties,
        questionCount: selectedQuestions.length,
      },
    });
  } catch (error) {
    console.error('Train session error:', error);
    return NextResponse.json({ error: 'Failed to create train session' }, { status: 500 });
  }
}
