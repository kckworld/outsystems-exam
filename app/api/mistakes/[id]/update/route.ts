import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

// POST /api/mistakes/[id]/update - Update correctStreak after practice
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { answers } = body; // { [questionId]: boolean (isCorrect) }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid answers object' },
        { status: 400 }
      );
    }

    // Fetch current snapshot
    const snapshot = await storage.getMistakeSnapshot(params.id);
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    // Update correctStreak
    const newCorrectStreak = { ...snapshot.correctStreak };
    const questionIds = Object.keys(answers);
    
    for (const questionId of questionIds) {
      const isCorrect = answers[questionId];
      if (isCorrect) {
        newCorrectStreak[questionId] = (newCorrectStreak[questionId] || 0) + 1;
      } else {
        newCorrectStreak[questionId] = 0; // Reset on wrong answer
      }
    }

    // Check if all questions are mastered (2+ streak)
    const allMastered = snapshot.wrongQuestionIds.every(
      (id) => (newCorrectStreak[id] || 0) >= 2
    );

    // Update snapshot
    await storage.updateMistakeSnapshot(params.id, {
      correctStreak: newCorrectStreak,
      isArchived: allMastered,
    });

    return NextResponse.json({
      success: true,
      correctStreak: newCorrectStreak,
      isArchived: allMastered,
    });
  } catch (error) {
    console.error('Error updating snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to update snapshot' },
      { status: 500 }
    );
  }
}
