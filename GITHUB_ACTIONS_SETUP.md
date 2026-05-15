# GitHub Actions 배포 설정 가이드

## 1️⃣ Docker Hub 준비

Docker Hub 계정이 필요합니다 (없으면 [docker.com](https://docker.com) 회원가입)

```bash
# 로컬에서 테스트 (선택사항)
docker login
docker build -t kck9010/outsystems-exam:latest .
docker push kck9010/outsystems-exam:latest
```

---

## 2️⃣ SSH 키 생성 (로컬에서)

NAS와 보안 통신을 위한 SSH 키를 생성합니다:

### Windows PowerShell:
```powershell
# SSH 키 생성 (Ed25519)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# 공개키 확인
cat ~/.ssh/id_ed25519.pub
```

### macOS/Linux:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519
```

---

## 3️⃣ NAS 설정

### A. SSH 공개키 등록 (NAS)

NAS에 SSH로 접속:
```bash
ssh admin@192.168.1.100
# 또는 Cloudflare Zero Trust를 사용하면:
ssh ssh.kckworld.com
```

공개키를 NAS에 등록:
```bash
# NAS에서
cat >> ~/.ssh/authorized_keys << 'EOF'
[여기에 id_ed25519.pub 내용 붙여넣기]
EOF

chmod 600 ~/.ssh/authorized_keys
```

### B. docker-compose 경로 확인

```bash
# NAS에서
which docker-compose
# 또는
/usr/local/bin/docker-compose --version
```

---

## 4️⃣ GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

### 필수 Secrets:

| Secret 이름 | 값 | 설명 |
|-----------|-----|------|
| `DOCKERHUB_USERNAME` | `kck9010` | Docker Hub 사용자명 |
| `DOCKERHUB_TOKEN` | `dckr_pat_xxxxx` | Docker Hub Personal Access Token |
| `SSH_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...` | SSH 개인키 전체 (/id_ed25519 내용) |
| `NAS_USER` | `kck9010` | NAS SSH 사용자명 |
| `NAS_DEPLOY_PATH` | `/volume1/docker/outsystems-exam` | NAS 배포 경로 |

### 각 Secret 생성 방법:

#### 1. DOCKERHUB_USERNAME & DOCKERHUB_TOKEN
```bash
# Docker Hub의 Personal Access Token 생성:
# https://hub.docker.com/settings/security
# - Token은 "Read & Write" 권한 필요
# - 생성된 토큰 전체를 Secret에 저장
```

#### 2. SSH_PRIVATE_KEY
```bash
# Windows PowerShell:
$key = Get-Content ~/.ssh/id_ed25519 -Raw
$key | Set-Clipboard

# macOS/Linux:
cat ~/.ssh/id_ed25519 | pbcopy
# 또는
cat ~/.ssh/id_ed25519 | xclip -selection clipboard
```

#### 3. NAS_USER & NAS_DEPLOY_PATH
```bash
# NAS에서 현재 배포 경로 확인:
pwd
# 또는 docker-compose.yml이 있는 경로 확인
```

---

## 5️⃣ NAS docker-compose.yml 설정

NAS의 배포 경로에 `docker-compose.yml` 필요:

```yaml
# /volume1/docker/outsystems-exam/docker-compose.yml
version: '3.8'

services:
  app:
    image: kck9010/outsystems-exam:latest
    ports:
      - "3651:3000"
    environment:
      - NODE_ENV=production
      - STORAGE_MODE=sqlite
      - DATABASE_URL=file:/app/data/prod.db
      - ADMIN_KEY=your-secure-admin-key-here
      - NEXT_PUBLIC_APP_NAME=OutSystems Exam Trainer
      - NEXT_PUBLIC_PASS_THRESHOLD=70
    volumes:
      - ./data:/app/data
      - ./prisma:/app/prisma
    restart: unless-stopped
```

---

## 6️⃣ Git에 푸시 및 배포

이제 모든 설정이 완료되었습니다. 배포하려면:

```bash
cd c:\Python\outsystems-exam

# 변경사항 스테이징
git add .github/

# 커밋
git commit -m "Add GitHub Actions deployment workflow"

# main 브랜치에 푸시
git push origin main
```

**배포 자동 시작!** 🚀

---

## 7️⃣ 배포 상태 확인

GitHub 저장소 → Actions → 최신 워크플로우 확인

```
✅ Build and push Docker image
✅ Pull and restart on NAS
```

---

## 🐛 문제 해결

### 1. "Unauthorized" 에러
- ✗ SSH_PRIVATE_KEY가 잘못됨
- ✓ 개인키 **전체** (BEGIN ~ END) 복사했는지 확인

### 2. "docker-compose not found"
- NAS에서 docker-compose 경로 확인:
  ```bash
  which docker-compose
  sudo find / -name docker-compose 2>/dev/null | head -5
  ```

### 3. "Connection refused"
- cloudflare SSH 터널 설정 확인
- NAS의 ~/.ssh/authorized_keys에 공개키 있는지 확인

### 4. Docker 이미지 빌드 실패
- `docker-compose.yml` 문법 확인
- `Dockerfile` 확인

---

## 📚 참고

- [GitHub Actions 문서](https://docs.github.com/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [cloudflared SSH](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/agentless/ssh/)
