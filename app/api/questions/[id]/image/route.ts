import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
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

function getAllowedExtension(mime: string): string | null {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!requireAdminKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const alt = String(formData.get('alt') || '업로드 이미지');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    const ext = getAllowedExtension(file.type);
    if (!ext) {
      return NextResponse.json({ error: 'Only png/jpg/webp/gif images are supported' }, { status: 415 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image is too large (max 8MB)' }, { status: 413 });
    }

    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${params.id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(filePath, bytes);

    const imageUrl = `/api/images/uploaded/${filename}`;
    await storage.updateQuestionImage(params.id, imageUrl, alt);

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading question image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
