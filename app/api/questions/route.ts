import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

// POST /api/questions - Get questions by IDs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds } = body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid questionIds array' },
        { status: 400 }
      );
    }

    const questions = await storage.getQuestionsByIds(questionIds);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
