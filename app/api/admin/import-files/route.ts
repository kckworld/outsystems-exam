import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { ImportSource, listImportFiles, saveImportFile } from '@/lib/storage/import-files';

export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const files = await listImportFiles();
    const search = (req.nextUrl.searchParams.get('search') || '').trim().toLowerCase();
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = req.nextUrl.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const filtered = search
      ? files.filter((file) =>
          file.name.toLowerCase().includes(search) ||
          (file.originalName || '').toLowerCase().includes(search)
        )
      : files;

    const sorted = [...filtered].sort((a, b) => {
      let compare = 0;
      if (sortBy === 'name') {
        compare = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        compare = a.size - b.size;
      } else {
        compare = a.updatedAt.localeCompare(b.updatedAt);
      }
      return sortOrder === 'asc' ? compare : -compare;
    });

    return NextResponse.json({ files: sorted });
  } catch (error) {
    console.error('Error listing import files:', error);
    return NextResponse.json({ error: 'Failed to list import files' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const source = String(formData.get('source') || 'file-upload') as ImportSource;

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 });
      }

      const text = await file.text();
      const saved = await saveImportFile(text, file.name || 'uploaded.json', {
        originalName: file.name || 'uploaded.json',
        source,
        importStatus: 'saved',
      });
      return NextResponse.json({ success: true, file: saved }, { status: 201 });
    }

    const body = await req.json();
    const filename = String(body?.filename || 'pasted.json');
    const content = String(body?.content || '');
    const source = String(body?.source || 'json-paste') as ImportSource;

    if (!content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const saved = await saveImportFile(content, filename, {
      originalName: filename,
      source,
      importStatus: 'saved',
    });
    return NextResponse.json({ success: true, file: saved }, { status: 201 });
  } catch (error) {
    console.error('Error saving import file:', error);
    return NextResponse.json({ error: 'Failed to save import file' }, { status: 500 });
  }
}