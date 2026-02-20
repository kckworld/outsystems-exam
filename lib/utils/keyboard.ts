import { useEffect } from 'react';

export type KeyHandler = (event: KeyboardEvent) => void;

export function useKeyboardShortcut(
  key: string,
  handler: KeyHandler,
  deps: any[] = []
) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === key) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [key, ...deps]);
}

export function useQuestionNavigation(
  currentIndex: number,
  totalQuestions: number,
  onNavigate: (index: number) => void,
  onSubmitAnswer: (choiceIndex: number) => void
) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Number keys 1-4 for answer selection
      if (['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        const choiceIndex = parseInt(event.key) - 1;
        onSubmitAnswer(choiceIndex);
        return;
      }

      // Arrow navigation
      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault();
        onNavigate(currentIndex - 1);
      } else if (event.key === 'ArrowRight' && currentIndex < totalQuestions - 1) {
        event.preventDefault();
        onNavigate(currentIndex + 1);
      }

      // G for go to (can trigger modal)
      if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        // Trigger go-to modal (caller should handle this)
        window.dispatchEvent(new CustomEvent('open-goto-modal'));
      }

      // R for restart (can trigger confirmation)
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('restart-practice'));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, totalQuestions, onNavigate, onSubmitAnswer]);
}
