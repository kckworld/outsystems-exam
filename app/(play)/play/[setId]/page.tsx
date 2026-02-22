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

interface QuestionSet {
  setId: string;
  title: string;
  description: string;
  questionCount: number;
}

export default function PlaySetPage({ params }: { params: { setId: string } }) {
  const router = useRouter();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [selectedChoice, setSelectedChoice] = useState<number | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [savingToMistakes, setSavingToMistakes] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/sets/${params.setId}`);
        if (!response.ok) throw new Error('Failed to fetch set');
        const data = await response.json();
        setSet(data.set);
        setQuestions(data.questions);
      } catch (error) {
        console.error('Error fetching set:', error);
        alert('Failed to load question set');
        router.push('/play');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.setId, router]);

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
    if (confirm('Are you sure you want to restart? Your progress will be lost.')) {
      setCurrentIndex(0);
      setAnswers(new Map());
      setSelectedChoice(undefined);
      setIsSubmitted(false);
      setShowAnswer(false);
      setIsComplete(false);
    }
  };

  const handleFinishEarly = () => {
    if (confirm('미완료된 문제는 오답 처리됩니다. 결과를 확인하시겠습니까?')) {
      setIsComplete(true);
    }
  };

  const handleSaveToMistakes = async () => {
    if (!set) return;

    const wrongQuestionIds = questions
      .filter((q) => {
        if (!q.id) return false;
        const userAnswer = answers.get(q.id);
        const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
        return userAnswer !== undefined && userAnswer !== correctAnswerIndex;
      })
      .map((q) => q.id as string);

    if (wrongQuestionIds.length === 0) {
      alert('틀린 문제가 없어 오답노트에 저장할 수 없습니다.');
      return;
    }

    if (!confirm(`${wrongQuestionIds.length}개의 틀린 문제를 오답노트에 저장하시겠습니까?`)) {
      return;
    }

    setSavingToMistakes(true);
    try {
      const response = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseScope: 'set',
          baseScopeId: params.setId,
          title: `${set.title} - 오답노트`,
          wrongQuestionIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to save mistakes');

      alert('오답노트에 저장되었습니다!');
      router.push('/mistakes');
    } catch (error) {
      console.error('Error saving mistakes:', error);
      alert('오답노트 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingToMistakes(false);
    }
  };

  // Keyboard shortcuts
  useQuestionNavigation(
    currentIndex,
    questions.length,
    handleNavigate,
    (choiceIndex) => {
      if (!isSubmitted && choiceIndex < currentQuestion.choices.length) {
        handleSelectChoice(choiceIndex);
        setTimeout(handleSubmit, 100); // Auto-submit after selection
      }
    }
  );

  useEffect(() => {
    const handleRestartEvent = () => handleRestart();
    window.addEventListener('restart-practice', handleRestartEvent);
    return () => window.removeEventListener('restart-practice', handleRestartEvent);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isComplete) {
    const score = calculateSessionScore(questions, answers);
    const scoreColor = getScoreColor(score.percentage);

    // Get wrong questions
    const wrongQuestions = questions.filter((q, i) => {
      if (!q.id) return false;
      const userAnswer = answers.get(q.id);
      const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
      return userAnswer !== undefined && userAnswer !== correctAnswerIndex;
    });

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Practice Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className={`text-5xl font-bold mb-2 ${scoreColor}`}>
                {score.percentage.toFixed(1)}%
              </p>
              <p className="text-xl text-gray-700 mb-4">
                {formatScore(score.correct, score.total)}
              </p>
              <p className="text-lg text-gray-600">
                {score.passed
                  ? 'Great job! You passed the 70% threshold.'
                  : 'Keep practicing to reach 70%'}
              </p>
            </div>

            {wrongQuestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">틀린 문제 ({wrongQuestions.length}개)</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {wrongQuestions.map((q, idx) => {
                    const userAnswer = q.id ? answers.get(q.id) : undefined;
                    const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
                    return (
                      <div key={q.id || idx} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {q.topic}
                          </span>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                            난이도 {q.difficulty}
                          </span>
                        </div>
                        <p className="font-medium mb-3">{q.stem}</p>
                        <div className="space-y-1 mb-3">
                          {q.choices.map((choice, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded text-sm ${
                                i === correctAnswerIndex
                                  ? 'bg-green-100 border border-green-300 font-medium'
                                  : i === userAnswer
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                              {choice}
                              {i === correctAnswerIndex && <span className="ml-2 text-green-700">✓ 정답</span>}
                              {i === userAnswer && i !== correctAnswerIndex && <span className="ml-2 text-red-700">✗ 선택한 답</span>}
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-900 mb-1">💡 해설</p>
                          <p className="text-sm text-blue-800">{q.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              {wrongQuestions.length > 0 && (
                <Button
                  onClick={handleSaveToMistakes}
                  variant="primary"
                  disabled={savingToMistakes}
                >
                  {savingToMistakes ? '저장 중...' : '오답노트에 저장'}
                </Button>
              )}
              <Button onClick={() => router.push('/play')} variant="secondary">
                Back to Sets
              </Button>
              <Button onClick={handleRestart} variant="secondary">
                Practice Again
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

  const answeredIndices = new Set(
    questions.map((q, i) => (q.id && answers.has(q.id) ? i : -1)).filter((i) => i >= 0)
  );

  const correctIndices = new Set(
    questions
      .map((q, i) => {
        if (!q.id) return -1;
        const userAnswer = answers.get(q.id);
        const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
        return userAnswer !== undefined && userAnswer === correctAnswerIndex ? i : -1;
      })
      .filter((i) => i >= 0)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{set?.title}</h1>
        <p className="text-gray-600">{set?.description}</p>
      </div>

      <div className="mb-6">
        <ProgressBar
          current={currentIndex}
          total={questions.length}
          onNavigate={handleNavigate}
          answeredQuestions={answeredIndices}
          correctAnswers={correctIndices}
        />
      </div>

      <div className="max-w-3xl mx-auto">
        <QuestionCard
          question={currentQuestion}
          selectedChoice={selectedChoice}
          showAnswer={showAnswer}
          onSelectChoice={handleSelectChoice}
          onSubmit={handleSubmit}
          onNext={handleNext}
          isSubmitted={isSubmitted}
        />

        <div className="mt-6 flex justify-between items-center gap-4">
          <Button
            onClick={() => handleNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            variant="secondary"
          >
            Previous
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleRestart} variant="ghost">
              Restart (R)
            </Button>
            <Button onClick={handleFinishEarly} variant="secondary">
              결과 보기
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={!isSubmitted}
            variant="secondary"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
