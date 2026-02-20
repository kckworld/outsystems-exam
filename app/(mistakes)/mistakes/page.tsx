'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function MistakesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mistake Notebook</h1>
        <p className="text-gray-600">
          Review questions you got wrong. Practice them until you answer correctly twice in a row.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Mistakes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              No mistakes recorded yet. Wrong answers from practice sessions will appear here.
            </p>
            <p className="text-sm text-gray-400">
              Mistakes are automatically archived after answering correctly twice in a row.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archived Mistakes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Questions you have mastered will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
