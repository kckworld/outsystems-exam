'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/QuestionCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Question } from '@/lib/schema';
import { useQuestionNavigation } from '@/lib/utils/keyboard';
import { calculateSessionScore, calculateTopicBreakdown, calculateDifficultyBreakdown } from '@/lib/scoring';
import { formatScore, getScoreColor } from '@/lib/utils/format';

export default function TrainSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [selectedChoice, setSelectedChoice] = useState<number | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const sessionData = sessionStorage.getItem('trainSession');
    if (!sessionData) {
      alert('Training session not found');
      router.push('/train');
      return;
    }

    try {
      const data = JSON.parse(sessionData);
      setQuestions(data.questions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Failed to load training session');
      router.push('/train');
    }
  }, [params.sessionId, router]);

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

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">No questions available</p>
      </div>
    );
  }

  if (isComplete) {
    const score = calculateSessionScore(questions, answers);
    const topicBreakdown = calculateTopicBreakdown(questions, answers);
    const difficultyBreakdown = calculateDifficultyBreakdown(questions, answers);
    const scoreColor = getScoreColor(score.percentage);

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">맞춤 학습 완료</CardTitle>
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
                {score.passed ? '합격 ✓' : '불합격 ✗'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">토픽별 점수</h3>
              <div className="space-y-2">
                {topicBreakdown.map((item) => (
                  <div key={item.topic} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.topic}</span>
                    <span className="text-sm font-medium">
                      {item.correct}/{item.total} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">난이도별 점수</h3>
              <div className="space-y-2">
                {difficultyBreakdown.map((item) => (
                  <div key={item.difficulty} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {item.difficulty === 1 ? '쉬움' : item.difficulty === 2 ? '보통' : '어려움'}
                    </span>
                    <span className="text-sm font-medium">
                      {item.correct}/{item.total} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => router.push('/train')} variant="secondary" className="flex-1">
                새 학습 시작
              </Button>
              <Button onClick={handleRestart} variant="primary" className="flex-1">
                다시 풀기
              </Button>
            </div>
          </CardContent>
        </Card>
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
        <h1 className="text-2xl font-bold mb-2">맞춤 학습</h1>
        <p className="text-gray-600">진행 중...</p>
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
