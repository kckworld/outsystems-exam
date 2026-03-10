import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

function requireAdminKey(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminPassword && !adminKey) {
    return true;
  }

  const providedPassword =
    req.headers.get('x-admin-password') ||
    req.nextUrl.searchParams.get('adminPassword') ||
    req.headers.get('x-admin-key') ||
    req.nextUrl.searchParams.get('adminKey');

  if (!providedPassword) return false;
  if (adminPassword && providedPassword === adminPassword) return true;
  if (adminKey && providedPassword === adminKey) return true;
  return false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!requireAdminKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const stem = String(body?.stem || '').trim();
    const rawChoices = Array.isArray(body?.choices) ? body.choices : null;

    if (!stem) {
      return NextResponse.json({ error: 'Stem is required' }, { status: 400 });
    }

    if (!rawChoices) {
      return NextResponse.json({ error: 'Choices array is required' }, { status: 400 });
    }

    const choices = rawChoices.map((c) => String(c || '').trim());
    if (choices.length < 2 || choices.length > 6) {
      return NextResponse.json({ error: 'Choices must be between 2 and 6 items' }, { status: 400 });
    }

    if (choices.some((c) => !c)) {
      return NextResponse.json({ error: 'All choices must be non-empty' }, { status: 400 });
    }

    await storage.updateQuestionContent(params.id, stem, choices);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}
