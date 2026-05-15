import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getImportFileContent } from '@/lib/storage/import-files';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const file = await getImportFileContent(decodeURIComponent(params.filename));
    return new Response(file.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}