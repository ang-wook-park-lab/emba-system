# EMBA 8대 동문 관리시스템

프로젝트별 지출 관리 및 승인 워크플로우를 제공하는 웹 애플리케이션입니다.

## 주요 기능

- ✅ 프로젝트별 지출 관리
- ✅ 지출증빙(영수증) 업로드 및 관리
- ✅ 결제 승인 워크플로우 (요청 → 승인 → 완료)
- ✅ 프로젝트별 예산 설정
- ✅ 지출 통계 및 차트
- ✅ 카테고리별 분류 (식비, 교통비, 숙박비 등)
- ✅ 검색 및 필터 기능
- ✅ 다중 통화 지원 (KRW, USD, EUR, JPY)
- ✅ 사용자 인증/로그인
- ✅ 반응형 웹 디자인 (모바일/태블릿/데스크톱)

## 기술 스택

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Axios
- Recharts

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- JWT 인증
- Multer (파일 업로드)

## 설치 및 실행

### 사전 요구사항
- Node.js (v18 이상)
- MongoDB (로컬 또는 클라우드)

### 1. 프로젝트 클론 및 패키지 설치

```bash
# 프론트엔드 패키지 설치
cd frontend
npm install

# 백엔드 패키지 설치
cd ../backend
npm install
```

### 2. 환경 변수 설정

백엔드 디렉토리에 `.env` 파일을 생성하세요:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-management
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### 3. MongoDB 실행

로컬 MongoDB를 실행하거나 클라우드 MongoDB URI를 `.env`에 설정하세요.

### 4. 서버 실행

```bash
# 백엔드 서버 실행 (포트 5000)
cd backend
npm start

# 프론트엔드 개발 서버 실행 (포트 3000)
cd frontend
npm run dev
```

### 5. 브라우저에서 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

## 사용 방법

### 1. 회원가입/로그인
- 처음 사용하는 경우 회원가입을 진행합니다.
- 로그인 후 대시보드에서 승인된 결제 내역을 확인할 수 있습니다.

### 2. 프로젝트 생성
- "프로젝트 관리" 메뉴에서 새 프로젝트를 생성합니다.
- 프로젝트별 예산, 참석자, 승인자를 설정합니다.

### 3. 지출 요청
- "지출 요청" 버튼을 클릭하여 새로운 지출을 요청합니다.
- 프로젝트, 카테고리, 금액, 설명을 입력하고 영수증을 업로드합니다.

### 4. 승인 처리
- 승인 권한이 있는 사용자는 "승인 관리" 메뉴에서 대기 중인 요청을 승인/거절할 수 있습니다.
- 모든 승인자가 승인하면 지출이 자동으로 승인 완료 상태로 변경됩니다.

## 프로젝트 구조

```
kyungheewonwoo/
├── frontend/          # React 프론트엔드
│   ├── src/
│   │   ├── components/  # 재사용 가능한 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── context/     # Context API
│   │   └── utils/       # 유틸리티 함수
│   └── package.json
├── backend/           # Node.js 백엔드
│   ├── models/        # MongoDB 모델
│   ├── routes/        # API 라우트
│   ├── middleware/    # 미들웨어
│   ├── uploads/       # 업로드된 파일
│   └── server.js      # 서버 진입점
└── README.md
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 프로젝트
- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects/:id` - 프로젝트 상세
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제

### 지출
- `GET /api/expenses` - 지출 목록
- `GET /api/expenses/approved` - 승인된 지출 목록
- `POST /api/expenses/request` - 지출 요청
- `GET /api/expenses/:id` - 지출 상세
- `PUT /api/expenses/:id` - 지출 수정
- `DELETE /api/expenses/:id` - 지출 삭제

### 승인
- `GET /api/approvals/pending` - 승인 대기 목록
- `POST /api/approvals/:id/approve` - 지출 승인
- `POST /api/approvals/:id/reject` - 지출 거절

## 개발 예정 기능

- [ ] 영수증 OCR 기능
- [ ] 통장내역 엑셀 업로드 및 매칭
- [ ] 프로젝트별 참석자 및 물품 찬조 관리
- [ ] 월별/연도별 보고서 생성
- [ ] 데이터 내보내기 (Excel, PDF)
- [ ] 지출 통계 차트

## 라이선스

MIT License

