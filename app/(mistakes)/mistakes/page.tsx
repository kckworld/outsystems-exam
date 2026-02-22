'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MistakeSnapshot {
  snapshotId: string;
  baseScope: 'set' | 'train';
  baseScopeId: string;
  createdAt: string;
  title: string;
  wrongQuestionIds: string[];
  correctStreak: { [questionId: string]: number };
  isArchived: boolean;
  deletedAt?: string;
}

export default function MistakesPage() {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<MistakeSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchSnapshots();
  }, [showArchived]);

  const fetchSnapshots = async () => {
    try {
      const response = await fetch(`/api/mistakes?includeArchived=${showArchived}`);
      if (!response.ok) throw new Error('Failed to fetch snapshots');
      const data = await response.json();
      setSnapshots(data.snapshots);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = (snapshotId: string) => {
    router.push(`/mistakes/${snapshotId}`);
  };

  const handleDelete = async (snapshotId: string) => {
    if (!confirm('이 오답노트를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/mistakes/${snapshotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete snapshot');
      
      alert('삭제되었습니다.');
      fetchSnapshots();
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeSnapshots = snapshots.filter((s) => !s.isArchived && !s.deletedAt);
  const archivedSnapshots = snapshots.filter((s) => s.isArchived || s.deletedAt);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">오답노트</h1>
        <p className="text-gray-600">
          틀린 문제들을 다시 풀어보세요. 2번 연속 정답 시 자동으로 마스터 처리됩니다.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>활성 오답노트 ({activeSnapshots.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">로딩 중...</p>}
            
            {!loading && activeSnapshots.length === 0 && (
              <p className="text-gray-500 mb-4">
                아직 저장된 오답노트가 없습니다. 연습 후 틀린 문제를 오답노트에 저장해보세요.
              </p>
            )}

            {!loading && activeSnapshots.length > 0 && (
              <div className="space-y-3">
                {activeSnapshots.map((snapshot) => {
                  const remainingQuestions = snapshot.wrongQuestionIds.filter(
                    (id) => (snapshot.correctStreak[id] || 0) < 2
                  ).length;

                  return (
                    <div
                      key={snapshot.snapshotId}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{snapshot.title}</h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(snapshot.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                            {remainingQuestions}문제 남음
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        전체 {snapshot.wrongQuestionIds.length}문제 중 {snapshot.wrongQuestionIds.length - remainingQuestions}문제 마스터
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStartPractice(snapshot.snapshotId)}
                        >
                          다시 풀기
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(snapshot.snapshotId)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>보관된 오답노트 ({archivedSnapshots.length}개)</CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? '숨기기' : '보기'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showArchived && archivedSnapshots.length === 0 && (
              <p className="text-gray-500">
                보관된 오답노트가 없습니다.
              </p>
            )}

            {showArchived && archivedSnapshots.length > 0 && (
              <div className="space-y-3">
                {archivedSnapshots.map((snapshot) => (
                  <div
                    key={snapshot.snapshotId}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-700">{snapshot.title}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(snapshot.createdAt)}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm">
                        {snapshot.deletedAt ? '삭제됨' : '완료'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      전체 {snapshot.wrongQuestionIds.length}문제
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
