import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  onNavigate?: (index: number) => void;
  answeredQuestions?: Set<number>; // Indices of answered questions
  correctAnswers?: Set<number>; // Indices of correctly answered questions
  className?: string;
}

export function ProgressBar({
  current,
  total,
  onNavigate,
  answeredQuestions,
  correctAnswers,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>{Math.round(percentage)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Question dots */}
      {onNavigate && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: total }, (_, i) => {
            const isAnswered = answeredQuestions?.has(i);
            const isCorrect = correctAnswers?.has(i);
            const isCurrent = i === current;

            let bgColor = 'bg-gray-200';
            if (isCurrent) {
              bgColor = 'bg-blue-600 ring-2 ring-blue-300';
            } else if (isCorrect) {
              bgColor = 'bg-green-500';
            } else if (isAnswered) {
              bgColor = 'bg-red-500';
            }

            return (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={cn(
                  'w-8 h-8 rounded-full text-xs font-medium transition-all',
                  bgColor,
                  isCurrent ? 'text-white' : 'text-gray-700 hover:ring-2 hover:ring-gray-400'
                )}
                aria-label={`Go to question ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
