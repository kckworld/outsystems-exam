export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      resolve();
    } catch (error) {
      textArea.remove();
      reject(error);
    }
  });
}

export function formatQuestionForClipboard(
  question: {
    stem: string;
    choices: string[];
    answer: string;
    explanation: string;
  },
  selectedAnswer?: string
): string {
  const lines: string[] = [];
  
  lines.push('[Question]');
  lines.push(question.stem);
  lines.push('');
  
  lines.push('[Choices]');
  question.choices.forEach((choice, idx) => {
    const letter = String.fromCharCode(65 + idx); // A, B, C, D
    lines.push(`${letter}. ${choice}`);
  });
  lines.push('');
  
  if (selectedAnswer) {
    lines.push('[My Answer]');
    lines.push(selectedAnswer);
    lines.push('');
  }
  
  lines.push('[Correct Answer]');
  lines.push(question.answer);
  lines.push('');
  
  lines.push('[Explanation]');
  lines.push(question.explanation);
  
  return lines.join('\n');
}
