# 🚀 GitHub를 사용한 배포 가이드

## 📋 전체 배포 프로세스

### 배포 구조
```
GitHub 저장소
  ├── 백엔드 → Railway 자동 배포
  └── 프론트엔드 → Netlify 자동 배포
```

---

## 1단계: GitHub에 프로젝트 업로드

### 1-1. Git 초기화 및 커밋

```bash
# 프로젝트 디렉토리로 이동
cd c:\kyunghee\kyungheewonwoo

# Git 초기화
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit: EMBA 8대 동문 관리시스템"
```

### 1-2. GitHub 저장소 생성

1. **GitHub 접속**
   - https://github.com 접속
   - 로그인 (계정이 없으면 회원가입)

2. **새 저장소 생성**
   - 우측 상단 "+" 클릭 → "New repository"
   - Repository name: `emba-management-system` (원하는 이름)
   - Description: (선택사항)
   - Public 또는 Private 선택
   - **"Initialize this repository with a README" 체크 해제** (이미 파일이 있으므로)
   - "Create repository" 클릭

### 1-3. GitHub에 푸시

```bash
# 원격 저장소 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/emba-management-system.git

# 브랜치 이름을 main으로 변경
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**주의**: GitHub 사용자명과 저장소 이름을 실제 값으로 변경하세요!

---

## 2단계: 백엔드 배포 (Railway)

### 2-1. Railway 계정 생성

1. **Railway 접속**
   - https://railway.app 접속
   - "Start a New Project" 클릭
   - "Login with GitHub" 클릭
   - GitHub 계정으로 로그인 (권한 승인)

### 2-2. Railway에 프로젝트 배포

1. **새 프로젝트 생성**
   - Railway 대시보드에서 "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - GitHub 저장소 선택 (`emba-management-system`)

2. **서비스 설정**
   - Railway가 자동으로 감지하지만, 수동 설정도 가능:
   - **Root Directory**: `backend` 선택
   - **Build Command**: (비워두거나 자동 감지)
   - **Start Command**: `npm start`

3. **환경 변수 설정**
   - Railway 대시보드 → Variables 탭 클릭
   - 다음 환경 변수 추가:
     ```
     NODE_ENV=production
     PORT=5000
     JWT_SECRET=강력한-비밀키-여기에-입력-변경필수
     JWT_EXPIRE=7d
     ```
   - ⚠️ **중요**: `JWT_SECRET`은 반드시 강력한 랜덤 문자열로 변경하세요!

4. **빌드 설정 확인**
   - Settings → Build 탭
   - Root Directory: `backend` 확인
   - Build Command: (비워두거나 자동 감지)
   - Start Command: `npm start` 확인

5. **배포 확인**
   - Railway가 자동으로 배포 시작
   - Deployments 탭에서 배포 진행 상황 확인
   - 배포 완료 후 제공되는 URL 확인
   - 예: `https://your-app-name.up.railway.app`

### 2-3. 백엔드 URL 확인

- Railway 대시보드 → Settings → Domains
- 제공된 URL 확인 (예: `https://emba-backend.up.railway.app`)
- 이 URL을 복사해두세요 (프론트엔드 설정에 필요)

---

## 3단계: 프론트엔드 배포 (Netlify)

### 3-1. Netlify 계정 생성

1. **Netlify 접속**
   - https://app.netlify.com 접속
   - "Sign up" 클릭
   - "Login with GitHub" 선택
   - GitHub 계정으로 로그인 (권한 승인)

### 3-2. Netlify에 프로젝트 배포

1. **새 사이트 배포**
   - Netlify 대시보드에서 "Add new site" 클릭
   - "Import an existing project" 선택
   - "Deploy with GitHub" 선택
   - GitHub 저장소 선택 (`emba-management-system`)

2. **빌드 설정**
   - **Base directory**: `frontend` 선택
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`

3. **환경 변수 설정**
   - "Show advanced" 클릭
   - "New variable" 클릭
   - 다음 환경 변수 추가:
     ```
     Key: VITE_API_URL
     Value: https://your-backend.railway.app/api
     ```
   - ⚠️ **중요**: `your-backend.railway.app`을 실제 Railway 백엔드 URL로 변경하세요!

4. **배포**
   - "Deploy site" 클릭
   - Netlify가 자동으로 빌드 및 배포 시작
   - 배포 완료 후 제공되는 URL 확인
   - 예: `https://your-app-name.netlify.app`

---

## 4단계: 배포 확인

### 4-1. 백엔드 확인

```bash
# 브라우저에서 접속
https://your-backend.railway.app/api/health

# 정상 응답 예시:
{
  "status": "OK",
  "message": "서버가 정상 작동 중입니다.",
  "database": "SQLite"
}
```

### 4-2. 프론트엔드 확인

1. **Netlify URL 접속**
   - 예: `https://your-app-name.netlify.app`
   - 페이지가 정상적으로 로드되는지 확인

2. **기능 테스트**
   - 로그인 페이지 접속
   - API 연결 확인 (브라우저 개발자 도구 → Network 탭)
   - 로그인 기능 테스트

---

## 5단계: 자동 배포 설정 (선택사항)

### 5-1. Railway 자동 배포

- **기본 설정**: GitHub에 푸시하면 자동 배포
- **설정 확인**: Railway 대시보드 → Settings → Source
- **브랜치**: `main` 브랜치에서 자동 배포

### 5-2. Netlify 자동 배포

- **기본 설정**: GitHub에 푸시하면 자동 배포
- **설정 확인**: Netlify 대시보드 → Site settings → Build & deploy
- **브랜치**: `main` 브랜치에서 자동 배포

---

## 🔄 코드 수정 후 재배포

### 자동 배포 (GitHub 사용 시)

1. **코드 수정**
   ```bash
   # 파일 수정 후
   git add .
   git commit -m "Update: 변경 사항 설명"
   git push origin main
   ```

2. **자동 배포**
   - Railway: 자동으로 백엔드 재배포
   - Netlify: 자동으로 프론트엔드 재배포
   - 각각의 대시보드에서 배포 진행 상황 확인

---

## 📝 배포 체크리스트

### GitHub 설정
- [ ] GitHub 계정 생성
- [ ] 새 저장소 생성
- [ ] 프로젝트 파일 푸시 완료

### 백엔드 배포 (Railway)
- [ ] Railway 계정 생성 (GitHub 연동)
- [ ] GitHub 저장소 연결
- [ ] Root Directory: `backend` 설정
- [ ] 환경 변수 설정:
  - [ ] `NODE_ENV=production`
  - [ ] `JWT_SECRET=강력한-비밀키`
  - [ ] `JWT_EXPIRE=7d`
- [ ] 배포 완료 확인
- [ ] 백엔드 URL 확인 및 저장

### 프론트엔드 배포 (Netlify)
- [ ] Netlify 계정 생성 (GitHub 연동)
- [ ] GitHub 저장소 연결
- [ ] Base directory: `frontend` 설정
- [ ] Build command: `npm install && npm run build` 설정
- [ ] Publish directory: `frontend/dist` 설정
- [ ] 환경 변수 설정: `VITE_API_URL=https://your-backend.railway.app/api`
- [ ] 배포 완료 확인

### 배포 후 확인
- [ ] 백엔드 Health Check 확인 (`/api/health`)
- [ ] 프론트엔드 페이지 로드 확인
- [ ] 로그인 기능 테스트
- [ ] API 연결 확인

---

## 🐛 문제 해결

### Railway 배포 실패

1. **로그 확인**
   - Railway 대시보드 → Deployments → View Logs
   - 에러 메시지 확인

2. **일반적인 문제**
   - Root Directory가 `backend`로 설정되었는지 확인
   - 환경 변수가 올바르게 설정되었는지 확인
   - `package.json`의 `start` 스크립트 확인

### Netlify 배포 실패

1. **로그 확인**
   - Netlify 대시보드 → Deploys → Build log
   - 에러 메시지 확인

2. **일반적인 문제**
   - Base directory가 `frontend`로 설정되었는지 확인
   - Build command가 올바른지 확인
   - 환경 변수 `VITE_API_URL`이 올바른지 확인

### API 연결 오류

1. **환경 변수 확인**
   - Netlify: `VITE_API_URL`이 백엔드 URL로 설정되었는지 확인
   - Railway: 백엔드 URL이 올바른지 확인

2. **CORS 오류**
   - 백엔드 `server.js`의 CORS 설정 확인
   - 프론트엔드 URL이 허용되었는지 확인

---

## 🎉 배포 완료!

배포가 완료되면:

- **프론트엔드**: `https://your-app-name.netlify.app`
- **백엔드**: `https://your-backend.railway.app`

### 다음 단계

1. **도메인 설정** (선택사항)
   - Netlify: Site settings → Domain management
   - Railway: Settings → Domains

2. **HTTPS 확인**
   - Netlify: 자동으로 HTTPS 제공
   - Railway: 자동으로 HTTPS 제공

3. **모니터링**
   - Railway: 대시보드에서 로그 확인
   - Netlify: 대시보드에서 배포 상태 확인

---

## 📞 요약

### GitHub 사용의 장점

1. **자동 배포**
   - 코드 푸시 시 자동 배포
   - 수동 작업 불필요

2. **버전 관리**
   - 코드 변경 이력 관리
   - 이전 버전으로 롤백 가능

3. **협업**
   - 여러 사람이 함께 작업 가능
   - Pull Request를 통한 코드 리뷰

4. **무료**
   - GitHub, Railway, Netlify 모두 무료 티어 제공

---

## 🚀 빠른 배포 명령어 요약

```bash
# 1. Git 초기화 및 커밋
cd c:\kyunghee\kyungheewonwoo
git init
git add .
git commit -m "Initial commit"

# 2. GitHub에 푸시
git remote add origin https://github.com/YOUR_USERNAME/emba-management-system.git
git branch -M main
git push -u origin main

# 3. Railway에서 배포 (웹 대시보드에서)
# - New Project → Deploy from GitHub repo
# - 저장소 선택 → Root Directory: backend
# - 환경 변수 설정

# 4. Netlify에서 배포 (웹 대시보드에서)
# - Add new site → Import from GitHub
# - 저장소 선택 → Base directory: frontend
# - 환경 변수: VITE_API_URL 설정
```

---

**GitHub를 사용하면 배포가 훨씬 간편하고 자동화됩니다!** 🎉

