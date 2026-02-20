export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

export function formatScore(correct: number, total: number): string {
  return `${correct}/${total} (${formatPercentage(correct, total)})`;
}

export function getDifficultyLabel(difficulty: 1 | 2 | 3): string {
  const labels = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard',
  };
  return labels[difficulty];
}

export function getDifficultyColor(difficulty: 1 | 2 | 3): string {
  const colors = {
    1: 'text-green-600',
    2: 'text-yellow-600',
    3: 'text-red-600',
  };
  return colors[difficulty];
}

export function getScoreColor(percentage: number): string {
  if (percentage >= 70) return 'text-green-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}
