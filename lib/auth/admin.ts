import { NextRequest } from 'next/server';

export type AdminAuthResult = {
  ok: boolean;
  status: number;
  error?: string;
};

function getConfiguredSecrets() {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || '';
  const adminKey = process.env.ADMIN_KEY?.trim() || '';
  return {
    adminPassword,
    adminKey,
    configured: Boolean(adminPassword || adminKey),
  };
}

export function isAdminAuthConfigured(): boolean {
  return getConfiguredSecrets().configured;
}

export function requireAdminAuth(req: NextRequest): AdminAuthResult {
  const { adminPassword, adminKey, configured } = getConfiguredSecrets();

  if (!configured) {
    return {
      ok: false,
      status: 503,
      error: 'Admin authentication is not configured',
    };
  }

  const provided =
    req.headers.get('x-admin-password') ||
    req.headers.get('x-admin-key') ||
    req.nextUrl.searchParams.get('adminPassword') ||
    req.nextUrl.searchParams.get('adminKey') ||
    '';

  if (!provided) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized',
    };
  }

  if ((adminPassword && provided === adminPassword) || (adminKey && provided === adminKey)) {
    return {
      ok: true,
      status: 200,
    };
  }

  return {
    ok: false,
    status: 401,
    error: 'Unauthorized',
  };
}