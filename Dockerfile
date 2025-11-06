# 1. Node 기반 이미지 선택 (빌드 단계)
FROM node:18-alpine AS builder

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 프론트엔드 소스 복사
COPY frontend ./frontend

# 4. VITE_API_URL 환경 변수 설정 (빌드 시점에 주입)
# Railway에서 이 변수를 설정하면 빌드 시점에 사용됩니다.
# 기본값은 빌드 시점에 백엔드 URL을 알 수 없으므로, Railway 환경 변수에서 설정해야 합니다.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-/api}

# 5. 프론트엔드 의존성 설치 및 빌드
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps
RUN npx vite build

# 6. 백엔드 소스 복사
WORKDIR /app
COPY backend ./backend

# 7. 백엔드 의존성 설치
WORKDIR /app/backend
RUN npm ci --production

# 8. 실제 실행 환경
FROM node:18-alpine

# 9. 작업 디렉토리 설정
WORKDIR /app

# 10. 백엔드 파일 복사
COPY --from=builder /app/backend ./backend

# 11. 프론트엔드 빌드 결과 복사 (서버 코드의 경로에 맞춤)
COPY --from=builder /app/frontend/dist ./frontend/dist

# 12. 포트 오픈
EXPOSE 5000

# 13. 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=5000

# 14. 백엔드 서버 시작
WORKDIR /app/backend
CMD ["node", "server.js"]

