import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const originalSet = await storage.getQuestionSet(params.id);
    if (!originalSet) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    const originalQuestions = await storage.getQuestionsForSet(params.id);

    // Create new set with "(Copy)" suffix
    const newSetId = uuidv4();
    const newSet = await storage.createQuestionSet({
      id: newSetId,
      name: `${originalSet.name} (Copy)`,
      description: originalSet.description,
      tags: originalSet.tags,
      questionsCount: originalSet.questionsCount,
      isLocked: false, // Clones are always unlocked
    });

    // Clone all questions
    const clonedQuestions = await Promise.all(
      originalQuestions.map((q) =>
        storage.createQuestion({
          ...q,
          id: uuidv4(),
          setId: newSetId,
        })
      )
    );

    return NextResponse.json({
      set: newSet,
      questions: clonedQuestions,
    });
  } catch (error) {
    console.error('Error cloning question set:', error);
    return NextResponse.json(
      { error: 'Failed to clone question set' },
      { status: 500 }
    );
  }
}
