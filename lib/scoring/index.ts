import { Question } from '@/lib/schema';

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: number;
  userAnswer: number;
  explanation?: string;
}

export interface SessionScore {
  total: number;
  correct: number;
  wrong: number;
  percentage: number;
  passed: boolean; // True if >= 70%
}

export interface TopicScore {
  topic: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface DifficultyScore {
  difficulty: 1 | 2 | 3;
  total: number;
  correct: number;
  percentage: number;
}

export function checkAnswer(
  question: Question,
  selectedChoice: number
): AnswerResult {
  const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(question.answer);
  const isCorrect = selectedChoice === correctAnswerIndex;
  return {
    isCorrect,
    correctAnswer: correctAnswerIndex,
    userAnswer: selectedChoice,
    explanation: question.explanation,
  };
}

export function calculateSessionScore(
  questions: Question[],
  answers: Map<string, number> // questionId -> selectedChoice
): SessionScore {
  let correct = 0;
  const total = questions.length;

  questions.forEach((q) => {
    if (!q.id) return;
    const userAnswer = answers.get(q.id);
    const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
    if (userAnswer !== undefined && userAnswer === correctAnswerIndex) {
      correct++;
    }
  });

  const percentage = total > 0 ? (correct / total) * 100 : 0;

  return {
    total,
    correct,
    wrong: total - correct,
    percentage,
    passed: percentage >= 70,
  };
}

export function calculateTopicScores(
  questions: Question[],
  answers: Map<string, number>
): TopicScore[] {
  const topicMap = new Map<string, { total: number; correct: number }>();

  questions.forEach((q) => {
    const topic = q.topic;
    if (!topicMap.has(topic)) {
      topicMap.set(topic, { total: 0, correct: 0 });
    }
    const stats = topicMap.get(topic)!;
    stats.total++;

    if (!q.id) return;
    const userAnswer = answers.get(q.id);
    const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
    if (userAnswer !== undefined && userAnswer === correctAnswerIndex) {
      stats.correct++;
    }
  });

  return Array.from(topicMap.entries())
    .map(([topic, stats]) => ({
      topic,
      total: stats.total,
      correct: stats.correct,
      percentage: (stats.correct / stats.total) * 100,
    }))
    .sort((a, b) => a.percentage - b.percentage); // Sort by weakest first
}

export function calculateDifficultyScores(
  questions: Question[],
  answers: Map<string, number>
): DifficultyScore[] {
  const difficultyMap = new Map<
    1 | 2 | 3,
    { total: number; correct: number }
  >();

  questions.forEach((q) => {
    if (!difficultyMap.has(q.difficulty)) {
      difficultyMap.set(q.difficulty, { total: 0, correct: 0 });
    }
    const stats = difficultyMap.get(q.difficulty)!;
    stats.total++;

    if (!q.id) return;
    const userAnswer = answers.get(q.id);
    const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(q.answer);
    if (userAnswer !== undefined && userAnswer === correctAnswerIndex) {
      stats.correct++;
    }
  });

  return Array.from(difficultyMap.entries())
    .map(([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      correct: stats.correct,
      percentage: (stats.correct / stats.total) * 100,
    }))
    .sort((a, b) => a.difficulty - b.difficulty);
}

export function identifyWeakTopics(
  topicScores: TopicScore[],
  threshold: number = 70
): string[] {
  return topicScores
    .filter((ts) => ts.percentage < threshold)
    .map((ts) => ts.topic);
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getProgressMessage(percentage: number): string {
  if (percentage >= 80) return 'Excellent! You are well prepared.';
  if (percentage >= 70) return 'Good! You passed the threshold.';
  if (percentage >= 60) return 'Close! A bit more practice needed.';
  return 'Keep practicing. Review the weak areas.';
}

// Aliases for backward compatibility
export const calculateTopicBreakdown = calculateTopicScores;
export const calculateDifficultyBreakdown = calculateDifficultyScores;

