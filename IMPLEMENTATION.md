# 구현 가이드

이 문서는 OutSystems Exam Trainer 구현을 완성하기 위한 단계별 가이드를 제공합니다.

## MVP 구현 우선순위

### 1단계: 핵심 인프라 (완료)
- [x] 프로젝트 설정 (Next.js, TypeScript, Tailwind)
- [x] Prisma 스키마
- [x] Zod 스키마
- [x] SQLite 저장소 레이어
- [x] Docker 구성
- [x] 샘플 데이터
- [x] 기본 UI 컴포넌트
- [x] 관리자 페이지
- [x] 연습 모드 페이지
- [x] API 라우트 (import, list, clone, export)

### 2단계: 진행 상황 저장 (중요도: 높음)
예상 시간: 2-4시간

**생성할 파일:**
1. `app/api/progress/route.ts` - 진행 상황 저장/조회 API
2. `lib/hooks/useProgress.ts` - 진행 상황 자동 저장 훅
3. `lib/storage/progress.ts` - 진행 상황 관련 DB 작업

**구현 단계:**
```typescript
// 1. Progress API
// app/api/progress/route.ts
POST /api/progress
{
  userId: string (기본값: "default")
  scope: "set" | "train"
  scopeId: string
  currentIndex: number
  answers: { [questionId]: number }
}

GET /api/progress?scope=set&scopeId=xxx
// 해당 scope의 진행 상황 반환

// 2. Auto-save Hook
// lib/hooks/useProgress.ts
export function useProgress(scope, scopeId) {
  // 답변 변경 시 자동으로 디바운스 저장
  // 로드 시 이전 진행 상황 복원
}

// 3. Play 페이지에 통합
// 페이지 로드 시 진행 상황 복원
// 각 답변 후 자동 저장
```

### 3단계: 오답노트 (MVP 핵심)
예상 시간: 4-6시간

**생성할 파일:**
1. `app/api/mistakes/route.ts` - 스냅샷 생성/목록
2. `app/api/mistakes/[id]/route.ts` - 스냅샷 조회/삭제
3. `app/api/mistakes/[id]/answer/route.ts` - 답변 기록 및 자동 아카이브
4. `components/mistakes/SnapshotCard.tsx` - 스냅샷 카드 컴포넌트
5. `app/(mistakes)/mistakes/[snapshotId]/page.tsx` - 오답 연습 페이지 개선

**구현 단계:**
```typescript
// 1. 스냅샷 생성 (Play 결과 화면에서)
// Play 완료 후 "오답노트에 추가" 버튼
POST /api/mistakes
Body: {
  sourceType: "set",
  sourceId: setId,
  wrongQuestionIds: [...],
  title: `오답 ${new Date().toLocaleDateString()}`
}

// 2. 스냅샷 목록 페이지 구현
// app/(mistakes)/mistakes/page.tsx 개선
- 활성/아카이브 탭으로 그룹화
- 각 스냅샷: 제목, 날짜, 문제 수, 상태 표시
- 클릭하여 연습 시작

// 3. 오답 연습 페이지
// app/(mistakes)/mistakes/[snapshotId]/page.tsx
- 스냅샷과 문제 로드
- Play 모드의 QuestionCard 재사용
- 각 답변 시:
  - POST /api/mistakes/[id]/answer
  - 서버에서 correctStreak 업데이트
  - correctStreak >= 2이면 활성 목록에서 제거
  - 모두 제거되면 자동 아카이브
- 남은 활성 문제 수 표시

// 4. 자동 아카이브 로직
// lib/storage/sqlite.ts에 추가
function updateMistakeProgress(snapshotId, questionId, isCorrect) {
  const snapshot = await getMistakeSnapshot(snapsotId)
  if (isCorrect) {
    snapshot.correctStreak[questionId]++
    if (snapshot.correctStreak[questionId] >= 2) {
      // wrongQuestionIds에서 제거
      snapshot.wrongQuestionIds = snapshot.wrongQuestionIds.filter(
        id => id !== questionId
      )
      // 모두 마스터했는지 확인
      if (snapshot.wrongQuestionIds.length === 0) {
        snapshot.isArchived = true
        snapshot.archivedAt = new Date().toISOString()
      }
    }
  } else {
    snapshot.correctStreak[questionId] = 0
  }
  await updateSnapshot(snapshot)
}
```

**필요한 API 라우트:**
- [ ] `POST /api/mistakes/route.ts`
- [ ] `GET /api/mistakes/route.ts`
- [ ] `GET /api/mistakes/[id]/route.ts`
- [ ] `POST /api/mistakes/[id]/answer/route.ts`
- [ ] `DELETE /api/mistakes/[id]/route.ts`

### 4단계: 커스텀 트레이닝 (향상 기능)
예상 시간: 6-8시간

**생성할 파일:**
1. `app/api/train/route.ts` - 트레이닝 세션 생성
2. `app/api/train/[id]/route.ts` - 트레이닝 세션 조회
3. `app/api/questions/topics/route.ts` - 고유 주제 목록
4. `components/train/FilterForm.tsx` - 주제/난이도 선택 폼
5. `components/train/TrainingResults.tsx` - 주제별 결과 분석
6. `app/(train)/train/[sessionId]/page.tsx` - 트레이닝 연습 페이지

**구현 단계:**
```typescript
// 1. 설정 페이지 개선
// app/(train)/train/page.tsx
- 주제 다중 선택 (모든 문제에서 고유 주제 가져오기)
- 난이도 다중 선택 (1, 2, 3)
- 문제 수 입력 (기본값: 20)
- 소스 세트 다중 선택 (선택사항)
- "트레이닝 생성" 버튼
- POST /api/train으로 설정 전송
- /train/[sessionId]로 리다이렉트

// 2. 트레이닝 연습
// app/(train)/train/[sessionId]/page.tsx
- /api/train/[sessionId]에서 가져오기
- selectedQuestionIds로 문제 로드
- Play 모드 컴포넌트 재사용
- 동일한 UX: QuestionCard, ProgressBar, Navigation
- 결과에 주제/난이도 분석 표시

// 3. 문제 선택 로직
// app/api/train/route.ts
async function selectQuestions(config) {
  const allQuestions = await storage.getAllQuestions({
    topics: config.topics,
    difficulties: config.difficulties,
    sourceSetIds: config.sourceSetIds
  })
  
  // 셔플 후 N개 선택
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, config.questionCount)
}

// 4. 결과 분석
// components/train/TrainingResults.tsx
- 전체 점수
- 주제별 정확도 차트
- 난이도별 정확도 차트
- 약점 주제 강조
- "약점 재연습" 버튼
```

**필요한 API 라우트:**
- [ ] `POST /api/train/route.ts`
- [ ] `GET /api/train/[id]/route.ts`
- [ ] `GET /api/questions/topics/route.ts`

### 5단계: 통계 대시보드 (향상 기능)
예상 시간: 4-6시간

**생성할 파일:**
1. `app/api/progress/all/route.ts` - 모든 진행 상황 조회
2. `app/api/questions/all/route.ts` - 모든 문제 조회 (주제/난이도 매핑용)
3. `components/stats/ScoreChart.tsx` - 점수 시각화
4. `components/stats/TopicBreakdown.tsx` - 주제별 분석
5. `components/stats/GoalTracker.tsx` - 70% 목표 진행 상황
6. `lib/scoring/analytics.ts` - 분석 계산 로직

**구현 단계:**
```typescript
// 1. 데이터 집계
// lib/scoring/analytics.ts
export function analyzeProgress(allProgress: UserProgress[], questions: Question[]) {
  // 세트별 계산
  const bySet = groupBySet(allProgress)
  
  // 주제별 계산
  const byTopic = calculateByTopic(allProgress, questions)
  
  // 난이도별 계산
  const byDifficulty = calculateByDifficulty(allProgress, questions)
  
  // 약점 영역 파악 (< 70%)
  const weakTopics = byTopic.filter(t => t.percentage < 70)
  
  // 전체 진행 상황
  const overall = calculateOverall(allProgress)
  
  return { bySet, byTopic, byDifficulty, weakTopics, overall }
}

// 2. 대시보드 페이지 구현
// app/(stats)/stats/page.tsx
- 모든 진행 기록 가져오기
- 주제/난이도 정보를 위한 모든 문제 가져오기
- 분석 실행
- 표시 내용:
  - 전체 점수 (큰 숫자로 강조)
  - 세트별 성과 테이블
  - 주제별 분석 차트
  - 난이도별 분석 차트
  - 약점 영역 알림
  - 각 약점에 대한 추천 트레이닝 버튼

// 3. 목표 추적 컴포넌트
// components/stats/GoalTracker.tsx
- 현재 전체 비율 표시
- 70%까지의 진행 표시줄
- 70% 미만 주제 목록
- 각 주제에 대한 "트레이닝 시작" 버튼
```

**필요한 API 라우트:**
- [ ] `GET /api/progress/all/route.ts`
- [ ] `GET /api/questions/all/route.ts`

## 추가 컴포넌트 구축

### 공유 컴포넌트
1. [x] `components/ui/Button.tsx` - 재사용 가능한 버튼
2. [x] `components/ui/Card.tsx` - 카드 래퍼
3. [ ] `components/ui/Modal.tsx` - 모달 다이얼로그
4. [ ] `components/ui/Loader.tsx` - 로딩 스피너
5. [ ] `components/ui/Toast.tsx` - 알림 토스트

### 유틸리티
1. [x] `lib/utils/clipboard.ts` - 클립보드에 문제 복사
2. [x] `lib/utils/keyboard.ts` - 키보드 단축키 핸들러
3. [x] `lib/utils/format.ts` - 날짜/시간 포맷팅
4. [ ] `lib/utils/validation.ts` - 클라이언트측 유효성 검사 헬퍼

## 테스트 체크리스트

### 단위 테스트
- [x] 스키마 유효성 검사 (모든 시나리오)
- [ ] 가져오기 형식 감지
- [ ] 잠금 보존과 함께 세트 복제
- [ ] 트레이닝 문제 무작위 선택
- [ ] 오답 자동 아카이브 (2-연속 규칙)
- [ ] 진행 상황 계산
- [ ] 주제/난이도 분석

### 통합 테스트
- [ ] 전체 가져오기 흐름 (A & B 형식)
- [ ] Play 모드: 답변, 저장, 재개
- [ ] 트레이닝: 구성, 생성, 완료
- [ ] 오답: 생성, 연습, 자동 아카이브
- [ ] 통계: 데이터 집계 정확성

### E2E 테스트 (선택사항)
- [ ] 사용자 여정: 가져오기 → 연습 → 오답
- [ ] 사용자 여정: 트레이닝 → 통계 확인
- [ ] 관리자: 관리 작업

## 환경 설정 체크리스트

- [ ] `.env.example`을 `.env`로 복사
- [ ] `ADMIN_KEY` 설정
- [ ] `npm install` 실행
- [ ] `npx prisma db push` 실행
- [ ] `npm run db:seed` 실행
- [ ] `npm run dev` 실행
- [ ] `http://localhost:3651`에서 테스트

## 배포 체크리스트

- [ ] Docker 이미지 빌드
- [ ] docker-compose 로컬 테스트
- [ ] NAS에 배포
- [ ] 데이터 영구성 확인
- [ ] 관리자 액세스 테스트
- [ ] 실제 문제 세트 가져오기
- [ ] 정기적으로 데이터베이스 백업

## 코드 스타일 가이드라인

1. **UI에 특수 문자 사용 금지**: 사용자 요구사항 - 이모지 피하고 텍스트 레이블 사용
2. **TypeScript strict 모드**: 모든 코드는 엄격한 검사를 통과해야 함
3. **오류 처리**: 항상 사용자 친화적인 오류 메시지 제공
4. **접근성**: 시맨틱 HTML, aria-labels, 키보드 네비게이션 사용
5. **모바일 우선**: Tailwind 반응형 클래스 (sm:, md:, lg:)

## 성능 최적화

1. **페이지네이션**: 대형 문제 세트 (>100 문제)
2. **캐싱**: React Query 또는 SWR로 API 응답 캐싱
3. **지연 로딩**: 이미지 및 코드 분할 라우트
4. **데이터베이스 인덱스**: Prisma 스키마에 이미 정의됨

## 보안 고려사항

1. **관리자 라우트**: 항상 ADMIN_KEY 확인
2. **입력 유효성 검사**: 모든 API 입력에 대한 서버측 검증
3. **SQL 인젝션**: Prisma가 자동으로 처리
4. **XSS 방지**: React가 자동으로 처리
5. **속도 제한**: API 라우트에 추가 고려

## MVP 이후 다음 단계

1. **내보내기 기능**: 세트를 JSON으로 다운로드
2. **문제 편집**: 잠금 해제된 세트의 제자리 편집
3. **사용자 계정**: 선택적 다중 사용자 지원
4. **소셜 기능**: 점수 공유, 리더보드
5. **모바일 앱**: React Native 버전
6. **분석 대시보드**: 상세한 차트 및 그래프
7. **AI 통합**: 문제 생성, 힌트 시스템
8. **오프라인 모드**: 서비스 워커를 사용한 PWA

## 도움 받기

참조:
- Next.js 문서: https://nextjs.org/docs
- Prisma 문서: https://www.prisma.io/docs
- Tailwind 문서: https://tailwindcss.com/docs
- Zod 문서: https://zod.dev

## 커밋 전략

권장 커밋 메시지 패턴:
```
feat: 관리자 가져오기 페이지 추가
feat: 네비게이션이 포함된 연습 모드 구현
feat: 오답노트 자동 아카이브 추가
fix: 진행 상황 저장 버그 수정
docs: README 업데이트
style: 코드 포맷팅 개선
refactor: 스토리지 레이어 리팩토링
test: 스키마 유효성 검사 테스트 추가
chore: 의존성 업데이트
```

## 마일스톤

### 마일스톤 1: 기본 MVP (완료)
- [x] 프로젝트 설정
- [x] 데이터 모델
- [x] 기본 UI
- [x] 가져오기 시스템
- [x] 연습 모드

### 마일스톤 2: 핵심 기능
- [ ] 진행 상황 저장
- [ ] 오답노트
- [ ] 자동 아카이브

### 마일스톤 3: 고급 기능
- [ ] 커스텀 트레이닝
- [ ] 통계 대시보드
- [ ] 약점 분석

### 마일스톤 4: 개선 및 배포
- [ ] 성능 최적화
- [ ] 모바일 최적화
- [ ] 프로덕션 배포
- [ ] 사용자 문서

## 개발 팁

### 빠른 개발을 위한 팁
1. Play 모드의 컴포넌트를 Train 및 Mistakes에서 최대한 재사용
2. Prisma Studio (`npm run db:studio`)로 데이터 확인
3. React DevTools로 상태 디버깅
4. Chrome DevTools의 Network 탭으로 API 호출 확인

### 디버깅
```typescript
// 개발 중 유용한 로깅
console.log('[DEBUG]', { variable })

// API 라우트에서
console.error('[API ERROR]', error)

// 클라이언트측에서
if (process.env.NODE_ENV === 'development') {
  console.log('[DEV]', data)
}
```

### 데이터베이스 작업
```bash
# 스키마 변경 후
npx prisma db push

# 데이터베이스 초기화
npx prisma db push --force-reset
npm run db:seed

# 마이그레이션 생성 (선택사항)
npx prisma migrate dev --name add_feature
```

## 문제 해결

### 일반적인 문제

**문제**: TypeScript 오류 "Cannot find module"
**해결**: `npm install` 재실행 또는 VSCode 재시작

**문제**: Prisma 클라이언트가 최신 스키마를 반영하지 않음
**해결**: `npx prisma generate` 실행

**문제**: Docker 컨테이너가 시작되지 않음
**해결**: `docker-compose logs`로 오류 확인

**문제**: 데이터베이스 잠금 오류
**해결**: Prisma Studio 종료 및 서버 재시작

---

**행운을 빕니다! 질문이 있으면 문서를 참조하거나 커뮤니티에 문의하세요.**
