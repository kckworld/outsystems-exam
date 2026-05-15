import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ authenticated: false, error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ authenticated: true });
}