'use client';

import { useState, useEffect } from 'react';
import { ImportForm } from '@/components/admin/ImportForm';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/format';

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
    if (!confirm('Are you sure you want to delete this set?')) return;

    try {
      const response = await fetch(`/api/sets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete set');
      await fetchSets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleClone = async (id: string) => {
    try {
      const response = await fetch(`/api/sets/${id}/clone`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to clone set');
      await fetchSets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clone');
    }
  };

  const handleExport = async (id: string) => {
    try {
      const response = await fetch(`/api/sets/${id}/export`);
      if (!response.ok) throw new Error('Failed to export set');
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
      alert(err instanceof Error ? err.message : 'Failed to export');
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
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data.questions);
      setExpandedSetId(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load questions');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Import Form */}
        <div>
          <ImportForm onSuccess={fetchSets} />
        </div>

        {/* Question Sets List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Question Sets</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-gray-500">Loading...</p>}
              {error && <p className="text-red-600">{error}</p>}
              
              {!loading && !error && sets.length === 0 && (
                <p className="text-gray-500">No question sets yet. Import one to get started.</p>
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
                            Locked
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {set.questionCount} questions
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        Created: {formatDate(set.createdAt)}
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
                          Clone
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleExport(set.setId)}
                        >
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(set.setId)}
                        >
                          Delete
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
