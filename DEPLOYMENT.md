# 배포 가이드

## 배포 전 준비사항

### 1. 환경 변수 설정
`.env` 파일을 `backend` 디렉토리에 생성하세요:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### 2. 프론트엔드 빌드
```bash
cd frontend
npm install
npm run build
```

### 3. 백엔드 의존성 설치
```bash
cd backend
npm install
```

## 배포에 필요한 파일 목록

### 필수 파일 및 디렉토리

#### Backend
```
backend/
├── server.js                    # 메인 서버 파일
├── package.json                 # 의존성 정의
├── package-lock.json            # 의존성 잠금 파일
├── .env                         # 환경 변수 (생성 필요)
├── database/
│   └── db.js                    # 데이터베이스 설정
├── models/                      # 데이터 모델
│   ├── User.js
│   ├── Project.js
│   ├── Expense.js
│   ├── Approval.js
│   ├── Sponsorship.js
│   ├── Participant.js
│   ├── GolfTournament.js
│   └── GolfScore.js
├── routes/                      # API 라우트
│   ├── auth.js
│   ├── projects.js
│   ├── expenses.js
│   ├── approvals.js
│   ├── sponsorships.js
│   ├── participants.js
│   └── golf-tournaments.js
├── middleware/
│   └── auth.js                  # 인증 미들웨어
├── data/                        # 데이터베이스 파일 (자동 생성)
│   └── expense-management.db
└── uploads/                     # 업로드된 파일 (자동 생성)
    └── receipts/
```

#### Frontend (빌드 후)
```
frontend/
└── dist/                        # 빌드된 파일
    ├── index.html
    └── assets/
        ├── index-*.js
        └── index-*.css
```

### 선택적 파일
```
backend/
├── scripts/                     # 유틸리티 스크립트
│   ├── create_admin.js
│   └── reset_admin_password.js
└── README.md
```

## 배포 방법

### 방법 1: 단일 서버 배포 (권장)

1. **프로젝트 업로드**
   - 전체 `kyungheewonwoo` 디렉토리를 서버에 업로드

2. **의존성 설치**
   ```bash
   cd kyungheewonwoo/backend
   npm install --production
   
   cd ../frontend
   npm install
   npm run build
   ```

3. **환경 변수 설정**
   ```bash
   cd ../backend
   # .env 파일 생성 및 설정
   ```

4. **서버 실행**
   ```bash
   NODE_ENV=production npm start
   ```

### 방법 2: PM2를 사용한 배포

1. **PM2 설치**
   ```bash
   npm install -g pm2
   ```

2. **PM2로 서버 실행**
   ```bash
   cd kyungheewonwoo/backend
   NODE_ENV=production pm2 start server.js --name "emba-backend"
   ```

3. **PM2 설정 저장**
   ```bash
   pm2 save
   pm2 startup
   ```

### 방법 3: Docker를 사용한 배포

1. **Dockerfile 생성** (backend/Dockerfile)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY backend/package*.json ./
   RUN npm install --production
   COPY backend/ ./
   COPY frontend/dist ./../frontend/dist
   EXPOSE 5000
   CMD ["node", "server.js"]
   ```

2. **빌드 및 실행**
   ```bash
   docker build -t emba-app .
   docker run -p 5000:5000 --env-file backend/.env emba-app
   ```

## 배포 후 확인사항

1. **서버 상태 확인**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **데이터베이스 확인**
   - `backend/data/expense-management.db` 파일이 생성되었는지 확인
   - 관리자 계정이 생성되었는지 확인

3. **파일 업로드 권한**
   - `backend/uploads` 디렉토리에 쓰기 권한이 있는지 확인

## 주의사항

1. **데이터베이스 백업**
   - 배포 전 `expense-management.db` 파일을 백업하세요

2. **환경 변수 보안**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - 프로덕션 환경에서는 강력한 `JWT_SECRET`을 사용하세요

3. **포트 설정**
   - 방화벽에서 포트 5000 (또는 설정한 포트)을 열어야 합니다

4. **HTTPS 설정**
   - 프로덕션 환경에서는 Nginx나 Apache를 사용하여 HTTPS를 설정하는 것을 권장합니다

## 문제 해결

### 데이터베이스 오류
- `backend/data` 디렉토리에 쓰기 권한이 있는지 확인
- SQLite 데이터베이스 파일이 손상되지 않았는지 확인

### 빌드 오류
- Node.js 버전이 18 이상인지 확인
- `npm install`이 정상적으로 완료되었는지 확인

### 포트 충돌
- 다른 프로세스가 포트 5000을 사용 중인지 확인
- `.env` 파일에서 다른 포트로 변경

