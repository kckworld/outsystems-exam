import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/sqlite';
import type { Question } from '@/lib/schema';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderQuestion(question: Question, index: number, streak: number): string {
  const choicesHtml = question.choices
    .map((choice, choiceIndex) => {
      const label = String.fromCharCode(65 + choiceIndex);
      const isAnswer = label === question.answer;
      return `<li class="choice ${isAnswer ? 'answer' : ''}"><span class="label">${label}.</span> ${escapeHtml(choice)}</li>`;
    })
    .join('');

  return `
    <section class="question">
      <h3>문제 ${index + 1} <span class="meta">[${escapeHtml(question.id || '-')} / ${escapeHtml(question.topic)} / 난이도 ${question.difficulty}]</span></h3>
      <p class="stem">${escapeHtml(question.stem)}</p>
      <ol class="choices">${choicesHtml}</ol>
      <p class="explanation"><strong>해설:</strong> ${escapeHtml(question.explanation || '없음')}</p>
      <p class="streak">현재 연속 정답: ${streak}/2</p>
    </section>
  `;
}

function renderPrintableHtml(snapshot: {
  snapshotId: string;
  title: string;
  createdAt: string;
  wrongQuestionIds: string[];
  correctStreak: Record<string, number>;
  isArchived: boolean;
}, questions: Question[]): string {
  const created = new Date(snapshot.createdAt).toLocaleString('ko-KR');
  const questionsHtml = questions
    .map((question, index) => renderQuestion(question, index, snapshot.correctStreak[question.id || ''] || 0))
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>오답노트 PDF - ${escapeHtml(snapshot.title)}</title>
  <style>
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; color: #111; margin: 24px; }
    .topbar { margin-bottom: 20px; }
    .print-btn { background: #111827; color: #fff; border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; }
    .print-hint { color: #4b5563; font-size: 13px; margin-top: 8px; }
    .header { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; }
    .meta-line { font-size: 13px; color: #374151; margin: 2px 0; }
    .question { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid; }
    .question h3 { margin: 0 0 8px 0; font-size: 16px; }
    .meta { color: #6b7280; font-size: 13px; font-weight: normal; }
    .stem { margin: 8px 0 10px 0; line-height: 1.5; }
    .choices { margin: 0 0 10px 18px; padding: 0; }
    .choice { margin: 4px 0; line-height: 1.4; }
    .choice.answer { color: #166534; font-weight: 600; }
    .label { display: inline-block; width: 20px; }
    .explanation, .streak { margin: 6px 0 0 0; font-size: 14px; }
    @media print {
      .topbar { display: none; }
      body { margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <button class="print-btn" onclick="window.print()">PDF로 저장하기</button>
    <p class="print-hint">브라우저 인쇄 창에서 대상(프린터)을 PDF로 선택하면 다운로드할 수 있습니다.</p>
  </div>

  <section class="header">
    <h1>오답노트 내보내기</h1>
    <p class="meta-line"><strong>제목:</strong> ${escapeHtml(snapshot.title)}</p>
    <p class="meta-line"><strong>스냅샷 ID:</strong> ${escapeHtml(snapshot.snapshotId)}</p>
    <p class="meta-line"><strong>생성일:</strong> ${escapeHtml(created)}</p>
    <p class="meta-line"><strong>문제 수:</strong> ${snapshot.wrongQuestionIds.length}개</p>
    <p class="meta-line"><strong>상태:</strong> ${snapshot.isArchived ? '보관됨' : '활성'}</p>
  </section>

  ${questionsHtml}
</body>
</html>`;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const snapshot = await storage.getMistakeSnapshot(params.id);
    if (!snapshot) {
      return NextResponse.json({ error: 'Mistake snapshot not found' }, { status: 404 });
    }

    const questions = await storage.getQuestionsByIds(snapshot.wrongQuestionIds);
    const byId = new Map<string, Question>(
      questions
        .filter((q): q is Question & { id: string } => Boolean(q.id))
        .map((q) => [q.id as string, q])
    );

    const orderedQuestions = snapshot.wrongQuestionIds
      .map((id: string) => byId.get(id))
      .filter((q: Question | undefined): q is Question => Boolean(q));

    const html = renderPrintableHtml(snapshot, orderedQuestions);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error rendering mistake printable page:', error);
    return NextResponse.json({ error: 'Failed to render printable page' }, { status: 500 });
  }
}
