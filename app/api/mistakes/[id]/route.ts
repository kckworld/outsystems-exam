import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

// GET /api/mistakes/[id] - Get specific mistake snapshot
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snapshot = await storage.getMistakeSnapshot(params.id);

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Mistake snapshot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Error fetching mistake snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mistake snapshot' },
      { status: 500 }
    );
  }
}

// DELETE /api/mistakes/[id] - Soft delete mistake snapshot
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await storage.deleteMistakeSnapshot(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mistake snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to delete mistake snapshot' },
      { status: 500 }
    );
  }
}
