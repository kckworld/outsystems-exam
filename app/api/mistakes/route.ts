import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

// POST /api/mistakes - Create mistake snapshot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseScope, baseScopeId, title, wrongQuestionIds } = body;

    if (!baseScope || !baseScopeId || !title || !wrongQuestionIds || !Array.isArray(wrongQuestionIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: baseScope, baseScopeId, title, wrongQuestionIds' },
        { status: 400 }
      );
    }

    if (wrongQuestionIds.length === 0) {
      return NextResponse.json(
        { error: 'Cannot create mistake snapshot with no wrong questions' },
        { status: 400 }
      );
    }

    // Create snapshot
    const snapshot = await storage.createMistakeSnapshot({
      baseScope,
      baseScopeId,
      title,
      wrongQuestionIds,
      correctStreak: {},
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Error creating mistake snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create mistake snapshot' },
      { status: 500 }
    );
  }
}

// GET /api/mistakes - List mistake snapshots
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const snapshots = await storage.getAllMistakeSnapshots(includeArchived);

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('Error fetching mistake snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mistake snapshots' },
      { status: 500 }
    );
  }
}
