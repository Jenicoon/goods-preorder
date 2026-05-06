# Backend Service

`services/backend`는 관리자/슈퍼관리자 전용 비밀번호 검사와 Firebase Admin 기반 데이터 조작을 담당하는 백엔드 영역입니다.

이 구조에서는 프론트가 비밀번호를 "보여주는 용도"로만 쓰고, 실제 권한 판정은 백엔드가 맡습니다.

## 역할

- 관리자 비밀번호 로그인
- 슈퍼 관리자 비밀번호 로그인
- 세션 쿠키 발급 / 검증
- Firestore 상품 / 주문 / 재고 읽기
- 주문 삭제 / 복구 / 초기화 같은 민감 기능 처리

## 권장 흐름

1. 관리자 페이지에서 비밀번호 입력
2. `POST /api/admin/login` 또는 `POST /api/super-admin/login` 호출
3. 백엔드가 비밀번호를 확인하고 HTTP-only 세션 쿠키 발급
4. 이후 관리자 API는 이 세션 쿠키를 기준으로 권한 확인

## 포함된 엔드포인트 골격

- `GET /api/health`
- `POST /api/admin/login`
- `POST /api/super-admin/login`
- `POST /api/auth/logout`
- `GET /api/admin/session`

## 다음 단계

- Firestore 컬렉션 CRUD 엔드포인트 추가
- 관리자 프론트에서 `fetch(..., { credentials: "include" })`로 로그인 연결
- 주문/재고/삭제/복구 API를 이 세션 검증 함수에 연결
