'use client';

import { useState, useEffect } from 'react';
import { ImportForm } from '@/components/admin/ImportForm';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/format';
import { toDisplayImageUrl } from '@/lib/utils/image';

interface QuestionSet {
  setId: string;
  title: string;
  description: string;
  questionCount: number;
  isLocked: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const storedPassword = localStorage.getItem('adminPassword') || localStorage.getItem('adminKey');
    if (storedPassword) {
      setAdminPassword(storedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setAuthError('관리자 비밀번호를 입력해주세요');
      return;
    }
    // Store in localStorage
    localStorage.setItem('adminPassword', adminPassword);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPassword');
    localStorage.removeItem('adminKey'); // Backward compatibility cleanup
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  const fetchSets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sets');
      if (!response.ok) throw new Error('Failed to fetch sets');
      const data = await response.json();
      setSets(data.sets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 세트를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/sets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('세트 삭제 실패');
      await fetchSets();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const handleClone = async (id: string) => {
    try {
      const response = await fetch(`/api/sets/${id}/clone`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('세트 복제 실패');
      await fetchSets();
    } catch (err) {
      alert(err instanceof Error ? err.message : '복제 실패');
    }
  };

  const handleExport = async (id: string) => {
    try {
      const response = await fetch(`/api/sets/${id}/export`);
      if (!response.ok) throw new Error('세트 내보내기 실패');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.setMeta.name.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : '내보내기 실패');
    }
  };

  const handleViewQuestions = async (id: string) => {
    if (expandedSetId === id) {
      setExpandedSetId(null);
      setQuestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/sets/${id}`);
      if (!response.ok) throw new Error('문제 가져오기 실패');
      const data = await response.json();
      setQuestions(data.questions);
      setExpandedSetId(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '문제 로드 실패');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>관리자 로그인</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="adminKey" className="block text-sm font-medium mb-2">
                    관리자 비밀번호
                  </label>
                  <input
                    type="password"
                    id="adminKey"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="관리자 비밀번호를 입력하세요"
                  />
                  {authError && (
                    <p className="text-red-600 text-sm mt-1">{authError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  로그인
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">관리자 패널</h1>
        <Button variant="secondary" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Import Form */}
        <div>
          <ImportForm onSuccess={fetchSets} adminPassword={adminPassword} />
        </div>

        {/* Question Sets List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>문제 세트</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-gray-500">로딩 중...</p>}
              {error && <p className="text-red-600">{error}</p>}
              
              {!loading && !error && sets.length === 0 && (
                <p className="text-gray-500">아직 문제 세트가 없습니다. 시작하려면 하나를 가져오세요.</p>
              )}

              {!loading && !error && sets.length > 0 && (
                <div className="space-y-4">
                  {sets.map((set) => (
                    <div
                      key={set.setId}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{set.title}</h3>
                          <p className="text-sm text-gray-600">{set.description}</p>
                        </div>
                        {set.isLocked && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            잠김
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {set.questionCount}개 문제
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        생성일: {formatDate(set.createdAt)}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewQuestions(set.setId)}
                        >
                          {expandedSetId === set.setId ? '문제 숨기기' : '문제 보기'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleClone(set.setId)}
                        >
                          복제
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleExport(set.setId)}
                        >
                          내보내기
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(set.setId)}
                        >
                          삭제
                        </Button>
                      </div>

                      {expandedSetId === set.setId && questions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-semibold mb-3">문제 목록 ({questions.length}개)</h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {questions.map((q, idx) => (
                              <div key={q.id || idx} className="p-3 bg-gray-50 rounded text-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium">#{idx + 1}</span>
                                  <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                      {q.topic}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                      난이도 {q.difficulty}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-800 mb-2">{q.stem}</p>
                                {q.stemImageUrl && (
                                  <div className="mb-2 overflow-hidden rounded border border-gray-200 bg-white">
                                    <img
                                      src={toDisplayImageUrl(q.stemImageUrl)}
                                      alt={q.stemImageAlt || 'Question image'}
                                      className="max-h-60 w-full object-contain"
                                    />
                                  </div>
                                )}
                                <div className="space-y-1 ml-4">
                                  {q.choices.map((choice: string, i: number) => (
                                    <p key={i} className={`text-xs ${
                                      ['A', 'B', 'C', 'D'][i] === q.answer
                                        ? 'text-green-700 font-medium'
                                        : 'text-gray-600'
                                    }`}>
                                      {['A', 'B', 'C', 'D'][i]}. {choice}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  💡 {q.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
