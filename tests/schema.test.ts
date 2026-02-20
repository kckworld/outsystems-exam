import { QuestionSchema, DifficultySchema, AnswerSchema } from '../lib/schema';

describe('Schema Validation', () => {
  describe('QuestionSchema', () => {
    it('should validate a correct question', () => {
      const validQuestion = {
        id: 'OSAD-0001',
        topic: 'Client Variables',
        difficulty: 2,
        stem: 'What is a client variable?',
        choices: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 'A' as const,
        explanation: 'Client variables store data on the client side.',
        tags: ['basics'],
        source: 'Generated',
      };

      const result = QuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject question with wrong number of choices', () => {
      const invalidQuestion = {
        id: 'OSAD-0001',
        topic: 'Test',
        difficulty: 1,
        stem: 'Test question',
        choices: ['A', 'B', 'C'], // Only 3 choices
        answer: 'A' as const,
        explanation: 'Test',
        tags: [],
        source: 'Test',
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with invalid difficulty', () => {
      const invalidQuestion = {
        id: 'OSAD-0001',
        topic: 'Test',
        difficulty: 5, // Invalid
        stem: 'Test question',
        choices: ['A', 'B', 'C', 'D'],
        answer: 'A' as const,
        explanation: 'Test',
        tags: [],
        source: 'Test',
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with invalid answer', () => {
      const invalidQuestion = {
        id: 'OSAD-0001',
        topic: 'Test',
        difficulty: 1,
        stem: 'Test question',
        choices: ['A', 'B', 'C', 'D'],
        answer: 'E', // Invalid
        explanation: 'Test',
        tags: [],
        source: 'Test',
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with empty stem', () => {
      const invalidQuestion = {
        id: 'OSAD-0001',
        topic: 'Test',
        difficulty: 1,
        stem: '', // Empty
        choices: ['A', 'B', 'C', 'D'],
        answer: 'A' as const,
        explanation: 'Test',
        tags: [],
        source: 'Test',
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question with empty choice', () => {
      const invalidQuestion = {
        id: 'OSAD-0001',
        topic: 'Test',
        difficulty: 1,
        stem: 'Test',
        choices: ['A', '', 'C', 'D'], // Empty choice
        answer: 'A' as const,
        explanation: 'Test',
        tags: [],
        source: 'Test',
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });
  });

  describe('DifficultySchema', () => {
    it('should accept valid difficulties', () => {
      expect(DifficultySchema.safeParse(1).success).toBe(true);
      expect(DifficultySchema.safeParse(2).success).toBe(true);
      expect(DifficultySchema.safeParse(3).success).toBe(true);
    });

    it('should reject invalid difficulties', () => {
      expect(DifficultySchema.safeParse(0).success).toBe(false);
      expect(DifficultySchema.safeParse(4).success).toBe(false);
      expect(DifficultySchema.safeParse('2').success).toBe(false);
    });
  });

  describe('AnswerSchema', () => {
    it('should accept valid answers', () => {
      expect(AnswerSchema.safeParse('A').success).toBe(true);
      expect(AnswerSchema.safeParse('B').success).toBe(true);
      expect(AnswerSchema.safeParse('C').success).toBe(true);
      expect(AnswerSchema.safeParse('D').success).toBe(true);
    });

    it('should reject invalid answers', () => {
      expect(AnswerSchema.safeParse('E').success).toBe(false);
      expect(AnswerSchema.safeParse('a').success).toBe(false);
      expect(AnswerSchema.safeParse('1').success).toBe(false);
      expect(AnswerSchema.safeParse('').success).toBe(false);
    });
  });
});
