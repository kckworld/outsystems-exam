'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/format';

interface QuestionSet {
  setId: string;
  title: string;
  description: string;
  questionCount: number;
  createdAt: string;
}

export default function PlayPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch('/api/sets');
        if (!response.ok) throw new Error('문제 세트를 가져오는데 실패했습니다');
        const data = await response.json();
        setSets(data.sets);
      } catch (error) {
        console.error('Error fetching sets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  const filteredSets = sets.filter(
    (set) =>
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">문제 세트를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">연습 모드</h1>
        <p className="text-gray-600">
          문제 세트를 선택하여 연습을 시작하세요. 진행 상황은 자동으로 저장됩니다.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="이름, 설명 또는 태그로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sets Grid */}
      {filteredSets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? '검색 결과가 없습니다.'
                : '사용 가능한 문제 세트가 없습니다. 관리자 패널에서 문제를 가져오세요.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => (
            <Card key={set.setId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{set.title}</CardTitle>
                <CardDescription>{set.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {set.questionCount}개 문제
                </p>

                <Link href={`/play/${set.setId}`}>
                  <Button variant="primary" className="w-full">
                    연습 시작
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
