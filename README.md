# OutSystems Exam Trainer

OutSystems Associate Developer O11 자격증 대비를 위한 종합 시험 연습 웹 애플리케이션입니다. 약점 주제를 파악하고 목표 점수 70% 이상 달성을 위한 체계적인 학습을 지원합니다.

## 주요 기능

- **문제은행 관리**: 버전 관리와 함께 문제 세트 가져오기, 검증 및 관리
- **연습 모드**: 
  - 전체 문제 세트로 정규 시험 연습
  - 커스텀 트레이닝 모드 (주제/난이도 필터링)
  - 스마트 아카이빙과 함께 자동 오답 추적
- **진행 상황 추적**: 세트, 주제, 난이도별 점수 추적
- **70% 목표 지원**: 약점 영역에 대한 명확한 가이드와 추천 연습
- **오답 자동 아카이빙**: 2번 연속 정답 시 해당 문제 마스터 처리

## 기술 스택

- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand
- **데이터베이스**: SQLite + Prisma (NAS 배포에 최적화)
- **유효성 검사**: Zod
- **배포**: Docker + docker-compose (Synology Container Manager 지원)

## 프로젝트 구조

```
outsystems-exam/
├── app/
│   ├── (admin)/admin/          # 문제 관리
│   ├── (play)/play/            # 정규 연습
│   ├── (train)/train/          # 커스텀 트레이닝
│   ├── (mistakes)/mistakes/    # 오답노트
│   ├── (stats)/stats/          # 성과 대시보드
│   └── api/                    # API 라우트
├── components/                 # 재사용 가능한 React 컴포넌트
├── lib/
│   ├── schema/                 # Zod 스키마
│   ├── storage/                # 데이터베이스 레이어
│   └── scoring/                # 분석 로직
├── prisma/                     # Prisma 스키마 및 마이그레이션
├── scripts/                    # 시드 및 유틸리티 스크립트
├── tests/                      # 단위 테스트
├── data/                       # 샘플 데이터
└── public/                     # 정적 자산
```

## 데이터 모델

### Question (문제)
```typescript
{
  id: string              // UUID 또는 OSAD-####
  topics: string[]        // 주제 배열
  difficulty: 1 | 2 | 3   // 난이도
  stem: string            // 문제 지문
  choices: string[]       // 4개의 선택지
  answer: number          // 정답 인덱스 (0-3)
  explanation: string     // 해설
  setId: string          // 소속 세트 ID
  createdAt: ISO string
}
```

### QuestionSet (문제 세트)
```typescript
{
  id: string
  name: string
  description: string
  tags: string[]
  createdAt: ISO string
  questionsCount: number
  isLocked: boolean        // 기본적으로 불변
}
```

### MistakeSnapshot (오답 스냅샷)
```typescript
{
  id: string
  userId: string
  sourceType: "set" | "train"
  sourceId: string
  createdAt: ISO string
  wrongQuestionIds: string[]
  correctStreak: { [questionId]: number }  // 2+ 시 자동 아카이브
  isArchived: boolean
  archivedAt?: ISO string
}
```

## 시작하기

### 개발 환경

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 설정에 맞게 수정
   ```

3. **데이터베이스 초기화**
   ```bash
   npx prisma db push
   ```

4. **샘플 데이터 시드 (선택사항)**
   ```bash
   npm run db:seed
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. `http://localhost:3651` 으로 접속

### 프로덕션 (Docker)

1. **환경 구성**
   ```bash
   # 프로덕션 설정으로 .env 파일 생성
   ADMIN_KEY=your-secure-admin-key
   STORAGE_MODE=sqlite
   DATABASE_URL=file:/app/data/prod.db
   ```

2. **빌드 및 실행**
   ```bash
   docker-compose up -d
   ```

3. **애플리케이션 접속**
   - 앱: `http://localhost:3651`
   - 관리자: `http://localhost:3651/admin`

### Synology NAS 배포

#### 방법 1: 수동 배포

1. **Container Manager 활성화** (Docker)
   - Package Center 열기
   - "Container Manager" 설치

2. **프로젝트 업로드**
   - 전체 `outsystems-exam` 폴더를 NAS에 복사
   - 예시 경로: `/volume1/docker/outsystems-exam`

3. **환경 구성**
   - `docker-compose.yml` 편집
   - environment 섹션에서 `ADMIN_KEY` 설정

4. **배포**
   ```bash
   # NAS에 SSH 접속
   cd /volume1/docker/outsystems-exam
   docker-compose up -d
   ```

5. **접속**
   - NAS IP 사용: `http://your-nas-ip:3651`

6. **영구 데이터**
   - 데이터베이스: `./data/prod.db`
   - 볼륨 자동 마운트됨

#### 방법 2: Git + Webhook 자동 배포 (권장)

Git에 Push하면 자동으로 NAS에 배포됩니다.

**프로젝트에 포함된 파일:**
- `deploy.sh` - 자동 배포 스크립트
- `hooks.json` - webhook 설정 (adnanh/webhook 사용)
- `webhook-server.js` - Node.js 기반 webhook 서버

**상세 설정 방법:**
`QUICKSTART.md`의 "프로덕션 배포 > 방법 2: Git + Webhook 자동 배포" 섹션 참조

**요약:**
1. Git 저장소에 코드 Push
2. NAS에서 webhook 서버 실행
3. GitHub/GitLab에서 webhook 설정
4. Push 시 자동으로 배포 실행

**장점:**
- 개발 환경에서 Push만 하면 자동 배포
- 배포 로그 자동 저장
- 데이터베이스 자동 백업
- 롤백 가능


## 가져오기 형식

### 형식 A: 완전한 세트
```json
{
  "setMeta": {
    "title": "연습 세트 1",
    "description": "기본 자격증 문제",
    "versionLabel": "v1.0"
  },
  "questions": [
    {
      "id": "OSAD-0001",
      "topic": "Client Variables",
      "difficulty": 2,
      "stem": "클라이언트 변수란 무엇인가?",
      "choices": ["옵션 A", "옵션 B", "옵션 C", "옵션 D"],
      "answer": "A",
      "explanation": "클라이언트 변수는 클라이언트측 데이터를 저장합니다...",
      "tags": ["기초", "변수"],
      "source": "공식 문서"
    }
  ]
}
```

### 형식 B: 문제만
```json
[
  {
    "id": "OSAD-0001",
    "topic": "Client Variables",
    "difficulty": 2,
    "stem": "클라이언트 변수란 무엇인가?",
    "choices": ["옵션 A", "옵션 B", "옵션 C", "옵션 D"],
    "answer": "A",
    "explanation": "클라이언트 변수는 클라이언트측 데이터를 저장합니다...",
    "tags": ["기초", "변수"],
    "source": "공식 문서"
  }
]
```
*참고: 형식 B는 업로드 후 UI를 통해 setMeta 입력이 필요합니다*

## 빌드 최적화

### 빠른 재배포 (1-2분)
일반적인 코드 변경 시:
```bash
cd /volume1/docker/outsystems-exam
git pull origin main
docker compose build        # 캐시 사용
docker compose up -d
```

### 자동 배포 시 캐시 사용
Webhook 배포는 기본적으로 캐시를 사용합니다 (빠름).

전체 재빌드가 필요한 경우만:
```bash
./deploy.sh --no-cache     # dependencies 변경 시에만
```

### 전체 재빌드가 필요한 경우
- `package.json` 변경 (새 라이브러리 설치)
- `Dockerfile` 변경
- 빌드 캐시 문제 발생 시

## API 참조

### 문제 세트
- `POST /api/sets/import` - 문제 세트 가져오기
- `GET /api/sets` - 모든 세트 목록 (쿼리: search, sortBy)
- `GET /api/sets/:id` - 세트 세부정보
- `DELETE /api/sets/:id` - 세트 삭제
- `POST /api/sets/:id/clone` - 새 버전으로 세트 복제
- `GET /api/sets/:id/export` - JSON으로 내보내기

### 진행 상황
- `POST /api/progress` - 진행 상황 저장
- `GET /api/progress?scope=&scopeId=` - 진행 상황 조회

### 트레이닝
- `POST /api/train` - 트레이닝 세션 생성
- `GET /api/train/:id` - 트레이닝 세션 조회

### 오답
- `POST /api/mistakes/snapshot` - 오답 스냅샷 생성
- `GET /api/mistakes` - 스냅샷 목록
- `GET /api/mistakes/:id` - 스냅샷 세부정보
- `POST /api/mistakes/:id/answer` - 답변 기록 (자동 아카이빙 처리)
- `DELETE /api/mistakes/:id` - 스냅샷 소프트 삭제

## 핵심 기능

### 가져오기 시스템
- **유연한 형식**: 완전한 세트와 문제만 있는 배열 모두 지원
- **유효성 검사**: 상세한 오류 메시지와 함께 포괄적인 스키마 검증
- **미리보기**: 문제 수, 주제 분포, 난이도 분석 표시
- **중복 감지**: 중복 문제 ID 방지

### 연습 모드 (Play Mode)
- 문제별 연습
- 해설과 함께 즉시 피드백
- 문제 네비게이션이 있는 진행 표시줄
- 특정 문제 번호로 점프
- 클립보드에 문제 복사 (ChatGPT 호환 형식)
- 자동 저장 진행 상황 (재로드 시 이어하기)

### 커스텀 트레이닝
- 주제별 필터링 (다중 선택)
- 난이도별 필터링
- 문제 수 설정 (기본값: 20)
- 소스 세트 선택
- 무작위 문제 선택
- 주제/난이도별 결과 분석

### 오답노트
- 세트/트레이닝 완료 후 자동으로 스냅샷 생성
- 스마트 추적: 문제별 correctStreak 카운터
- **자동 아카이브 규칙**: 2번 연속 정답 = 마스터
- 모든 문제 마스터 시 스냅샷 자동 아카이브
- 복원 옵션이 있는 소프트 삭제

### 통계 대시보드
- 세트별 성과
- 주제별 정확도
- 난이도별 정확도
- **70% 목표 추적**: 약점 영역 강조
- 추천 연습 제안

## 키보드 단축키

- `1-4`: 답변 선택 (A-D)
- `화살표 좌/우`: 이전/다음 문제
- `G`: 문제 번호 입력에 포커스 (문제로 점프)
- `R`: 재시작

## 유효성 검사 규칙

### 문제 스키마
- ID: 필수, 비어있지 않은 문자열
- Topics: 필수, 비어있지 않은 문자열 배열
- Difficulty: 1, 2, 또는 3
- Stem: 필수, 비어있지 않은 문자열
- Choices: 정확히 4개의 비어있지 않은 문자열
- Answer: 0-3 사이의 숫자
- Explanation: 필수, 비어있지 않은 문자열

### 가져오기 유효성 검사
- 모든 문제에 대한 스키마 준수
- 중복 문제 ID 없음 (세트 내 및 전역)
- 모든 필수 필드 존재
- 선택지 정확히 4개
- 유효한 답변 옵션 (0-3)

## 테스트

```bash
# 모든 테스트 실행
npm test

# 워치 모드
npm run test:watch
```

### 테스트 커버리지
- 스키마 유효성 검사 (통과/실패 케이스)
- 가져오기 형식 처리
- 잠금 보존과 함께 세트 복제
- 트레이닝 문제 추출
- 오답 자동 아카이브 (2-연속 규칙)

## 구현 우선순위 (MVP → 전체)

### 1단계: MVP (필수)
1. 데이터 모델 (Prisma 스키마)
2. 가져오기 API (/api/sets/import)
3. 연습 페이지 (/play)
4. 오답 추적 (/mistakes)
5. 기본 관리자 (/admin)

### 2단계: 확장 (향상)
1. 커스텀 트레이닝 (/train)
2. 통계 대시보드 (/stats)
3. 진행 상황 영구 저장
4. 스마트 필터링

### 3단계: 개선 (UX)
1. 키보드 단축키
2. 클립보드에 복사
3. 접근성 개선
4. 성능 최적화

## 환경 변수

```bash
# 저장소
STORAGE_MODE=sqlite                    # "sqlite" 또는 "json"
DATABASE_URL=file:./dev.db            # SQLite 데이터베이스 경로

# 보안
ADMIN_KEY=your-secret-key             # 관리자 라우트 보호

# 앱 설정
NEXT_PUBLIC_APP_NAME=OutSystems Exam Trainer
NEXT_PUBLIC_PASS_THRESHOLD=70         # 목표 합격 비율
```

## 문제 해결

### 데이터베이스 문제
```bash
# 데이터베이스 리셋
rm prisma/*.db
npx prisma db push

# 데이터베이스 보기
npm run db:studio
```

### Docker 문제
```bash
# 컨테이너 재빌드
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 로그 보기
docker-compose logs -f
```

### 가져오기 실패
- JSON 형식 유효성 확인
- 모든 필수 필드 존재 확인
- 선택지 배열이 정확히 4개인지 확인
- 중복 문제 ID 확인
- 응답의 유효성 검사 오류 세부정보 검토

## 저장소 선택: SQLite (권장)

**JSON 대신 SQLite를 사용하는 이유:**
1. **동시성**: 안전한 다중 사용자 액세스
2. **트랜잭션**: 데이터 무결성 보장
3. **쿼리**: 빠른 필터링/검색
4. **신뢰성**: 파일 손상 위험 없음
5. **NAS 친화적**: 단일 파일, 쉬운 백업

**JSON 대안**: 간단한 설정에 사용 가능하지만 다중 사용자 시나리오에는 견고성이 부족합니다.

## 기여

이것은 독립적인 트레이닝 애플리케이션입니다. 확장하려면:

1. 가져오기 데이터에 새 문제 주제 추가
2. `lib/scoring/`에서 채점 로직 사용자 정의
3. `/train`에 새 트레이닝 필터 추가
4. `/stats`에서 통계 계산 확장

## 라이선스

MIT

## 지원

OutSystems 자격증에 대한 문제나 질문:
- 공식 문서: https://www.outsystems.com/learn/
- 자격증 가이드: https://www.outsystems.com/learn/certifications/

프로젝트 문서:
- [QUICKSTART.md](QUICKSTART.md) - 빠른 시작 가이드
- [DEPLOYMENT.md](DEPLOYMENT.md) - 상세 배포 가이드
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - 개발 가이드

---

**OutSystems Associate Developer O11 자격증에서 70% 이상 달성하고 마스터하는 것을 돕기 위해 제작되었습니다.**
