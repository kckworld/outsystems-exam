'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function StatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Statistics Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              Track your overall progress across all question sets.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              See your performance by topic to identify weak areas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>70% Goal Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              Monitor your progress toward the 70% passing threshold.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              This feature will show your recent practice sessions and scores.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
