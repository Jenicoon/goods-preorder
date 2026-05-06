# Firebase Setup Guide

이 프로젝트를 Firebase + 백엔드 API 구조로 옮길 때의 기준 가이드입니다.

## 1. Firebase 프로젝트 준비

- Firebase Console에서 프로젝트 생성
- Cloud Firestore 생성
- 리전 선택

## 2. Web App 등록

- `apps/storefront`
- `apps/admin-console`

위 두 프론트 앱을 각각 Firebase Web App으로 등록하고 `firebaseConfig`를 발급받습니다.

## 3. Firestore Rules 배포

이미 준비된 파일:

- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`

배포 명령:

```bash
firebase deploy --only firestore
```

## 4. 관리자 인증 방식

이 프로젝트의 관리자 로그인은 Firebase 이메일/비밀번호를 쓰지 않아도 됩니다.

권장 방식:

1. 프론트에서 관리자 비밀번호 입력
2. `services/backend/api/admin/login.js` 또는 `services/backend/api/super-admin/login.js` 호출
3. 백엔드가 비밀번호를 확인하고 HTTP-only 세션 쿠키 발급
4. 이후 관리자 API는 이 세션 쿠키를 검증

즉, Firebase Auth 대신 `백엔드 세션 + Firestore Admin SDK` 구조로 갈 수 있습니다.

## 5. Firestore 접근 위치

- 판매 페이지 공개 데이터 읽기: 프론트 또는 공개 API
- 관리자 주문/재고/삭제/복구: 반드시 백엔드 API

특히 아래 기능은 백엔드에서만 처리하는 것을 권장합니다.

- 주문 삭제
- 주문 복구
- 재고 수정
- 비밀번호 변경
- 전체 초기화

## 6. 환경변수

`services/backend/.env.example` 기준으로 다음 값을 Vercel Backend Project에 넣습니다.

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `PUBLIC_APP_ORIGIN`
- `ADMIN_ACCESS_PASSWORD`
- `SUPER_ADMIN_ACCESS_PASSWORD`
- `ADMIN_SESSION_SECRET`

## 7. 다음 구현 순서

1. backend Vercel 프로젝트 생성
2. 환경변수 등록
3. 로그인 API 배포
4. 프론트에서 `fetch(..., { credentials: "include" })`로 로그인 연결
5. `data.js`의 localStorage 로직을 Firestore API 호출로 교체
