# 🌐 Netlify 배포 가이드

## Netlify란?
- 무료 정적 사이트 호스팅
- 프론트엔드 배포에 최적화
- 자동 배포 (GitHub 연동)
- CDN 제공
- 무료 SSL 인증서

## ⚠️ 중요 사항
Netlify는 정적 사이트 호스팅에 특화되어 있어, Express 백엔드 서버를 직접 호스팅할 수 없습니다.

**추천 방법:**
- **프론트엔드**: Netlify에 배포
- **백엔드**: Railway 또는 Render에 배포

---

## 🎯 방법 1: Netlify (프론트엔드) + Railway (백엔드)

### 1단계: 백엔드를 Railway에 배포

1. **Railway 배포** (이전 가이드 참고)
   - Railway에 백엔드 배포
   - 배포 URL 확인: `https://your-backend.railway.app`

### 2단계: 프론트엔드 환경 변수 설정

`frontend/.env.production` 파일 생성:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

또는 Netlify 대시보드에서 환경 변수 설정:
- `VITE_API_URL` = `https://your-backend.railway.app/api`

### 3단계: Netlify 설정 파일 생성

`netlify.toml` 파일 생성 (프로젝트 루트):
```toml
[build]
  base = "frontend"
  publish = "frontend/dist"
  command = "npm install && npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4단계: Netlify에 배포

#### 방법 A: GitHub 연동 (권장)

1. **GitHub에 프로젝트 업로드**
   ```bash
   git init
   git add .
   git commit -m "Ready for Netlify"
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Netlify 계정 생성**
   - https://app.netlify.com 접속
   - "Sign up" → GitHub로 로그인

3. **새 사이트 배포**
   - "Add new site" → "Import an existing project"
   - GitHub 저장소 선택
   - 빌드 설정:
     - **Base directory**: `frontend`
     - **Build command**: `npm install && npm run build`
     - **Publish directory**: `frontend/dist`

4. **환경 변수 설정**
   - Site settings → Environment variables
   - `VITE_API_URL` 추가: `https://your-backend.railway.app/api`

5. **배포**
   - "Deploy site" 클릭
   - 자동 배포 완료

#### 방법 B: 드래그 앤 드롭

1. **프론트엔드 빌드**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Netlify에 업로드**
   - https://app.netlify.com 접속
   - "Add new site" → "Deploy manually"
   - `frontend/dist` 폴더를 드래그 앤 드롭

---

## 🎯 방법 2: Netlify Functions 사용 (고급)

Netlify Functions를 사용하여 백엔드를 서버리스 함수로 변환할 수 있지만, 이는 Express 앱을 크게 수정해야 합니다.

### 1단계: Netlify Functions 설정

`netlify/functions/api.js` 파일 생성:
```javascript
// Express 앱을 Netlify Function으로 래핑
import serverless from 'serverless-http'
import app from '../../backend/server.js'

export const handler = serverless(app)
```

### 2단계: netlify.toml 수정
```toml
[build]
  base = "."
  publish = "frontend/dist"
  command = "cd frontend && npm install && npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3단계: 의존성 추가
```bash
cd backend
npm install serverless-http
```

**주의**: 이 방법은 복잡하고 제한사항이 많으므로, 방법 1(분리 배포)을 권장합니다.

---

## 📋 Netlify 배포 단계별 가이드

### 방법 1: GitHub 연동 (가장 추천)

#### 1단계: GitHub에 프로젝트 업로드
```bash
cd kyungheewonwoo
git init
git add .
git commit -m "Ready for Netlify deployment"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

#### 2단계: Netlify 계정 생성
1. https://app.netlify.com 접속
2. "Sign up" 클릭
3. GitHub로 로그인

#### 3단계: 새 사이트 배포
1. **"Add new site"** 클릭
2. **"Import an existing project"** 선택
3. **GitHub** 선택
4. 저장소 선택
5. **빌드 설정**:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`

#### 4단계: 환경 변수 설정
1. **Site settings** → **Environment variables**
2. 다음 변수 추가:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
   (백엔드 URL을 실제 Railway URL로 변경)

#### 5단계: 배포 확인
- "Deploy site" 클릭
- 배포 완료 후 제공되는 URL 확인
- 예: `https://your-app-name.netlify.app`

---

## 🔧 Netlify 설정 파일

### netlify.toml (프로젝트 루트)
```toml
[build]
  base = "frontend"
  publish = "frontend/dist"
  command = "npm install && npm run build"

[build.environment]
  NODE_VERSION = "18"

# SPA 라우팅 지원
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API 프록시 (백엔드가 다른 서버에 있는 경우)
# [[redirects]]
#   from = "/api/*"
#   to = "https://your-backend.railway.app/api/:splat"
#   status = 200
#   force = true
```

---

## 🌐 프론트엔드 API URL 설정

### 방법 1: 환경 변수 사용 (권장)

`frontend/src/utils/axios.js`는 이미 환경 변수를 지원합니다:
```javascript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

Netlify에서 환경 변수 설정:
- `VITE_API_URL` = `https://your-backend.railway.app/api`

### 방법 2: netlify.toml에서 리다이렉트 사용

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend.railway.app/api/:splat"
  status = 200
  force = true
```

그리고 `frontend/src/utils/axios.js` 수정:
```javascript
baseURL: '/api'  // 상대 경로 사용
```

---

## 📝 배포 체크리스트

### 배포 전
- [ ] 백엔드가 Railway/Render에 배포되어 있는지 확인
- [ ] 백엔드 URL 확인
- [ ] `netlify.toml` 파일 생성
- [ ] 프론트엔드 빌드 테스트 (`npm run build`)

### 배포 후
- [ ] Netlify 사이트가 정상적으로 로드되는지 확인
- [ ] 환경 변수 설정 확인
- [ ] API 연결 테스트
- [ ] 로그인 기능 테스트
- [ ] 모든 페이지 라우팅 테스트

---

## 🎨 커스텀 도메인 설정

1. **Netlify 대시보드**
   - Site settings → Domain management
   - "Add custom domain" 클릭
   - 도메인 입력

2. **DNS 설정**
   - 도메인 제공업체에서 DNS 레코드 추가:
     - Type: `CNAME`
     - Name: `@` 또는 `www`
     - Value: `your-site.netlify.app`

3. **SSL 인증서**
   - Netlify가 자동으로 SSL 인증서 발급
   - HTTPS 자동 활성화

---

## 🔍 문제 해결

### 빌드 실패
- Netlify 대시보드 → Deploys → Build log 확인
- Node.js 버전 확인 (18 이상)
- 의존성 설치 오류 확인

### API 연결 오류
- 환경 변수 `VITE_API_URL` 확인
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인

### 라우팅 오류
- `netlify.toml`의 redirects 설정 확인
- 모든 경로가 `/index.html`로 리다이렉트되는지 확인

---

## 🚀 빠른 배포 (Netlify)

### 3단계로 배포:

1. **백엔드 배포** (Railway)
   - Railway에 백엔드 배포
   - URL 확인: `https://your-backend.railway.app`

2. **프론트엔드 빌드**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Netlify에 배포**
   - Netlify 접속
   - `frontend/dist` 폴더 드래그 앤 드롭
   - 환경 변수 설정: `VITE_API_URL=https://your-backend.railway.app/api`

---

## 💡 추천 배포 구조

```
프론트엔드 (Netlify)
  ↓ API 요청
백엔드 (Railway)
  ↓ 데이터 저장
SQLite 데이터베이스
```

**장점:**
- Netlify: 빠른 CDN, 무료 SSL
- Railway: 안정적인 백엔드 호스팅
- 분리된 구조로 각각 독립적으로 스케일링 가능

---

## 📞 배포 후 확인

1. **프론트엔드 확인**
   - Netlify URL로 접속
   - 페이지가 정상적으로 로드되는지 확인

2. **API 연결 확인**
   - 브라우저 개발자 도구 → Network 탭
   - API 요청이 백엔드로 전송되는지 확인

3. **기능 테스트**
   - 로그인/회원가입
   - 모든 페이지 라우팅
   - 데이터 CRUD 작업

---

## 🎉 배포 완료!

배포가 완료되면:
- **프론트엔드**: `https://your-app.netlify.app`
- **백엔드**: `https://your-backend.railway.app`

두 URL 모두 정상 작동하는지 확인하세요!

