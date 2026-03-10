function extractGoogleDriveFileId(url: URL): string | undefined {
  if (url.hostname !== 'drive.google.com') return undefined;

  const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  const idParam = url.searchParams.get('id');
  if (idParam) return idParam;

  return undefined;
}

export function normalizeExternalImageUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const driveId = extractGoogleDriveFileId(parsed);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  }

  return parsed.toString();
}

export function toDisplayImageUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  if (rawUrl.startsWith('/')) return rawUrl;

  const normalized = normalizeExternalImageUrl(rawUrl);
  return `/api/images/proxy?url=${encodeURIComponent(normalized)}`;
}
