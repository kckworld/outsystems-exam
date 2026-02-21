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

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
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

            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/play')} variant="secondary">
                Back to Sets
              </Button>
              <Button onClick={handleRestart} variant="primary">
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

        <div className="mt-6 flex justify-between">
          <Button
            onClick={() => handleNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            variant="secondary"
          >
            Previous
          </Button>
          <Button onClick={handleRestart} variant="ghost">
            Restart (R)
          </Button>
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
