# Backend Service

이 폴더는 민감한 데이터를 숨겨야 하는 실제 서버 로직 전용입니다.

## 반드시 이쪽으로 옮겨야 하는 것

- 관리자 로그인 검증
- 슈퍼 관리자 로그인 검증
- 판매 페이지 입장 비밀번호 검증
- 상품 원본 데이터 저장
- 주문 생성
- 주문 확정
- 주문 삭제
- 재고 수정
- 수익 통계 계산
- DB 연결

## 추천 구현 방식

- Vercel Functions
- Supabase Edge Functions
- Express / Fastify / Next.js Route Handlers

## 권장 엔드포인트 예시

- `GET /api/public/catalog`
- `POST /api/public/orders/pending`
- `POST /api/public/orders/confirm`
- `POST /api/admin/login`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/inventory`
- `PATCH /api/admin/products/:id/stock`
- `POST /api/super-admin/login`
- `DELETE /api/super-admin/orders/:id`
- `POST /api/super-admin/reset-products`
