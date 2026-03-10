'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/QuestionCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Question } from '@/lib/schema';
import { useQuestionNavigation } from '@/lib/utils/keyboard';
import { calculateSessionScore } from '@/lib/scoring';
import { formatScore, getScoreColor } from '@/lib/utils/format';

interface MistakeSnapshot {
  snapshotId: string;
  baseScope: 'set' | 'train';
  baseScopeId: string;
  createdAt: string;
  title: string;
  wrongQuestionIds: string[];
  correctStreak: { [questionId: string]: number };
  isArchived: boolean;
}

export default function MistakePracticePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<MistakeSnapshot | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [selectedChoice, setSelectedChoice] = useState<number | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch snapshot
        const snapshotRes = await fetch(`/api/mistakes/${params.id}`);
        if (!snapshotRes.ok) throw new Error('Snapshot not found');
        const snapshotData = await snapshotRes.json();
        setSnapshot(snapshotData.snapshot);

        // Fetch questions
        const questionIds = snapshotData.snapshot.wrongQuestionIds;
        const questionsRes = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds }),
        });
        if (!questionsRes.ok) throw new Error('Questions not found');
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load mistake snapshot');
        router.push('/mistakes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  useEffect(() => {
    if (isComplete && !updatingProgress && snapshot) {
      const updateProgress = async () => {
        setUpdatingProgress(true);
        try {
          const answersObj: { [key: string]: boolean } = {};
          questions.forEach((q: Question) => {
            if (!q.id) return;
            const userAnswer = answers.get(q.id);
            const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
            answersObj[q.id] = userAnswer !== undefined && userAnswer === correctAnswerIndex;
          });

          await fetch(`/api/mistakes/${params.id}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: answersObj }),
          });
        } catch (error) {
          console.error('Error updating progress:', error);
        } finally {
          setUpdatingProgress(false);
        }
      };

      updateProgress();
    }
  }, [isComplete, updatingProgress, snapshot, questions, answers, params.id]);

  const currentQuestion = questions[currentIndex];

  const handleSelectChoice = (choiceIndex: number) => {
    if (isSubmitted) return;
    setSelectedChoice(choiceIndex);
  };

  const handleSubmit = () => {
    if (selectedChoice === undefined) return;
    setIsSubmitted(true);
    setShowAnswer(true);

    const newAnswers = new Map(answers);
    if (currentQuestion.id) {
      newAnswers.set(currentQuestion.id, selectedChoice);
    }
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedChoice(undefined);
      setIsSubmitted(false);
      setShowAnswer(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleNavigate = (index: number) => {
    setCurrentIndex(index);
    const questionId = questions[index].id;
    if (questionId) {
      setSelectedChoice(answers.get(questionId));
      setIsSubmitted(answers.has(questionId));
      setShowAnswer(answers.has(questionId));
    }
  };

  const handleRestart = () => {
    if (confirm('처음부터 다시 시작하시겠습니까?')) {
      setCurrentIndex(0);
      setAnswers(new Map());
      setSelectedChoice(undefined);
      setIsSubmitted(false);
      setShowAnswer(false);
      setIsComplete(false);
    }
  };

  const handleSaveExplanation = async (questionId: string, explanation: string) => {
    const response = await fetch(`/api/questions/${questionId}/explanation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explanation }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || '해설 저장 실패');
    }
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, explanation } : q))
    );
  };

  useQuestionNavigation(
    currentIndex,
    questions.length,
    handleNavigate,
    (choiceIndex) => {
      if (!isSubmitted && choiceIndex < currentQuestion.choices.length) {
        handleSelectChoice(choiceIndex);
        setTimeout(handleSubmit, 100);
      }
    }
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isComplete && snapshot) {
    const score = calculateSessionScore(questions, answers);
    const scoreColor = getScoreColor(score.percentage);

    // Calculate newly mastered questions
    const newlyMastered: string[] = [];
    questions.forEach((q: Question) => {
      if (!q.id) return;
      const userAnswer = answers.get(q.id);
      const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
      const isCorrect = userAnswer !== undefined && userAnswer === correctAnswerIndex;
      
      if (isCorrect) {
        const currentStreak = snapshot.correctStreak[q.id] || 0;
        if (currentStreak + 1 >= 2) {
          newlyMastered.push(q.id);
        }
      }
    });

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">오답노트 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className={`text-5xl font-bold mb-2 ${scoreColor}`}>
                {score.percentage.toFixed(1)}%
              </p>
              <p className="text-xl text-gray-700 mb-4">
                {formatScore(score.correct, score.total)}
              </p>
              {newlyMastered.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎉 {newlyMastered.length}개 문제를 마스터했습니다!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    2번 연속 정답을 맞춘 문제는 자동으로 완료 처리됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/mistakes')} variant="secondary">
                오답노트로 돌아가기
              </Button>
              <Button onClick={handleRestart} variant="primary">
                다시 풀기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">No questions available</p>
      </div>
    );
  }

  const answeredIndices = new Set<number>(
    questions.map((q: Question, i: number) => (q.id && answers.has(q.id) ? i : -1)).filter((i: number) => i >= 0)
  );

  const correctIndices = new Set<number>(
    questions
      .map((q: Question, i: number) => {
        if (!q.id) return -1;
        const userAnswer = answers.get(q.id);
        const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
        return userAnswer !== undefined && userAnswer === correctAnswerIndex ? i : -1;
      })
      .filter((i: number) => i >= 0)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">{snapshot?.title}</h1>
        <ProgressBar
          current={currentIndex}
          total={questions.length}
          answeredQuestions={answeredIndices}
          correctAnswers={correctIndices}
          onNavigate={handleNavigate}
        />
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedChoice={selectedChoice}
        onSelectChoice={handleSelectChoice}
        isSubmitted={isSubmitted}
        showAnswer={showAnswer}
        onSubmit={handleSubmit}
        onNext={handleNext}
        onSaveExplanation={handleSaveExplanation}
      />

      {snapshot && currentQuestion.id && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 text-center">
          현재 연속 정답: {snapshot.correctStreak[currentQuestion.id] || 0}회 (2회 시 마스터)
        </div>
      )}
    </div>
  );
}
