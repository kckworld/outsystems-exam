import { Question } from '@/lib/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getDifficultyLabel, getDifficultyColor } from '@/lib/utils/format';

interface QuestionCardProps {
  question: Question;
  selectedChoice?: number;
  showAnswer?: boolean;
  onSelectChoice?: (choiceIndex: number) => void;
  onSubmit?: () => void;
  onNext?: () => void;
  isSubmitted?: boolean;
  showTopics?: boolean;
}

export function QuestionCard({
  question,
  selectedChoice,
  showAnswer = false,
  onSelectChoice,
  onSubmit,
  onNext,
  isSubmitted = false,
  showTopics = true,
}: QuestionCardProps) {
  const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(question.answer);
  const isCorrect = selectedChoice === correctAnswerIndex;
  const hasSelected = selectedChoice !== undefined;

  return (
    <Card className="w-full">
      <CardHeader>
        {/* Topics and Difficulty */}
        {showTopics && (
          <div className="flex flex-wrap gap-2 mb-3">
            {question.topics.map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
              >
                {topic}
              </span>
            ))}
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded',
                getDifficultyColor(question.difficulty),
                'bg-gray-100'
              )}
            >
              {getDifficultyLabel(question.difficulty)}
            </span>
          </div>
        )}

        {/* Question Stem */}
        <CardTitle className="text-xl leading-relaxed">
          {question.stem}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Choices */}
        <div className="space-y-3 mb-6">
          {question.choices.map((choice, index) => {
            const isSelected = selectedChoice === index;
            const isCorrectChoice = correctAnswerIndex === index;
            const showCorrect = showAnswer && isCorrectChoice;
            const showWrong = showAnswer && isSelected && !isCorrect;

            let borderColor = 'border-gray-300';
            let bgColor = 'bg-white hover:bg-gray-50';

            if (showCorrect) {
              borderColor = 'border-green-500';
              bgColor = 'bg-green-50';
            } else if (showWrong) {
              borderColor = 'border-red-500';
              bgColor = 'bg-red-50';
            } else if (isSelected) {
              borderColor = 'border-blue-500';
              bgColor = 'bg-blue-50';
            }

            return (
              <button
                key={index}
                onClick={() => !showAnswer && onSelectChoice?.(index)}
                disabled={showAnswer || !onSelectChoice}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  borderColor,
                  bgColor,
                  !showAnswer && onSelectChoice && 'cursor-pointer',
                  showAnswer && 'cursor-default'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-gray-700 min-w-[24px]">
                    {index + 1}.
                  </span>
                  <span className="flex-1">{choice}</span>
                  {showCorrect && (
                    <span className="text-green-600 font-bold">Correct</span>
                  )}
                  {showWrong && (
                    <span className="text-red-600 font-bold">Wrong</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Keyboard Hint */}
        {!showAnswer && (
          <p className="text-sm text-gray-500 mb-4">
            Press 1-4 to select an answer
          </p>
        )}

        {/* Explanation */}
        {showAnswer && question.explanation && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Explanation</h4>
            <p className="text-gray-700">{question.explanation}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {!isSubmitted && hasSelected && onSubmit && (
            <Button onClick={onSubmit} variant="primary">
              Submit Answer
            </Button>
          )}
          {isSubmitted && onNext && (
            <Button onClick={onNext} variant="primary">
              Next Question
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
