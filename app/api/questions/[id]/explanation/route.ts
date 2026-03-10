import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const explanation = String(body?.explanation || '').trim();
    const stem = body?.stem !== undefined ? String(body.stem || '').trim() : null;
    const rawChoices: unknown[] | null = Array.isArray(body?.choices) ? body.choices : null;

    if (stem !== null && !stem) {
      return NextResponse.json({ error: 'Stem is required when updating question content' }, { status: 400 });
    }

    if (!explanation && !stem && !rawChoices) {
      return NextResponse.json({ error: 'At least one editable field is required' }, { status: 400 });
    }

    if (rawChoices) {
      const choices = rawChoices.map((c: unknown) => String(c || '').trim());
      if (choices.length < 2 || choices.length > 6) {
        return NextResponse.json({ error: 'Choices must be between 2 and 6 items' }, { status: 400 });
      }
      if (choices.some((c: string) => !c)) {
        return NextResponse.json({ error: 'All choices must be non-empty' }, { status: 400 });
      }
      await storage.updateQuestionContent(params.id, stem ?? '', choices);
    } else if (stem !== null) {
      return NextResponse.json({ error: 'Choices are required when stem is updated' }, { status: 400 });
    }

    if (explanation) {
      await storage.updateQuestionExplanation(params.id, explanation);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating explanation:', error);
    return NextResponse.json({ error: 'Failed to update explanation' }, { status: 500 });
  }
}
