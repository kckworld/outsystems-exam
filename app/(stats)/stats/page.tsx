'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function StatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">통계 대시보드</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>전체 성과</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">곧 제공 예정...</p>
            <p className="text-sm text-gray-400 mt-2">
              모든 문제 세트에 대한 전체 진행 상황을 추적하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>토픽별 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">곧 제공 예정...</p>
            <p className="text-sm text-gray-400 mt-2">
              토픽별 성과를 확인하여 취약한 영역을 파악하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>70% 목표 추적기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">곧 제공 예정...</p>
            <p className="text-sm text-gray-400 mt-2">
              70% 합격 기준을 향한 진행 상황을 확인하세요.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              이 기능은 최근 연습 세션과 점수를 보여줍니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
