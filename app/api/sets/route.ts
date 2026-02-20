import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'date' | 'title' | 'count') || 'date';

    const sets = await storage.getQuestionSets(search, sortBy);

    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Get sets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
