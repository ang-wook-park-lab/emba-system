# 배포에 필요한 파일 목록

## 📦 필수 배포 파일

### Backend (백엔드)

#### 핵심 파일
```
backend/
├── server.js                    ⭐ 메인 서버 파일 (필수)
├── package.json                 ⭐ 의존성 정의 (필수)
├── package-lock.json            ⭐ 의존성 잠금 (필수)
└── .env                         ⚠️ 환경 변수 (생성 필요)
```

#### 디렉토리 구조
```
backend/
├── database/
│   └── db.js                    ✅ 데이터베이스 초기화
├── models/                      ✅ 데이터 모델 (8개 파일)
│   ├── User.js
│   ├── Project.js
│   ├── Expense.js
│   ├── Approval.js
│   ├── Sponsorship.js
│   ├── Participant.js
│   ├── GolfTournament.js
│   └── GolfScore.js
├── routes/                      ✅ API 라우트 (7개 파일)
│   ├── auth.js
│   ├── projects.js
│   ├── expenses.js
│   ├── approvals.js
│   ├── sponsorships.js
│   ├── participants.js
│   └── golf-tournaments.js
└── middleware/
    └── auth.js                  ✅ 인증 미들웨어
```

#### 자동 생성 디렉토리 (배포 시 생성됨)
```
backend/
├── data/                        ⚠️ 데이터베이스 파일 저장
│   └── expense-management.db
└── uploads/                     ⚠️ 업로드된 파일 저장
    └── receipts/
```

### Frontend (프론트엔드)

#### 빌드 전 (소스 파일)
```
frontend/
├── package.json                 ✅ 의존성 정의
├── package-lock.json            ✅ 의존성 잠금
├── vite.config.js               ✅ 빌드 설정
├── tailwind.config.js           ✅ Tailwind 설정
├── postcss.config.js            ✅ PostCSS 설정
└── src/                         ✅ 소스 코드
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   ├── Layout.jsx
    │   └── Sidebar.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx
    │   ├── Projects.jsx
    │   ├── Expenses.jsx
    │   ├── Approvals.jsx
    │   ├── Participants.jsx
    │   ├── Sponsorships.jsx
    │   ├── GolfTournaments.jsx
    │   └── ... (기타 페이지)
    ├── context/
    │   └── AuthContext.jsx
    └── utils/
        └── axios.js
```

#### 빌드 후 (배포 파일)
```
frontend/
└── dist/                        ⭐ 배포에 필요한 빌드 파일
    ├── index.html               ✅ 메인 HTML
    └── assets/
        ├── index-*.js           ✅ JavaScript 번들
        └── index-*.css          ✅ CSS 번들
```

### 설정 파일

```
kyungheewonwoo/
├── .gitignore                   ✅ Git 제외 파일 목록
├── DEPLOYMENT.md                ✅ 배포 가이드
├── DEPLOYMENT_CHECKLIST.md      ✅ 배포 체크리스트
└── README.md                    ✅ 프로젝트 설명
```

## 📋 배포 단계별 파일 체크리스트

### 1단계: 소스 파일 준비
- [x] `backend/` 디렉토리 전체
- [x] `frontend/src/` 디렉토리 전체
- [x] `frontend/package.json`
- [x] `frontend/vite.config.js`
- [x] `frontend/tailwind.config.js`
- [x] `frontend/postcss.config.js`

### 2단계: 빌드
- [ ] `frontend/dist/` 디렉토리 생성 (npm run build)
- [ ] 빌드 파일 확인 (index.html, assets/*)

### 3단계: 환경 설정
- [ ] `backend/.env` 파일 생성
- [ ] 환경 변수 설정 (PORT, JWT_SECRET 등)

### 4단계: 의존성 설치
- [ ] `backend/node_modules/` (npm install --production)
- [ ] `frontend/node_modules/` (npm install, 빌드용)

### 5단계: 런타임 디렉토리
- [ ] `backend/data/` 디렉토리 생성 (자동 생성됨)
- [ ] `backend/uploads/` 디렉토리 생성 (자동 생성됨)

## 🚀 최소 배포 파일 (프로덕션)

### 필수 파일만 포함한 최소 배포 패키지

```
kyungheewonwoo/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── database/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Expense.js
│   │   ├── Approval.js
│   │   ├── Sponsorship.js
│   │   ├── Participant.js
│   │   ├── GolfTournament.js
│   │   └── GolfScore.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── expenses.js
│   │   ├── approvals.js
│   │   ├── sponsorships.js
│   │   ├── participants.js
│   │   └── golf-tournaments.js
│   └── middleware/
│       └── auth.js
└── frontend/
    └── dist/
        ├── index.html
        └── assets/
            ├── index-*.js
            └── index-*.css
```

## 📊 파일 크기 정보

### 빌드 파일 크기
- `dist/assets/index-*.js`: ~1.2 MB (압축 전) / ~352 KB (gzip)
- `dist/assets/index-*.css`: ~22 KB (압축 전) / ~4.7 KB (gzip)
- `dist/index.html`: ~0.5 KB (압축 전) / ~0.35 KB (gzip)

### 총 배포 크기 (예상)
- Backend 소스: ~500 KB
- Frontend 빌드: ~1.2 MB
- node_modules (production): ~50-100 MB
- **총 예상 크기: ~52-102 MB**

## ⚠️ 배포 시 주의사항

### 제외해야 할 파일
- `node_modules/` (배포 서버에서 설치)
- `*.db`, `*.db-journal` (데이터베이스 파일, 별도 백업)
- `.env` (환경 변수, 별도 설정)
- `uploads/` (업로드 파일, 별도 관리)
- 개발 도구 파일 (`.vscode/`, `.idea/` 등)

### 포함해야 할 파일
- 모든 `.js` 소스 파일
- `package.json`, `package-lock.json`
- 빌드된 `dist/` 디렉토리
- 설정 파일 (`.env.example` 참고)

## 🔧 배포 명령어 요약

```bash
# 1. 프론트엔드 빌드
cd frontend
npm install
npm run build

# 2. 백엔드 의존성 설치
cd ../backend
npm install --production

# 3. 환경 변수 설정
# .env 파일 생성 및 설정

# 4. 서버 실행
NODE_ENV=production npm start
```

## ✅ 배포 확인

배포 후 다음을 확인하세요:
1. 서버가 정상적으로 시작되는지
2. `/api/health` 엔드포인트 응답 확인
3. 프론트엔드 페이지가 정상적으로 로드되는지
4. 데이터베이스 파일이 생성되는지
5. 파일 업로드가 정상 작동하는지

