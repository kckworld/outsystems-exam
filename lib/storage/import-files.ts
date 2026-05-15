import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import path from 'path';

export type ImportSource = 'file-upload' | 'json-paste';
export type ImportStatus = 'saved' | 'imported' | 'failed';

export type StoredImportFile = {
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  originalName?: string;
  source?: ImportSource;
  importStatus?: ImportStatus;
  importError?: string;
  importedAt?: string;
};

type StoredImportMetadata = {
  originalName?: string;
  source?: ImportSource;
  importStatus?: ImportStatus;
  importError?: string;
  importedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ImportMetadataIndex = Record<string, StoredImportMetadata>;

const IMPORTS_DIR = path.join(process.cwd(), 'data', 'imports');
const IMPORTS_META_FILE = path.join(IMPORTS_DIR, '_meta.json');

function sanitizeFilename(input: string): string {
  const base = input.replace(/[^a-zA-Z0-9._-]/g, '_');
  const trimmed = base.replace(/^_+|_+$/g, '');
  return trimmed || 'import';
}

function ensureJsonExtension(name: string): string {
  return name.toLowerCase().endsWith('.json') ? name : `${name}.json`;
}

function buildStoredFilename(originalName: string): string {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  const rand = Math.random().toString(36).slice(2, 8);
  const safe = sanitizeFilename(ensureJsonExtension(originalName));
  return `${stamp}-${rand}-${safe}`;
}

function resolveSafeFilePath(filename: string): string {
  const safe = sanitizeFilename(filename);
  const fullPath = path.resolve(IMPORTS_DIR, safe);
  const rootPath = path.resolve(IMPORTS_DIR);

  if (!fullPath.startsWith(rootPath)) {
    throw new Error('Invalid file path');
  }

  return fullPath;
}

export async function ensureImportsDir(): Promise<void> {
  await mkdir(IMPORTS_DIR, { recursive: true });
}

async function readMetadataIndex(): Promise<ImportMetadataIndex> {
  await ensureImportsDir();
  try {
    const raw = await readFile(IMPORTS_META_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ImportMetadataIndex;
  } catch {
    return {};
  }
}

async function writeMetadataIndex(index: ImportMetadataIndex): Promise<void> {
  await ensureImportsDir();
  await writeFile(IMPORTS_META_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

export async function saveImportFile(
  content: string,
  originalName: string,
  metadata?: Omit<StoredImportMetadata, 'createdAt' | 'updatedAt'>
): Promise<StoredImportFile> {
  await ensureImportsDir();
  const name = buildStoredFilename(originalName);
  const filePath = resolveSafeFilePath(name);
  await writeFile(filePath, content, 'utf-8');
  const [fileStat, index] = await Promise.all([stat(filePath), readMetadataIndex()]);

  const now = new Date().toISOString();
  index[name] = {
    originalName: metadata?.originalName || originalName,
    source: metadata?.source,
    importStatus: metadata?.importStatus || 'saved',
    importError: metadata?.importError,
    importedAt: metadata?.importedAt,
    createdAt: now,
    updatedAt: now,
  };
  await writeMetadataIndex(index);

  return {
    name,
    size: fileStat.size,
    createdAt: fileStat.birthtime.toISOString(),
    updatedAt: fileStat.mtime.toISOString(),
    ...index[name],
  };
}

export async function updateImportFileMetadata(
  filename: string,
  updates: Partial<Pick<StoredImportMetadata, 'source' | 'importStatus' | 'importError' | 'importedAt' | 'originalName'>>
): Promise<void> {
  const safeName = sanitizeFilename(filename);
  const filePath = resolveSafeFilePath(safeName);
  await stat(filePath);

  const index = await readMetadataIndex();
  const now = new Date().toISOString();
  const prev = index[safeName] || {};
  index[safeName] = {
    ...prev,
    ...updates,
    updatedAt: now,
  };

  if (updates.importStatus === 'imported' && !index[safeName].importedAt) {
    index[safeName].importedAt = now;
  }

  await writeMetadataIndex(index);
}

export async function listImportFiles(): Promise<StoredImportFile[]> {
  await ensureImportsDir();
  const entries = await readdir(IMPORTS_DIR, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name !== path.basename(IMPORTS_META_FILE));
  const index = await readMetadataIndex();

  const results = await Promise.all(
    files.map(async (file) => {
      const filePath = resolveSafeFilePath(file.name);
      const fileStat = await stat(filePath);
      const meta = index[file.name] || {};
      return {
        name: file.name,
        size: fileStat.size,
        createdAt: fileStat.birthtime.toISOString(),
        updatedAt: fileStat.mtime.toISOString(),
        ...meta,
      };
    })
  );

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getImportFileContent(filename: string): Promise<{ name: string; content: string; size: number; updatedAt: string }> {
  const filePath = resolveSafeFilePath(filename);
  const [content, fileStat, index] = await Promise.all([readFile(filePath, 'utf-8'), stat(filePath), readMetadataIndex()]);
  const name = path.basename(filePath);
  const meta = index[name] || {};
  return {
    name,
    content,
    size: fileStat.size,
    updatedAt: fileStat.mtime.toISOString(),
    ...meta,
  };
}

export async function deleteImportFile(filename: string): Promise<void> {
  const filePath = resolveSafeFilePath(filename);
  await unlink(filePath);

  const safeName = path.basename(filePath);
  const index = await readMetadataIndex();
  if (index[safeName]) {
    delete index[safeName];
    await writeMetadataIndex(index);
  }
}