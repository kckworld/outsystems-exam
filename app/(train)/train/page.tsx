'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TrainPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([1, 2, 3]);
  const [questionCount, setQuestionCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics');
        if (!response.ok) throw new Error('토픽을 가져오는데 실패했습니다');
        const data = await response.json();
        setTopics(data.topics);
        setSelectedTopics(data.topics); // Select all by default
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('토픽을 불러오는데 실패했습니다');
      }
    };

    fetchTopics();
  }, []);

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleDifficultyToggle = (difficulty: number) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleStartTraining = async () => {
    if (selectedTopics.length === 0) {
      alert('최소 하나의 토픽을 선택해주세요');
      return;
    }

    if (selectedDifficulties.length === 0) {
      alert('최소 하나의 난이도를 선택해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: selectedTopics,
          difficulties: selectedDifficulties,
          questionCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '학습 세션 생성에 실패했습니다');
      }

      const data = await response.json();
      
      // Store session data in sessionStorage
      sessionStorage.setItem('trainSession', JSON.stringify(data));
      
      // Navigate to training session
      router.push(`/train/${data.trainSessionId}`);
    } catch (err) {
      console.error('Error starting training:', err);
      setError(err instanceof Error ? err.message : '학습을 시작하는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">맞춤 학습</h1>
        <p className="text-gray-600">
          토픽과 난이도를 선택하여 맞춤형 학습 세션을 만드세요.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>학습 세션 설정</CardTitle>
            <CardDescription>
              원하는 토픽과 난이도를 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제 수
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  토픽 선택 ({selectedTopics.length}/{topics.length})
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {topics.length === 0 ? (
                    <p className="text-sm text-gray-500">로딩 중...</p>
                  ) : (
                    <>
                      <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTopics.length === topics.length}
                          onChange={() => {
                            if (selectedTopics.length === topics.length) {
                              setSelectedTopics([]);
                            } else {
                              setSelectedTopics(topics);
                            }
                          }}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="font-medium">전체 선택</span>
                      </label>
                      <hr />
                      {topics.map((topic) => (
                        <label
                          key={topic}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(topic)}
                            onChange={() => handleTopicToggle(topic)}
                            className="mr-3 w-4 h-4"
                          />
                          <span>{topic}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  난이도
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDifficulties.includes(1)}
                      onChange={() => handleDifficultyToggle(1)}
                      className="mr-2 w-4 h-4"
                    />
                    쉬움
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDifficulties.includes(2)}
                      onChange={() => handleDifficultyToggle(2)}
                      className="mr-2 w-4 h-4"
                    />
                    보통
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDifficulties.includes(3)}
                      onChange={() => handleDifficultyToggle(3)}
                      className="mr-2 w-4 h-4"
                    />
                    어려움
                  </label>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleStartTraining}
                disabled={loading || selectedTopics.length === 0 || selectedDifficulties.length === 0}
              >
                {loading ? '생성 중...' : '학습 시작'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
