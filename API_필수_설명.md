# 🔌 API 연결 필수 여부 설명

## ✅ 결론: API 연결이 **꼭 필요**합니다!

이 프로젝트는 **풀스택 애플리케이션**으로, 프론트엔드와 백엔드가 분리되어 있습니다.

---

## 📊 프로젝트 구조 분석

### 프론트엔드 (React)
- **역할**: 사용자 인터페이스 (UI)
- **데이터 저장**: 없음 (모든 데이터는 백엔드에서 가져옴)
- **API 호출**: 14개 파일에서 총 **58개의 API 호출** 사용

### 백엔드 (Express + SQLite)
- **역할**: 데이터베이스 관리, 비즈니스 로직, 인증
- **데이터 저장**: SQLite 데이터베이스
- **API 제공**: RESTful API 엔드포인트

---

## 🔍 API 사용 현황

### 주요 API 엔드포인트

1. **인증 (Auth)**
   - `POST /api/auth/login` - 로그인
   - `POST /api/auth/register` - 회원가입
   - `POST /api/auth/find-user-id` - 아이디 찾기
   - `POST /api/auth/reset-password` - 비밀번호 재설정

2. **프로젝트 (Projects)**
   - `GET /api/projects` - 프로젝트 목록
   - `POST /api/projects` - 프로젝트 생성
   - `PUT /api/projects/:id` - 프로젝트 수정
   - `DELETE /api/projects/:id` - 프로젝트 삭제

3. **지출 (Expenses)**
   - `GET /api/expenses` - 지출 목록
   - `POST /api/expenses/request` - 지출 요청
   - `PUT /api/expenses/:id` - 지출 수정
   - `DELETE /api/expenses/:id` - 지출 삭제

4. **승인 (Approvals)**
   - `GET /api/approvals` - 승인 목록
   - `POST /api/approvals/:id/approve` - 승인
   - `POST /api/approvals/:id/reject` - 반려

5. **골프대회 (Golf Tournaments)**
   - `GET /api/golf-tournaments` - 대회 목록
   - `POST /api/golf-tournaments` - 대회 생성
   - `GET /api/golf-tournaments/:id/scores` - 스코어 조회

6. **기타**
   - 참석자 관리, 후원 관리, 사용자 관리 등

---

## ⚠️ API 없이 작동하지 않는 기능

### 1. 로그인/회원가입
- ❌ API 없이: 불가능
- ✅ API 필요: 사용자 인증, JWT 토큰 발급

### 2. 데이터 조회
- ❌ API 없이: 불가능
- ✅ API 필요: 모든 데이터는 백엔드 데이터베이스에서 가져옴

### 3. 데이터 생성/수정/삭제
- ❌ API 없이: 불가능
- ✅ API 필요: 모든 CRUD 작업은 백엔드를 통해 수행

### 4. 파일 업로드
- ❌ API 없이: 불가능
- ✅ API 필요: 영수증 이미지 업로드

---

## 🎯 배포 시나리오

### 시나리오 1: 프론트엔드만 배포 (Netlify)
- ✅ 프론트엔드 페이지는 로드됨
- ❌ 로그인 불가능
- ❌ 데이터 조회 불가능
- ❌ 모든 기능 작동 안 함

### 시나리오 2: 프론트엔드 + 백엔드 모두 배포 (권장)
- ✅ 프론트엔드: Netlify
- ✅ 백엔드: Railway/Render
- ✅ 모든 기능 정상 작동

---

## 📋 API 연결이 필요한 이유

### 1. 데이터베이스 접근
- 프론트엔드는 데이터베이스에 직접 접근할 수 없음
- 모든 데이터는 백엔드 API를 통해 접근

### 2. 보안
- 인증/인가는 백엔드에서 처리
- JWT 토큰 검증
- 비밀번호 해싱

### 3. 비즈니스 로직
- 데이터 검증
- 승인 프로세스
- 통계 계산

### 4. 파일 처리
- 영수증 이미지 업로드
- 파일 저장 및 관리

---

## 🚀 올바른 배포 방법

### 방법 1: 분리 배포 (권장)
```
프론트엔드 (Netlify)
  ↓ API 요청
백엔드 (Railway/Render)
  ↓ 데이터 저장
SQLite 데이터베이스
```

### 방법 2: 단일 서버 배포
```
프론트엔드 + 백엔드 (Railway)
  ↓ 데이터 저장
SQLite 데이터베이스
```

---

## 💡 결론

**이 프로젝트는 API 연결이 필수입니다!**

- 프론트엔드만 배포하면 작동하지 않음
- 백엔드 API 서버가 반드시 필요
- 프론트엔드와 백엔드를 모두 배포해야 함

**추천 배포 방법:**
1. 백엔드: Railway에 배포
2. 프론트엔드: Netlify에 배포
3. 환경 변수: `VITE_API_URL`에 백엔드 URL 설정

---

## 📞 요약

| 항목 | 내용 |
|------|------|
| **API 필요 여부** | ✅ **필수** |
| **프론트엔드만 배포** | ❌ 작동 안 함 |
| **백엔드만 배포** | ⚠️ API는 작동하지만 UI 없음 |
| **둘 다 배포** | ✅ **정상 작동** |

**결론: 프론트엔드와 백엔드를 모두 배포해야 합니다!**

