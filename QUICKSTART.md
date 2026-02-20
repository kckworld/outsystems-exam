# 빠른 시작 가이드

이 가이드는 OutSystems Exam Trainer를 5분 안에 실행하는 방법을 안내합니다.

## 사전 요구사항

- Node.js 18+ 설치 ([다운로드](https://nodejs.org/))
- Git 설치 (선택사항)
- 코드 에디터 (VS Code 권장)

## 로컬 개발 환경 설정

### 1단계: 프로젝트 디렉토리로 이동

```bash
cd d:\code\outsystems-exam
```

### 2단계: 의존성 설치

```bash
npm install
```

Next.js, Prisma, Tailwind CSS 등 필요한 모든 패키지가 설치됩니다.

### 3단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
# 개발 환경
ADMIN_KEY=admin123
STORAGE_MODE=sqlite
DATABASE_URL=file:./data/dev.db
NODE_ENV=development
```

`.env.example` 파일을 템플릿으로 사용할 수 있습니다:

```bash
cp .env.example .env
```

### 4단계: 데이터베이스 초기화

```bash
npx prisma db push
```

SQLite 데이터베이스 파일을 생성하고 스키마를 설정합니다.

### 5단계: 샘플 데이터 로드 (선택사항)

```bash
npm run db:seed
```

`data/sample_questions.json`과 `data/sample_set.json`에서 샘플 문제를 로드합니다.

### 6단계: 개발 서버 실행

```bash
npm run dev
```

앱은 **http://localhost:3651** 에서 실행됩니다.

## 설정 후 첫 단계

### 1. 홈페이지 방문

http://localhost:3651 로 이동하면 다음 메뉴가 있는 메인 대시보드가 표시됩니다:
- Practice Mode (문제 풀이)
- Custom Training (커스텀 트레이닝)
- Mistake Notebook (오답노트)
- Statistics (통계)
- Admin Panel (관리자 패널)

### 2. 문제 가져오기 (관리자)

1. **http://localhost:3651/admin** 으로 이동
2. "Choose File" 클릭 후 `data/` 폴더에서 JSON 파일 선택
3. "Import" 클릭
4. 문제 세트가 준비 완료!

### 3. 문제 풀기 시작

1. **Practice Mode**로 이동
2. 문제 세트 선택
3. 다음 방법으로 문제 풀이:
   - 마우스 클릭
   - 키보드 단축키 (1-4: 답변 선택, 화살표: 네비게이션)
4. 진행 상황이 자동으로 저장됩니다

## 샘플 데이터 파일

`data/` 폴더에 예제 문제 파일이 있습니다:

- `sample_questions.json` - 5개의 개별 문제
- `sample_set.json` - 메타데이터가 포함된 완전한 세트 (3개 문제)

두 형식 모두 관리자 패널을 통해 가져올 수 있습니다.

## 일반적인 문제

### 포트 3651이 이미 사용 중

"Port 3651 is already in use" 메시지가 표시되면:

```bash
# 다른 포트 사용
npm run dev -- -p 3652
```

그런 다음 http://localhost:3652 로 접속

### 데이터베이스 잠금 오류

"database is locked" 오류가 발생하면:

1. 다른 프로세스가 데이터베이스에 접근하고 있지 않은지 확인
2. Prisma Studio가 실행 중이면 종료
3. 개발 서버 재시작

### 모듈을 찾을 수 없음

모듈 오류가 발생하면:

```bash
# node_modules 삭제 후 재설치
Remove-Item -Recurse -Force node_modules
npm install
```

## 다음 단계

- **문제 가져오기**: 관리자 패널을 사용하여 자신만의 문제 세트 업로드
- **구현 가이드 확인**: 기능 개발을 위해 `IMPLEMENTATION.md` 참조
- **API 탐색**: 사용 가능한 엔드포인트는 `app/api/` 확인
- **테스트 실행**: `npm test`로 모든 것이 작동하는지 확인

## 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 테스트 실행
npm test

# Prisma Studio 열기 (데이터베이스 GUI)
npm run db:studio

# 데이터베이스 리셋
npx prisma db push --force-reset

# 샘플 데이터 시드
npm run db:seed
```

## 프로덕션 배포

### 방법 1: 수동 배포

Synology NAS 또는 기타 Docker 호환 호스트에 수동 배포:

1. 프로덕션 설정으로 `.env` 구성
2. Docker 이미지 빌드: `docker-compose build`
3. 컨테이너 시작: `docker-compose up -d`
4. http://your-nas-ip:3651 에서 접속

### 방법 2: Git + Webhook 자동 배포 (권장)

Git에 Push하면 NAS에 자동으로 배포되도록 설정하는 방법입니다.

#### 1단계: Git 저장소 준비

```bash
# 프로젝트를 Git 저장소로 초기화
cd d:\code\outsystems-exam
git init

# Git 사용자 정보 설정 (처음 사용하는 경우)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# 또는 이 프로젝트에만 적용
# git config user.name "Your Name"
# git config user.email "your-email@example.com"

# 파일 추가 및 커밋
git add .
git commit -m "Initial commit"

# GitHub/GitLab에 저장소 생성 후 연결
git remote add origin https://github.com/your-username/outsystems-exam.git
git push -u origin main
```

#### 2단계: NAS에 프로젝트 디렉토리 생성

NAS에 SSH 접속 후:

```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /volume1/docker/outsystems-exam
cd /volume1/docker/outsystems-exam

# Git 저장소 클론
sudo git clone https://github.com/your-username/outsystems-exam.git .

# 환경 변수 설정
sudo nano .env
```

`.env` 파일 내용:
```bash
ADMIN_KEY=your-production-admin-key-here
STORAGE_MODE=sqlite
DATABASE_URL=file:/app/data/prod.db
NODE_ENV=production
NEXT_PUBLIC_PASS_THRESHOLD=70
```

#### 3단계: 배포 스크립트 작성

NAS에서 자동 배포 스크립트 생성:

```bash
# 배포 스크립트 생성
sudo nano /volume1/docker/outsystems-exam/deploy.sh
```

`deploy.sh` 내용:
```bash
#!/bin/bash

# 로그 디렉토리 생성
LOG_DIR="/volume1/docker/outsystems-exam/logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

echo "[$(date)] Starting deployment..." | tee -a $LOG_FILE

# 프로젝트 디렉토리로 이동
cd /volume1/docker/outsystems-exam

# Git Pull
echo "[$(date)] Pulling latest changes from Git..." | tee -a $LOG_FILE
git pull origin main >> $LOG_FILE 2>&1

if [ $? -ne 0 ]; then
    echo "[$(date)] Git pull failed!" | tee -a $LOG_FILE
    exit 1
fi

# Docker 컨테이너 중지 및 제거
echo "[$(date)] Stopping existing containers..." | tee -a $LOG_FILE
docker-compose down >> $LOG_FILE 2>&1

# Docker 이미지 재빌드
echo "[$(date)] Building Docker image..." | tee -a $LOG_FILE
docker-compose build --no-cache >> $LOG_FILE 2>&1

if [ $? -ne 0 ]; then
    echo "[$(date)] Docker build failed!" | tee -a $LOG_FILE
    exit 1
fi

# 컨테이너 시작
echo "[$(date)] Starting containers..." | tee -a $LOG_FILE
docker-compose up -d >> $LOG_FILE 2>&1

if [ $? -ne 0 ]; then
    echo "[$(date)] Container start failed!" | tee -a $LOG_FILE
    exit 1
fi

# 사용하지 않는 이미지 정리
echo "[$(date)] Cleaning up unused images..." | tee -a $LOG_FILE
docker image prune -f >> $LOG_FILE 2>&1

echo "[$(date)] Deployment completed successfully!" | tee -a $LOG_FILE

# 최근 10개 로그만 유지
cd $LOG_DIR
ls -t | tail -n +11 | xargs -r rm
```

실행 권한 부여:
```bash
sudo chmod +x /volume1/docker/outsystems-exam/deploy.sh
```

#### 4단계: Webhook 수신 서버 설정

##### 방법 A: webhook 패키지 사용 (간단)

```bash
# webhook 설치 (Go 기반)
sudo wget https://github.com/adnanh/webhook/releases/download/2.8.0/webhook-linux-amd64.tar.gz
sudo tar -xzf webhook-linux-amd64.tar.gz
sudo mv webhook-linux-amd64/webhook /usr/local/bin/
sudo chmod +x /usr/local/bin/webhook

# webhook 설정 파일 생성
sudo nano /volume1/docker/outsystems-exam/hooks.json
```

`hooks.json` 내용:
```json
[
  {
    "id": "deploy-outsystems-exam",
    "execute-command": "/volume1/docker/outsystems-exam/deploy.sh",
    "command-working-directory": "/volume1/docker/outsystems-exam",
    "response-message": "Deployment started",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hash-sha256",
            "secret": "your-webhook-secret-key",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
```

webhook 서비스 시작:
```bash
# webhook 실행 (백그라운드)
nohup webhook -hooks /volume1/docker/outsystems-exam/hooks.json -port 9000 -verbose > /volume1/docker/outsystems-exam/logs/webhook.log 2>&1 &

# 부팅 시 자동 시작 설정 (cron 사용)
sudo crontab -e
# 다음 줄 추가:
# @reboot /usr/local/bin/webhook -hooks /volume1/docker/outsystems-exam/hooks.json -port 9000 -verbose > /volume1/docker/outsystems-exam/logs/webhook.log 2>&1 &
```

##### 방법 B: Node.js 웹훅 서버 (커스터마이징 가능)

```bash
# 간단한 webhook 서버 생성
sudo nano /volume1/docker/outsystems-exam/webhook-server.js
```

`webhook-server.js` 내용:
```javascript
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 9000;
const SECRET = 'your-webhook-secret-key';
const DEPLOY_SCRIPT = '/volume1/docker/outsystems-exam/deploy.sh';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      // GitHub signature 검증
      const signature = req.headers['x-hub-signature-256'];
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.log('[WEBHOOK] Invalid signature');
        res.writeHead(401);
        res.end('Invalid signature');
        return;
      }
      
      const payload = JSON.parse(body);
      
      // main 브랜치에 push된 경우만 배포
      if (payload.ref === 'refs/heads/main') {
        console.log('[WEBHOOK] Deploying...');
        
        exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`[WEBHOOK] Deployment failed: ${error.message}`);
            return;
          }
          console.log(`[WEBHOOK] Deployment output: ${stdout}`);
        });
        
        res.writeHead(200);
        res.end('Deployment started');
      } else {
        res.writeHead(200);
        res.end('Skipped (not main branch)');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`[WEBHOOK] Server listening on port ${PORT}`);
});
```

webhook 서버 실행:
```bash
# Node.js가 설치되어 있어야 함
nohup node /volume1/docker/outsystems-exam/webhook-server.js > /volume1/docker/outsystems-exam/logs/webhook.log 2>&1 &
```

#### 5단계: 방화벽 설정

NAS 방화벽에서 webhook 포트(9000) 허용:

```bash
# Synology 방화벽 설정
# 제어판 > 보안 > 방화벽 > 규칙 편집
# 포트 9000 허용 규칙 추가
```

또는 SSH에서:
```bash
sudo iptables -A INPUT -p tcp --dport 9000 -j ACCEPT
sudo iptables-save
```

#### 6단계: GitHub Webhook 설정

1. GitHub 저장소 페이지에서 **Settings** > **Webhooks** > **Add webhook**
2. 설정:
   - **Payload URL**: `http://your-nas-ip:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: `your-webhook-secret-key` (hooks.json의 secret과 동일)
   - **Which events**: `Just the push event`
   - **Active**: 체크
3. **Add webhook** 클릭

#### 7단계: 테스트

```bash
# 로컬에서 변경사항 커밋 및 푸시
cd d:\code\outsystems-exam
echo "# Test" >> README.md
git add .
git commit -m "Test webhook deployment"
git push origin main

# NAS에서 로그 확인
# SSH로 NAS 접속 후
tail -f /volume1/docker/outsystems-exam/logs/webhook.log
tail -f /volume1/docker/outsystems-exam/logs/deploy-*.log
```

성공 시 자동으로:
1. Git에서 최신 코드 Pull
2. Docker 이미지 재빌드
3. 컨테이너 재시작
4. http://your-nas-ip:3651 에서 변경사항 확인 가능

#### 문제 해결

**Webhook이 트리거되지 않는 경우:**
```bash
# webhook 서버 상태 확인
ps aux | grep webhook

# 포트 확인
netstat -tulpn | grep 9000

# 로그 확인
tail -f /volume1/docker/outsystems-exam/logs/webhook.log
```

**배포 실패 시:**
```bash
# 최신 배포 로그 확인
ls -lt /volume1/docker/outsystems-exam/logs/deploy-*.log | head -1 | xargs cat

# Docker 상태 확인
docker-compose ps
docker-compose logs -f
```

**Git Pull 권한 오류:**
```bash
# SSH 키 생성 및 GitHub에 등록
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
# GitHub Settings > SSH and GPG keys에 추가
```

### 방법 3: GitLab CI/CD (고급)

GitLab을 사용하는 경우 `.gitlab-ci.yml` 파일로 더 강력한 CI/CD 구성 가능.

자세한 Docker 배포 지침은 `README.md` 참조.

## 지원

상세한 기능 문서는 다음을 참조하세요:
- `README.md` - 전체 프로젝트 문서
- `DEPLOYMENT.md` - 상세 배포 가이드 (Git + Webhook 자동 배포 포함)
- `IMPLEMENTATION.md` - 개발 가이드
- `prisma/schema.prisma` - 데이터베이스 스키마
- `lib/schema/index.ts` - 데이터 유효성 검사 규칙

## 파일 구조 개요

```
outsystems-exam/
├── app/                    # Next.js 페이지
│   ├── (admin)/           # 관리자 인터페이스
│   ├── (play)/            # 문제 풀이 모드
│   ├── (train)/           # 커스텀 트레이닝
│   ├── (mistakes)/        # 오답노트
│   └── api/               # API 엔드포인트
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── QuestionCard.tsx  # 문제 표시
│   └── ProgressBar.tsx   # 네비게이션
├── lib/                   # 비즈니스 로직
│   ├── schema/           # 유효성 검사
│   ├── storage/          # 데이터베이스 레이어
│   ├── scoring/          # 분석 로직
│   └── utils/            # 헬퍼 함수
├── data/                  # 샘플 문제
├── prisma/               # 데이터베이스 스키마
└── tests/                # 단위 테스트
```

즐거운 학습 되세요!
