# NEXT_STEPS

마지막 업데이트: 2026-03-11

## 현재 상태 요약

- 최신 원격 브랜치: `origin/main`
- 최근 반영 커밋:
  - `b33eeb9` fix(ui): preserve explanation line breaks and numbering format
  - `2cd63bc` feat(train): select set filter and unify post-solve question editing
  - `76a18e7` feat: allow explanation editing after solve and add question text copy
- 현재 로컬 작업트리: clean (변경 없음)

## 오늘 완료한 핵심 기능

- 맞춤학습 세트 선택 추가:
  - `맞춤학습`에서 문제 세트 드롭다운 제공
  - 미선택 시 전체, 선택 시 해당 세트만 필터
  - 반영: `app/(train)/train/page.tsx`, `app/api/train/route.ts`
- 풀이 후 통합 편집:
  - 문제 본문 + 보기 + 해설을 한 번에 수정/저장
  - 반영: `components/QuestionCard.tsx`,
    `app/(play)/play/[setId]/page.tsx`,
    `app/(train)/train/[sessionId]/page.tsx`,
    `app/(mistakes)/mistakes/[id]/page.tsx`,
    `app/api/questions/[id]/explanation/route.ts`
- 해설 가독성 개선:
  - GPT/Gemini 붙여넣기 줄바꿈/번호 형식 유지(`whitespace-pre-wrap`)
  - 반영: `components/QuestionCard.tsx`,
    `app/(play)/play/[setId]/page.tsx`,
    `app/(train)/train/[sessionId]/page.tsx`,
    `app/(admin)/admin/page.tsx`

## 내일 시작 체크리스트

1. NAS에서 최신 코드 반영
2. 브라우저 캐시 새로고침 후 기능 확인
3. 아래 시나리오 수동 점검

## 내일 점검 시나리오

1. 맞춤학습에서 `세트 선택` 안 하고 시작하면 전체 문제에서 출제되는지 확인
2. 맞춤학습에서 특정 세트 선택 후 시작하면 해당 세트 문제만 나오는지 확인
3. 풀이 화면에서 정답 공개 후 문제/보기/해설 통합 수정이 저장되는지 확인
4. GPT/Gemini 포맷(번호/줄바꿈) 해설 붙여넣기 후 표시가 원문 형태로 유지되는지 확인
5. 오답노트 저장/재풀이 흐름이 기존과 동일하게 동작하는지 확인

## NAS 반영 명령어

```bash
cd /volume1/docker/outsystems-exam
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

## 메모

- `docker compose build` 실패 시 기존 이미지가 유지될 수 있으므로 실패 로그 먼저 확인
- 배포 후 이상하면 `docker compose logs -f`로 route error/TS error 우선 확인
