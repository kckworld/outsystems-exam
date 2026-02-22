'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface ImportFormProps {
  onSuccess?: () => void;
  adminKey: string;
}

export function ImportForm({ onSuccess, adminKey }: ImportFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const invalidFiles = selectedFiles.filter(f => f.type !== 'application/json');
      if (invalidFiles.length > 0) {
        setError('모든 파일은 JSON 형식이어야 합니다');
        return;
      }
      setFiles(selectedFiles);
      setError(null);
      setSuccess(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('파일을 선택해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ current: 0, total: files.length });

    const results: { success: boolean; filename: string; title?: string; error?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const response = await fetch('/api/sets/import', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-key': adminKey,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          results.push({
            success: false,
            filename: file.name,
            error: errorData.error || 'Import failed',
          });
        } else {
          const result = await response.json();
          results.push({
            success: true,
            filename: file.name,
            title: result.set.title,
          });
        }
      } catch (err) {
        results.push({
          success: false,
          filename: file.name,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Generate summary message
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      const successMsg = `${successCount}개 파일 import 성공`;
      const titles = results.filter(r => r.success).map(r => r.title).join(', ');
      setSuccess(`${successMsg}: ${titles}`);
      setFiles([]);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onSuccess?.();
    }

    if (failCount > 0) {
      const failedFiles = results.filter(r => !r.success);
      const errorMsg = failedFiles.map(f => `${f.filename}: ${f.error}`).join('\n');
      setError(`${failCount}개 파일 실패:\n${errorMsg}`);
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Question Set</CardTitle>
        <CardDescription>
          Upload a JSON file containing questions. Supports Format A (with setMeta) or Format B (questions only).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={files.length === 0 || loading}
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
              <strong>Format A (with metadata):</strong> Include setMeta object with name, description, tags
            </p>
            <p>
              <strong>Format B (questions only):</strong> Array of questions, metadata will be collected via UI
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
