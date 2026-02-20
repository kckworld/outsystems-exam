# 배포 가이드

OutSystems Exam Trainer를 Synology NAS에 자동 배포하는 상세 가이드입니다.

## 목차

1. [배포 방식 비교](#배포-방식-비교)
2. [수동 배포](#수동-배포)
3. [자동 배포 (Webhook)](#자동-배포-webhook)
4. [문제 해결](#문제-해결)

## 배포 방식 비교

### 수동 배포
- **장점**: 간단, 빠른 초기 설정
- **단점**: 매번 수동으로 배포해야 함
- **적합**: 테스트, 소규모 업데이트

### 자동 배포 (Webhook)
- **장점**: Git Push만으로 자동 배포, 롤백 가능, 로그 관리
- **단점**: 초기 설정 복잡
- **적합**: 프로덕션 환경, 자주 업데이트하는 경우

## 수동 배포

### 1. NAS 준비

```bash
# SSH로 NAS 접속
ssh admin@your-nas-ip

# 프로젝트 디렉토리 생성
sudo mkdir -p /volume1/docker/outsystems-exam
cd /volume1/docker/outsystems-exam

# 프로젝트 파일 복사 (Windows에서)
# 또는 Git에서 클론
sudo git clone https://github.com/your-username/outsystems-exam.git .
```

### 2. 환경 설정

```bash
# .env 파일 생성
sudo nano .env
```

내용:
```bash
ADMIN_KEY=your-production-secret-key
STORAGE_MODE=sqlite
DATABASE_URL=file:/app/data/prod.db
NODE_ENV=production
NEXT_PUBLIC_PASS_THRESHOLD=70
```

### 3. 배포

```bash
# Docker 이미지 빌드 및 실행
docker-compose build
docker-compose up -d

# 상태 확인
docker-compose ps
docker-compose logs -f
```

### 4. 접속

http://your-nas-ip:3651

## 자동 배포 (Webhook)

### 아키텍처

```
개발자 PC                     GitHub                    Synology NAS
    |                           |                           |
    | git push                  |                           |
    |-------------------------->|                           |
    |                           |                           |
    |                           | webhook trigger           |
    |                           |-------------------------->|
    |                           |                           |
    |                           |                     webhook-server.js
    |                           |                           |
    |                           |                     deploy.sh 실행
    |                           |                           |
    |                           |                     1. git pull
    |                           |                     2. docker build
    |                           |                     3. docker restart
    |                           |                           |
    |<--------------------------------------------------------------|
    |                    배포 완료                          |
```

### 사전 요구사항

- Synology NAS에 SSH 접근 권한
- Docker 설치 (Container Manager)
- Git 설치
- Node.js 설치 (webhook-server.js 사용 시)

### 1단계: Git 저장소 설정

#### 로컬에서 Git 초기화

```bash
cd d:\code\outsystems-exam

# Git 저장소 초기화
git init

# Git 사용자 정보 설정 (처음 사용하는 경우 필수)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# 파일 추가 및 커밋
git add .
git commit -m "Initial commit"

# GitHub에 저장소 생성 후 연결
git remote add origin https://github.com/your-username/outsystems-exam.git
git branch -M main
git push -u origin main
```

### 2단계: NAS에서 프로젝트 설정

```bash
# SSH로 NAS 접속
ssh admin@your-nas-ip

# 프로젝트 디렉토리 생성 및 클론
sudo mkdir -p /volume1/docker/outsystems-exam
cd /volume1/docker/outsystems-exam
sudo git clone https://github.com/your-username/outsystems-exam.git .

# 환경 변수 설정
sudo nano .env
```

`.env` 내용:
```bash
ADMIN_KEY=production-secret-key-change-this
STORAGE_MODE=sqlite
DATABASE_URL=file:/app/data/prod.db
NODE_ENV=production
NEXT_PUBLIC_PASS_THRESHOLD=70
```

### 3단계: 배포 스크립트 설정

배포 스크립트는 이미 프로젝트에 포함되어 있습니다:
- `deploy.sh` - 메인 배포 스크립트
- `webhook-server.js` - Node.js webhook 서버
- `hooks.json` - webhook 패키지 설정
- `webhook.service` - systemd 서비스 설정

#### 스크립트 권한 설정

```bash
cd /volume1/docker/outsystems-exam
sudo chmod +x deploy.sh
sudo chmod +x test-webhook.sh
```

#### Secret 키 변경

```bash
# hooks.json 편집
sudo nano hooks.json
# "secret" 필드를 강력한 랜덤 문자열로 변경

# 또는 webhook-server.js 사용 시
# 환경 변수로 설정 (권장)
```

### 4단계: Webhook 서버 설정

#### 방법 A: Node.js Webhook 서버 (권장)

```bash
# Node.js 설치 확인
node --version

# webhook 서버 시작 (테스트)
node webhook-server.js

# 백그라운드 실행
nohup node webhook-server.js > logs/webhook.log 2>&1 &

# 또는 systemd 서비스로 등록 (권장)
sudo cp webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable webhook.service
sudo systemctl start webhook.service

# 상태 확인
sudo systemctl status webhook.service
```

#### 방법 B: adnanh/webhook 패키지

```bash
# webhook 패키지 다운로드
cd /tmp
wget https://github.com/adnanh/webhook/releases/download/2.8.0/webhook-linux-amd64.tar.gz
tar -xzf webhook-linux-amd64.tar.gz
sudo mv webhook-linux-amd64/webhook /usr/local/bin/
sudo chmod +x /usr/local/bin/webhook

# webhook 실행
cd /volume1/docker/outsystems-exam
webhook -hooks hooks.json -port 9000 -verbose

# 백그라운드 실행
nohup webhook -hooks hooks.json -port 9000 -verbose > logs/webhook.log 2>&1 &
```

### 5단계: 방화벽 설정

```bash
# iptables로 포트 9000 허용
sudo iptables -I INPUT -p tcp --dport 9000 -j ACCEPT
sudo iptables-save

# 또는 Synology 제어판에서 설정
# 제어판 > 보안 > 방화벽 > 규칙 편집
# 포트 9000 허용 규칙 추가
```

### 6단계: GitHub Webhook 설정

1. GitHub 저장소 페이지로 이동
2. **Settings** > **Webhooks** > **Add webhook**
3. 설정:
   ```
   Payload URL: http://your-nas-ip:9000/webhook
   Content type: application/json
   Secret: [hooks.json의 secret과 동일]
   SSL verification: Enable (HTTPS 사용 시)
   Which events: Just the push event
   Active: 체크
   ```
4. **Add webhook** 클릭

### 7단계: 테스트

#### Webhook 서버 테스트

```bash
# Health check
curl http://localhost:9000/health

# Webhook 테스트 (로컬에서)
cd /volume1/docker/outsystems-exam
./test-webhook.sh http://your-nas-ip:9000/webhook your-secret-key
```

#### 실제 배포 테스트

```bash
# 로컬 개발 환경에서
cd d:\code\outsystems-exam
echo "# Test webhook" >> README.md
git add .
git commit -m "Test: webhook deployment"
git push origin main

# NAS에서 로그 확인
ssh admin@your-nas-ip
tail -f /volume1/docker/outsystems-exam/logs/webhook.log
tail -f /volume1/docker/outsystems-exam/logs/deploy-*.log
```

성공 시:
1. GitHub webhook이 트리거됨
2. NAS의 webhook 서버가 요청 수신
3. deploy.sh 자동 실행
4. Git pull → Docker build → Container restart
5. http://your-nas-ip:3651 에서 변경사항 확인

## 배포 흐름 상세

### deploy.sh가 하는 일

1. **로그 생성**: `logs/deploy-YYYYMMDD-HHMMSS.log`
2. **Git Pull**: 최신 코드 가져오기
3. **DB 백업**: `backups/prod-db-YYYYMMDD-HHMMSS.db` (최근 5개만 유지)
4. **컨테이너 중지**: `docker-compose down`
5. **이미지 빌드**: `docker-compose build --no-cache`
6. **컨테이너 시작**: `docker-compose up -d`
7. **Health Check**: HTTP 200 응답 확인
8. **정리**: 사용하지 않는 Docker 이미지 삭제, 오래된 로그 삭제

### 실패 시 롤백

```bash
# 최근 백업으로 복원
cd /volume1/docker/outsystems-exam
ls -lt backups/prod-db-*.db | head -1
sudo cp backups/prod-db-XXXXXXXX-XXXXXX.db data/prod.db

# 이전 Git 커밋으로 복원
git log --oneline
git reset --hard <commit-hash>
./deploy.sh
```

## 문제 해결

### Webhook이 트리거되지 않음

```bash
# 1. webhook 서버 실행 확인
ps aux | grep webhook
ps aux | grep node

# 2. 포트 확인
netstat -tulpn | grep 9000

# 3. 방화벽 확인
sudo iptables -L -n | grep 9000

# 4. 로그 확인
tail -f /volume1/docker/outsystems-exam/logs/webhook.log

# 5. GitHub webhook 설정 확인
# Settings > Webhooks > Recent Deliveries
# Response 탭에서 오류 확인
```

### 배포 실패

```bash
# 최신 배포 로그 확인
ls -lt /volume1/docker/outsystems-exam/logs/deploy-*.log | head -1 | xargs cat

# Docker 로그 확인
docker-compose logs -f

# 컨테이너 상태 확인
docker-compose ps

# 수동으로 각 단계 실행
cd /volume1/docker/outsystems-exam
git pull origin main
docker-compose build
docker-compose up -d
```

### Git Pull 권한 오류

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your-email@example.com"

# 공개 키 확인
cat ~/.ssh/id_ed25519.pub

# GitHub에 SSH 키 등록
# Settings > SSH and GPG keys > New SSH key
# 공개 키 전체 복사 붙여넣기

# Git 원격을 SSH로 변경
cd /volume1/docker/outsystems-exam
git remote set-url origin git@github.com:your-username/outsystems-exam.git

# 테스트
git pull origin main
```

### 포트 충돌

```bash
# 다른 포트 사용 (예: 9001)
# webhook-server.js
export WEBHOOK_PORT=9001
node webhook-server.js

# 또는 hooks.json 사용 시
webhook -hooks hooks.json -port 9001 -verbose

# GitHub webhook URL도 변경
# http://your-nas-ip:9001/webhook
```

### Docker 빌드 실패

```bash
# 디스크 공간 확인
df -h

# Docker 정리
docker system prune -a

# 수동 빌드로 오류 확인
cd /volume1/docker/outsystems-exam
docker-compose build --no-cache
```

## 모니터링

### 로그 위치

```
/volume1/docker/outsystems-exam/
├── logs/
│   ├── webhook.log          # Webhook 서버 로그
│   ├── webhook-error.log    # Webhook 에러 로그
│   └── deploy-*.log         # 배포 로그 (최근 10개)
└── backups/
    └── prod-db-*.db         # DB 백업 (최근 5개)
```

### 실시간 모니터링

```bash
# Webhook 로그
tail -f /volume1/docker/outsystems-exam/logs/webhook.log

# 최신 배포 로그
ls -lt /volume1/docker/outsystems-exam/logs/deploy-*.log | head -1 | xargs tail -f

# Docker 컨테이너 로그
docker-compose logs -f

# 시스템 리소스
htop
docker stats
```

## 보안 권장사항

1. **Secret 키 강화**: 긴 랜덤 문자열 사용
2. **HTTPS 사용**: Reverse Proxy (nginx) + Let's Encrypt
3. **IP 화이트리스트**: GitHub IP만 허용
4. **로그 모니터링**: 비정상적인 webhook 요청 감시
5. **정기 백업**: 데이터베이스 외부 백업

## 고급 설정

### Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name webhook.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /webhook {
        proxy_pass http://localhost:9000/webhook;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 슬랙 알림 추가

`deploy.sh` 끝에 추가:

```bash
# Slack notification
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"Deployment completed: OutSystems Exam Trainer\"}" \
  $SLACK_WEBHOOK
```

---

**문의사항이나 문제가 있으면 GitHub Issues에 등록해주세요.**
