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

    return NextResponse.json({
      set,
      questions,
    });
  } catch (error) {
    console.error('Error fetching question set:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question set' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await storage.deleteQuestionSet(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question set:', error);
    return NextResponse.json(
      { error: 'Failed to delete question set' },
      { status: 500 }
    );
  }
}
