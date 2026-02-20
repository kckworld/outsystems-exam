import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Load sample set
  const sampleSetPath = path.join(process.cwd(), 'data', 'sample_set.json');
  const sampleSet = JSON.parse(fs.readFileSync(sampleSetPath, 'utf-8'));

  // Create question set
  const setId = `set-${Date.now()}`;
  await prisma.questionSet.create({
    data: {
      setId,
      title: sampleSet.setMeta.title,
      description: sampleSet.setMeta.description,
      versionLabel: sampleSet.setMeta.versionLabel,
      createdAt: new Date().toISOString(),
      questionCount: sampleSet.questions.length,
      isLocked: true,
    },
  });

  console.log(`Created question set: ${setId}`);

  // Create questions
  for (const q of sampleSet.questions) {
    await prisma.question.create({
      data: {
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        choices: JSON.stringify(q.choices),
        answer: q.answer,
        explanation: q.explanation,
        tags: JSON.stringify(q.tags),
        source: q.source,
        createdAt: new Date().toISOString(),
        setId,
      },
    });
  }

  console.log(`Created ${sampleSet.questions.length} questions`);

  // Load additional sample questions
  const questionsPath = path.join(process.cwd(), 'data', 'sample_questions.json');
  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const setId2 = `set-${Date.now()}-2`;
  await prisma.questionSet.create({
    data: {
      setId: setId2,
      title: 'Additional Practice Questions',
      description: 'Extra questions covering various topics',
      versionLabel: 'v1.0',
      createdAt: new Date().toISOString(),
      questionCount: questions.length,
      isLocked: true,
    },
  });

  for (const q of questions) {
    await prisma.question.create({
      data: {
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        stem: q.stem,
        choices: JSON.stringify(q.choices),
        answer: q.answer,
        explanation: q.explanation,
        tags: JSON.stringify(q.tags),
        source: q.source,
        createdAt: q.createdAt || new Date().toISOString(),
        setId: setId2,
      },
    });
  }

  console.log(`Created ${questions.length} additional questions`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
