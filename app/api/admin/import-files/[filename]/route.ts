import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { deleteImportFile, getImportFileContent, updateImportFileMetadata } from '@/lib/storage/import-files';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const file = await getImportFileContent(decodeURIComponent(params.filename));
    return NextResponse.json({ file });
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteImportFile(decodeURIComponent(params.filename));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const updates = {
      source: body?.source,
      importStatus: body?.importStatus,
      importError: body?.importError,
      importedAt: body?.importedAt,
      originalName: body?.originalName,
    };

    await updateImportFileMetadata(decodeURIComponent(params.filename), updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update file metadata' }, { status: 400 });
  }
}