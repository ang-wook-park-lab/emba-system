# 배포 체크리스트

## 반응형 웹 테스트 결과

### ✅ 반응형 디자인 확인
- Tailwind CSS의 반응형 클래스 사용 확인:
  - `md:` (768px 이상)
  - `lg:` (1024px 이상)
  - `sm:` (640px 이상)
  - `xl:` (1280px 이상)

### 주요 반응형 요소
1. **사이드바 (Sidebar)**
   - 모바일: `fixed left-0 top-0` (고정 위치)
   - 데스크톱: `md:relative` (상대 위치)
   - 반응형 클래스: `md:z-auto`, `md:relative`

2. **레이아웃 (Layout)**
   - 모바일: `flex-col` (세로 배치)
   - 데스크톱: `md:flex-row` (가로 배치)
   - 마진: `md:ml-0`

3. **그리드 레이아웃**
   - 여러 페이지에서 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` 사용
   - 모바일: 1열, 태블릿: 2열, 데스크톱: 3열

### 테스트 권장 사항
- 모바일 (375px): iPhone SE
- 태블릿 (768px): iPad
- 데스크톱 (1920px): Full HD

## 배포 파일 목록

### 필수 배포 파일

#### 1. Backend 파일
```
backend/
├── server.js                    ✅ 메인 서버 파일
├── package.json                 ✅ 의존성 정의
├── package-lock.json            ✅ 의존성 잠금
├── .env                         ⚠️ 생성 필요 (환경 변수)
├── database/
│   └── db.js                    ✅ 데이터베이스 설정
├── models/                      ✅ 모든 모델 파일
│   ├── User.js
│   ├── Project.js
│   ├── Expense.js
│   ├── Approval.js
│   ├── Sponsorship.js
│   ├── Participant.js
│   ├── GolfTournament.js
│   └── GolfScore.js
├── routes/                      ✅ 모든 라우트 파일
│   ├── auth.js
│   ├── projects.js
│   ├── expenses.js
│   ├── approvals.js
│   ├── sponsorships.js
│   ├── participants.js
│   └── golf-tournaments.js
├── middleware/
│   └── auth.js                  ✅ 인증 미들웨어
├── data/                        ⚠️ 자동 생성 (데이터베이스)
│   └── expense-management.db
└── uploads/                     ⚠️ 자동 생성 (업로드 파일)
    └── receipts/
```

#### 2. Frontend 빌드 파일
```
frontend/
└── dist/                        ✅ 빌드 후 생성
    ├── index.html
    └── assets/
        ├── index-*.js
        └── index-*.css
```

#### 3. 설정 파일
```
├── .gitignore                   ✅ Git 제외 파일
├── DEPLOYMENT.md                ✅ 배포 가이드
└── README.md                    ✅ 프로젝트 설명
```

### 배포 전 확인사항

#### ✅ 완료된 작업
- [x] 프론트엔드 빌드 성공
- [x] 백엔드 서버 프로덕션 모드 설정
- [x] 정적 파일 서빙 설정
- [x] SPA 라우팅 지원
- [x] 반응형 디자인 구현 확인
- [x] 환경 변수 설정 가이드 작성
- [x] 배포 가이드 작성

#### ⚠️ 배포 전 필수 작업
- [ ] `.env` 파일 생성 및 설정
- [ ] 데이터베이스 백업 (기존 데이터가 있는 경우)
- [ ] 포트 방화벽 설정
- [ ] HTTPS 설정 (프로덕션 권장)
- [ ] PM2 또는 프로세스 매니저 설정

### 배포 명령어

#### 1. 개발 환경에서 빌드 테스트
```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 프로덕션 모드로 서버 실행
cd ../backend
NODE_ENV=production npm start
```

#### 2. 프로덕션 배포
```bash
# 1. 의존성 설치
cd backend
npm install --production

cd ../frontend
npm install
npm run build

# 2. 환경 변수 설정
cd ../backend
# .env 파일 생성

# 3. 서버 실행
NODE_ENV=production npm start
```

### 파일 크기 정보
- `dist/assets/index-*.js`: ~1.2 MB (gzip: ~352 KB)
- `dist/assets/index-*.css`: ~22 KB (gzip: ~4.7 KB)
- `dist/index.html`: ~0.5 KB (gzip: ~0.35 KB)

### 성능 최적화 권장사항
- 큰 JavaScript 번들 (1.2MB)을 코드 스플리팅으로 분할 고려
- 동적 import() 사용 검토
- 빌드 옵션에서 manualChunks 설정 검토

## 배포 후 테스트 항목

### 기능 테스트
- [ ] 로그인/회원가입
- [ ] 프로젝트(행사) 관리
- [ ] 지출 관리
- [ ] 승인 관리
- [ ] 참석자 관리
- [ ] 후원 관리
- [ ] 골프대회 관리
- [ ] 엑셀 업로드/다운로드

### 반응형 테스트
- [ ] 모바일 (375px) 레이아웃
- [ ] 태블릿 (768px) 레이아웃
- [ ] 데스크톱 (1920px) 레이아웃
- [ ] 사이드바 반응형 동작
- [ ] 테이블 반응형 동작
- [ ] 모달 반응형 동작

### 성능 테스트
- [ ] 페이지 로딩 속도
- [ ] API 응답 시간
- [ ] 이미지 업로드/다운로드
- [ ] 엑셀 파일 처리

### 보안 테스트
- [ ] 인증/인가 확인
- [ ] 권한별 메뉴 접근 제어
- [ ] 파일 업로드 보안
- [ ] SQL Injection 방지

