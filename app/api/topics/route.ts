import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';

export async function GET() {
  try {
    const sets = await storage.getQuestionSets();
    const allQuestions = [];
    
    for (const set of sets) {
      const fullSet = await storage.getQuestionSet(set.setId);
      if (fullSet) {
        allQuestions.push(...fullSet.questions);
      }
    }

    const topics = Array.from(new Set(allQuestions.map(q => q.topic))).sort();
    
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Get topics error:', error);
    return NextResponse.json({ error: 'Failed to get topics' }, { status: 500 });
  }
}
