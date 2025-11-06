# 1. Node 기반 이미지 선택 (빌드 단계)
# better-sqlite3가 Node.js 20 이상을 요구하므로 node:20-alpine 사용
FROM node:20-alpine AS builder

# 2. 빌드 도구 설치 (better-sqlite3 네이티브 모듈 빌드에 필요)
RUN apk add --no-cache python3 make g++

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 프론트엔드 소스 복사
COPY frontend ./frontend

# 5. VITE_API_URL 환경 변수 설정 (빌드 시점에 주입)
# Railway에서 이 변수를 설정하면 빌드 시점에 사용됩니다.
# 기본값은 빌드 시점에 백엔드 URL을 알 수 없으므로, Railway 환경 변수에서 설정해야 합니다.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-/api}

# 6. 프론트엔드 의존성 설치 및 빌드
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps
RUN npx vite build

# 7. 백엔드 소스 복사
WORKDIR /app
COPY backend ./backend

# 8. 백엔드 의존성 설치
WORKDIR /app/backend
RUN npm ci --production

# 9. 실제 실행 환경
FROM node:20-alpine

# 10. 실행 환경에 필요한 최소한의 도구만 설치
RUN apk add --no-cache python3 make g++

# 11. 작업 디렉토리 설정
WORKDIR /app

# 12. 백엔드 파일 복사
COPY --from=builder /app/backend ./backend

# 13. 프론트엔드 빌드 결과 복사 (서버 코드의 경로에 맞춤)
COPY --from=builder /app/frontend/dist ./frontend/dist

# 14. 포트 오픈
EXPOSE 5000

# 15. 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=5000

# 16. 백엔드 서버 시작
WORKDIR /app/backend
CMD ["node", "server.js"]

