import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const explanation = String(body?.explanation || '').trim();

    if (!explanation) {
      return NextResponse.json({ error: 'Explanation is required' }, { status: 400 });
    }

    await storage.updateQuestionExplanation(params.id, explanation);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating explanation:', error);
    return NextResponse.json({ error: 'Failed to update explanation' }, { status: 500 });
  }
}
