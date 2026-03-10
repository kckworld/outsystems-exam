import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import path from 'path';
import { buildImageFetchCandidates, normalizeExternalImageUrl } from '@/lib/utils/image';

const CACHE_DIR = path.join(process.cwd(), 'data', 'image-cache');
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type CachedMeta = {
  filePath: string;
  contentType: string;
};

function getSafeExt(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('svg')) return 'svg';
  return 'bin';
}

function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

async function findExistingCache(baseName: string): Promise<CachedMeta | null> {
  const exts = ['png', 'jpg', 'webp', 'gif', 'svg', 'bin'];
  for (const ext of exts) {
    const filePath = path.join(CACHE_DIR, `${baseName}.${ext}`);
    try {
      const fileStat = await stat(filePath);
      const isFresh = Date.now() - fileStat.mtimeMs <= CACHE_TTL_MS;
      if (!isFresh) continue;
      const contentType =
        ext === 'png'
          ? 'image/png'
          : ext === 'jpg'
          ? 'image/jpeg'
          : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
          ? 'image/gif'
          : ext === 'svg'
          ? 'image/svg+xml'
          : 'application/octet-stream';
      return { filePath, contentType };
    } catch {
      // Ignore missing cache entries.
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const imageUrl = req.nextUrl.searchParams.get('url');
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
    }

    const normalizedUrl = normalizeExternalImageUrl(imageUrl);
    const candidates = buildImageFetchCandidates(imageUrl);

    let parsed: URL;
    try {
      parsed = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
    }

    await mkdir(CACHE_DIR, { recursive: true });
    const key = hashUrl(parsed.toString());
    const existing = await findExistingCache(key);

    if (existing) {
      const bytes = await readFile(existing.filePath);
      return new NextResponse(new Uint8Array(bytes), {
        status: 200,
        headers: {
          'Content-Type': existing.contentType,
          'Cache-Control': 'public, max-age=604800',
        },
      });
    }

    let lastStatus = 0;
    for (const candidate of candidates) {
      const upstream = await fetch(candidate, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OutSystemsExamBot/1.0)',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        cache: 'no-store',
      });

      lastStatus = upstream.status;
      if (!upstream.ok) {
        continue;
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      if (!contentType.startsWith('image/')) {
        continue;
      }

      const arrayBuffer = await upstream.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const ext = getSafeExt(contentType);
      const filePath = path.join(CACHE_DIR, `${key}.${ext}`);
      await writeFile(filePath, bytes);

      return new NextResponse(bytes, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800',
        },
      });
    }

    const status = lastStatus > 0 ? 502 : 415;
    const message =
      lastStatus > 0
        ? `Failed to fetch image from source (${lastStatus})`
        : 'URL did not return an image';
    return NextResponse.json({ error: message }, { status });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
