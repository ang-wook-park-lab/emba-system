# 🚂 Railway 무료 호스팅 배포 가이드

## Railway란?
- 무료 티어: $5 크레딧/월 (충분함)
- Node.js 완벽 지원
- SQLite 지원
- 자동 배포 (GitHub 연동)
- 간단한 설정

## 📋 배포 단계

### 1단계: GitHub에 프로젝트 업로드

```bash
# 프로젝트 디렉토리로 이동
cd kyungheewonwoo

# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Ready for Railway deployment"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### 2단계: Railway 계정 생성

1. https://railway.app 접속
2. "Start a New Project" 클릭
3. "Login with GitHub" 클릭
4. GitHub 계정으로 로그인

### 3단계: Railway에 프로젝트 배포

1. **새 프로젝트 생성**
   - Railway 대시보드에서 "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - GitHub 저장소 선택

2. **서비스 설정**
   - Railway가 자동으로 감지하지만, 수동 설정도 가능:
   - **Root Directory**: `backend` (또는 비워두기)
   - **Build Command**: (자동 감지 또는 비워두기)
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

4. **빌드 설정**
   - Settings → Build 탭
   - Build Command (선택사항):
     ```
     cd ../frontend && npm install && npm run build && cd ../backend && npm install --production
     ```
   - 또는 `backend/package.json`의 `postinstall` 스크립트 사용

### 4단계: 배포 확인

1. **배포 상태 확인**
   - Railway 대시보드에서 배포 진행 상황 확인
   - 로그 확인: Deployments → View Logs

2. **URL 확인**
   - 배포 완료 후 제공되는 URL 확인
   - 예: `https://your-app-name.up.railway.app`

3. **테스트**
   - 브라우저에서 `https://your-app-name.up.railway.app/api/health` 접속
   - 정상 응답 확인

### 5단계: 커스텀 도메인 설정 (선택사항)

1. Railway 대시보드 → Settings → Domains
2. "Generate Domain" 클릭
3. 또는 "Custom Domain" 추가

---

## 🔧 Railway 설정 파일

프로젝트에 다음 파일들이 생성되어 있습니다:

### `railway.json` (프로젝트 루트)
Railway 배포 설정

### `backend/nixpacks.toml`
빌드 설정 (프론트엔드 빌드 포함)

---

## ⚙️ 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 설정하세요:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `NODE_ENV` | `production` | 프로덕션 모드 |
| `PORT` | `5000` | 서버 포트 (Railway가 자동 설정) |
| `JWT_SECRET` | `your-secret-key` | JWT 비밀키 (변경 필수!) |
| `JWT_EXPIRE` | `7d` | JWT 만료 시간 |
| `FRONTEND_URL` | (선택) | 프론트엔드 URL (CORS용) |

---

## 📝 배포 체크리스트

### 배포 전
- [ ] GitHub에 프로젝트 업로드 완료
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `railway.json` 파일 확인
- [ ] `backend/nixpacks.toml` 파일 확인

### 배포 후
- [ ] Railway에서 배포 성공 확인
- [ ] 환경 변수 설정 확인
- [ ] `/api/health` 엔드포인트 테스트
- [ ] 프론트엔드 페이지 로드 확인
- [ ] 로그인 기능 테스트

---

## 🐛 문제 해결

### 배포 실패 시

1. **로그 확인**
   - Railway 대시보드 → Deployments → View Logs
   - 에러 메시지 확인

2. **일반적인 문제**
   - 빌드 명령어 오류: `nixpacks.toml` 확인
   - 환경 변수 누락: Variables 탭 확인
   - 포트 오류: Railway가 자동으로 `PORT` 환경 변수 설정

3. **데이터베이스 오류**
   - Railway는 영구 저장소를 제공하지 않을 수 있음
   - 데이터베이스 파일은 컨테이너 재시작 시 초기화될 수 있음
   - 해결: Railway Volume 추가 또는 외부 데이터베이스 사용

### 데이터베이스 영구 저장

Railway에서 Volume 추가:
1. Railway 대시보드 → Service → Volumes
2. "Add Volume" 클릭
3. Mount Path: `/app/data`
4. 환경 변수에 `DATABASE_PATH=/app/data/expense-management.db` 추가

---

## 💰 무료 티어 제한

- **크레딧**: $5/월
- **사용량**: 소규모 프로젝트에 충분
- **제한**: 
  - 일정 시간 비활성 시 슬립 모드
  - 트래픽 제한 (일반적으로 충분함)

---

## 🎉 배포 완료!

배포가 완료되면:
- Railway가 제공하는 URL로 접속
- 예: `https://your-app-name.up.railway.app`
- 모든 기능 정상 작동 확인

**Railway는 가장 간단하고 추천하는 무료 호스팅 서비스입니다!** 🚂

