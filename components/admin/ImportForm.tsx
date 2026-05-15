'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface ImportFormProps {
  onSuccess?: () => void;
  adminPassword: string;
}

export function ImportForm({ onSuccess, adminPassword }: ImportFormProps) {
  interface StoredImportFile {
    name: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    originalName?: string;
    source?: 'file-upload' | 'json-paste';
    importStatus?: 'saved' | 'imported' | 'failed';
    importError?: string;
    importedAt?: string;
  }

  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [files, setFiles] = useState<File[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaVersionLabel, setMetaVersionLabel] = useState(`v${new Date().toISOString().split('T')[0]}`);
  const [mergeByMeta, setMergeByMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [storedFiles, setStoredFiles] = useState<StoredImportFile[]>([]);
  const [storedFilesLoading, setStoredFilesLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [selectedFileLoading, setSelectedFileLoading] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [fileSortBy, setFileSortBy] = useState<'updatedAt' | 'name' | 'size'>('updatedAt');
  const [fileSortOrder, setFileSortOrder] = useState<'asc' | 'desc'>('desc');

  const parseApiResponse = async (response: Response) => {
    const raw = await response.text();
    try {
      return { data: raw ? JSON.parse(raw) : null, raw };
    } catch {
      return { data: null, raw };
    }
  };

  const authHeaders = {
    'x-admin-password': adminPassword,
    'x-admin-key': adminPassword,
  };

  const fetchStoredFiles = async () => {
    if (!adminPassword) return;
    setStoredFilesLoading(true);
    try {
      const params = new URLSearchParams({
        search: fileSearch,
        sortBy: fileSortBy,
        sortOrder: fileSortOrder,
      });

      const response = await fetch(`/api/admin/import-files?${params.toString()}`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || '저장된 파일 목록 조회 실패');
      }
      setStoredFiles(Array.isArray(payload.files) ? payload.files : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장된 파일 목록 조회 실패');
    } finally {
      setStoredFilesLoading(false);
    }
  };

  const saveImportSourceFile = async (content: string, filename: string) => {
    const response = await fetch('/api/admin/import-files', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        content,
        source: mode === 'file' ? 'file-upload' : 'json-paste',
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'JSON 원본 파일 저장 실패');
    }

    return String(payload?.file?.name || '');
  };

  const updateStoredFileStatus = async (
    storedName: string,
    status: 'imported' | 'failed',
    importError?: string
  ) => {
    if (!storedName) return;

    await fetch(`/api/admin/import-files/${encodeURIComponent(storedName)}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        importStatus: status,
        importError: importError || null,
        importedAt: status === 'imported' ? new Date().toISOString() : null,
      }),
    });
  };

  const readStoredFile = async (filename: string) => {
    setSelectedFileLoading(true);
    try {
      const response = await fetch(`/api/admin/import-files/${encodeURIComponent(filename)}`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || '파일 읽기 실패');
      }
      const content = String(payload?.file?.content || '');
      setSelectedFileName(filename);
      setSelectedFileContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 읽기 실패');
    } finally {
      setSelectedFileLoading(false);
    }
  };

  const downloadStoredFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/import-files/${encodeURIComponent(filename)}/download`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || '파일 다운로드 실패');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 다운로드 실패');
    }
  };

  const deleteStoredFile = async (filename: string) => {
    if (!confirm(`파일을 삭제하시겠습니까?\n${filename}`)) return;

    try {
      const response = await fetch(`/api/admin/import-files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || '파일 삭제 실패');
      }

      if (selectedFileName === filename) {
        setSelectedFileName(null);
        setSelectedFileContent('');
      }

      await fetchStoredFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 삭제 실패');
    }
  };

  useEffect(() => {
    if (!adminPassword) return;
    void fetchStoredFiles();
  }, [adminPassword, fileSearch, fileSortBy, fileSortOrder]);

  const buildApiErrorMessage = (response: Response, payload: any, raw: string) => {
    if (payload?.error) {
      return payload.error as string;
    }

    // If upstream/proxy returns an HTML error page, show concise hint.
    if (raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html')) {
      return `서버가 JSON이 아닌 HTML 오류 페이지를 반환했습니다 (HTTP ${response.status}). 서버 로그를 확인해주세요.`;
    }

    if (raw.trim()) {
      return `HTTP ${response.status}: ${raw.slice(0, 180)}`;
    }

    return `HTTP ${response.status}: Import failed`;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const invalidFiles = selectedFiles.filter((f) => !f.name.toLowerCase().endsWith('.json'));
      if (invalidFiles.length > 0) {
        setError('모든 파일은 JSON 형식이어야 합니다');
        return;
      }
      setFiles(selectedFiles);
      setError(null);
      setSuccess(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'file' && files.length === 0) {
      setError('파일을 선택해주세요');
      return;
    }

    if (mode === 'paste' && !jsonInput.trim()) {
      setError('JSON을 붙여넣어 주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ current: 0, total: mode === 'file' ? files.length : 1 });

    const results: { success: boolean; filename: string; title?: string; error?: string }[] = [];
    let savedCount = 0;

    if (mode === 'file') {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });
        let storedName = '';

        try {
          const text = await file.text();
          storedName = await saveImportSourceFile(text, file.name || `upload-${i + 1}.json`);
          savedCount += 1;
          const data = JSON.parse(text);

          const response = await fetch(`/api/sets/import?mergeByMeta=${mergeByMeta}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify(data),
          });

          const { data: responseData, raw } = await parseApiResponse(response);

          if (!response.ok) {
            const message = buildApiErrorMessage(response, responseData, raw);
            await updateStoredFileStatus(storedName, 'failed', message);
            results.push({
              success: false,
              filename: file.name,
              error: message,
            });
          } else {
            if (!responseData || !responseData.set) {
              throw new Error(`서버 응답 파싱 실패 (HTTP ${response.status})`);
            }
            await updateStoredFileStatus(storedName, 'imported');
            results.push({
              success: true,
              filename: file.name,
              title: responseData.set.title,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          try {
            if (!storedName) {
              const text = await file.text();
              storedName = await saveImportSourceFile(text, file.name || `upload-${i + 1}.json`);
              savedCount += 1;
            }
            await updateStoredFileStatus(storedName, 'failed', message);
          } catch {
            // Ignore secondary save failures and keep primary error.
          }
          results.push({
            success: false,
            filename: file.name,
            error: message,
          });
        }
      }
    } else {
      setProgress({ current: 1, total: 1 });
      let storedName = '';

      try {
        storedName = await saveImportSourceFile(jsonInput, `pasted-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        savedCount += 1;

        const parsed = JSON.parse(jsonInput);
        const hasMeta = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'setMeta' in parsed && 'questions' in parsed;

        const payload = Array.isArray(parsed) && metaTitle.trim()
          ? {
              setMeta: {
                title: metaTitle.trim(),
                description: metaDescription.trim(),
                versionLabel: metaVersionLabel.trim() || `v${new Date().toISOString().split('T')[0]}`,
              },
              questions: parsed,
            }
          : parsed;

        if (Array.isArray(parsed) && !metaTitle.trim() && !hasMeta) {
          throw new Error('질문 배열만 붙여넣을 때는 title을 입력해 주세요.');
        }

        const response = await fetch(`/api/sets/import?mergeByMeta=${mergeByMeta}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });

        const { data: responseData, raw } = await parseApiResponse(response);

        if (!response.ok) {
          const message = buildApiErrorMessage(response, responseData, raw);
          await updateStoredFileStatus(storedName, 'failed', message);
          results.push({
            success: false,
            filename: 'pasted-json',
            error: message,
          });
        } else {
          if (!responseData || !responseData.set) {
            throw new Error(`서버 응답 파싱 실패 (HTTP ${response.status})`);
          }
          await updateStoredFileStatus(storedName, 'imported');
          results.push({
            success: true,
            filename: 'pasted-json',
            title: responseData.set.title,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        try {
          if (!storedName) {
            storedName = await saveImportSourceFile(jsonInput, `pasted-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            savedCount += 1;
          }
          await updateStoredFileStatus(storedName, 'failed', message);
        } catch {
          // Ignore secondary save failures and keep primary error.
        }
        results.push({
          success: false,
          filename: 'pasted-json',
          error: message,
        });
      }
    }

    // Generate summary message
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      const successMsg = `${successCount}건 import 성공`;
      const titles = results.filter(r => r.success).map(r => r.title).join(', ');
      setSuccess(`${successMsg}: ${titles}${savedCount > 0 ? ` (원본 ${savedCount}건 저장)` : ''}`);
      setFiles([]);
      setJsonInput('');
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onSuccess?.();
    }

    if (failCount > 0) {
      const failedFiles = results.filter(r => !r.success);
      const errorMsg = failedFiles.map(f => `${f.filename}: ${f.error}`).join('\n');
      setError(`${failCount}건 실패:\n${errorMsg}${savedCount > 0 ? `\n(원본 ${savedCount}건은 저장됨)` : ''}`);
    }

    if (savedCount > 0) {
      await fetchStoredFiles();
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Question Set</CardTitle>
        <CardDescription>
          JSON 파일 업로드 또는 JSON 붙여넣기로 문제를 import할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'file' ? 'primary' : 'secondary'}
              onClick={() => setMode('file')}
            >
              파일 업로드
            </Button>
            <Button
              type="button"
              variant={mode === 'paste' ? 'primary' : 'secondary'}
              onClick={() => setMode('paste')}
            >
              JSON 붙여넣기
            </Button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={mergeByMeta}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMergeByMeta(e.target.checked)}
            />
            같은 title + description이면 기존 세트에 문제 추가
          </label>

          {mode === 'file' && (
          <div>
            <label
              htmlFor="file-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select JSON Files (여러 파일 선택 가능)
            </label>
            <input
              id="file-input"
              type="file"
              accept=".json"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  선택된 파일 {files.length}개:
                </p>
                {files.map((f, idx) => (
                  <p key={idx} className="text-sm text-gray-600">
                    {f.name} ({(f.size / 1024).toFixed(2)} KB)
                  </p>
                ))}
              </div>
            )}
          </div>
          )}

          {mode === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON 입력
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm font-mono"
                  placeholder='{"setMeta": {"title": "...", "description": "...", "versionLabel": "v2026-03-10"}, "questions": [...]}'
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    title (배열 JSON일 때 사용)
                  </label>
                  <input
                    value={metaTitle}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMetaTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="예: Integration Practice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    versionLabel
                  </label>
                  <input
                    value={metaVersionLabel}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMetaVersionLabel(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  description (배열 JSON일 때 사용)
                </label>
                <input
                  value={metaDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMetaDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="예: 이미지 포함 문제 모음"
                />
              </div>
            </div>
          )}

          {loading && progress.total > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Import 진행중...
                </span>
                <span className="text-sm text-blue-600">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={(mode === 'file' ? files.length === 0 : !jsonInput.trim()) || loading}
            variant="primary"
          >
            {loading ? `Importing... (${progress.current}/${progress.total})` : 'Import'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">
            Format Examples
          </h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p>
              <strong>Format A (권장):</strong> <code>{`{ setMeta: { title, description, versionLabel }, questions: [...] }`}</code>
            </p>
            <p>
              <strong>Format B:</strong> <code>{`[ { topic, stem, stemImageUrl?, choices, answer, ... } ]`}</code>
            </p>
            <p>
              이미지 위치는 문제(stem)와 보기(choices) 사이에 표시되며 필드명은 <code>stemImageUrl</code>, <code>stemImageAlt</code> 입니다.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-900 mb-3">
            저장된 JSON 원본 파일
          </h4>

          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <input
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="파일명 검색"
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <select
              value={fileSortBy}
              onChange={(e) => setFileSortBy(e.target.value as 'updatedAt' | 'name' | 'size')}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="updatedAt">수정일</option>
              <option value="name">이름</option>
              <option value="size">크기</option>
            </select>
            <select
              value={fileSortOrder}
              onChange={(e) => setFileSortOrder(e.target.value as 'asc' | 'desc')}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>

          {storedFilesLoading && <p className="text-sm text-gray-500">목록 로딩 중...</p>}

          {!storedFilesLoading && storedFiles.length === 0 && (
            <p className="text-sm text-gray-500">아직 저장된 파일이 없습니다.</p>
          )}

          {!storedFilesLoading && storedFiles.length > 0 && (
            <div className="space-y-2">
              {storedFiles.map((file) => (
                <div key={file.name} className="rounded border border-gray-200 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-gray-800 break-all">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB · {new Date(file.updatedAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        소스: {file.source === 'json-paste' ? '붙여넣기' : '파일업로드'} · 상태: {file.importStatus || 'saved'}
                      </p>
                      {file.importError && (
                        <p className="text-xs text-red-600 break-all">오류: {file.importError}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" type="button" onClick={() => void readStoredFile(file.name)}>
                        읽기
                      </Button>
                      <Button size="sm" variant="secondary" type="button" onClick={() => void downloadStoredFile(file.name)}>
                        다운로드
                      </Button>
                      <Button size="sm" variant="danger" type="button" onClick={() => void deleteStoredFile(file.name)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(selectedFileLoading || selectedFileName) && (
            <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-700">
                {selectedFileLoading ? '파일 읽는 중...' : `미리보기: ${selectedFileName}`}
              </p>
              {!selectedFileLoading && (
                <textarea
                  value={selectedFileContent}
                  readOnly
                  rows={10}
                  className="w-full rounded border border-gray-300 bg-white p-2 text-xs font-mono"
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
