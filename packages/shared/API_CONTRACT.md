# API Contract

프론트와 백엔드가 공유할 최소 계약입니다.

## 인증 방식

- 관리자 / 슈퍼관리자 로그인은 이메일/비밀번호가 아닙니다.
- 비밀번호를 백엔드로 보내면, 백엔드가 검증 후 HTTP-only 세션 쿠키를 발급합니다.
- 이후 관리자 API 호출은 `credentials: "include"` 옵션으로 쿠키를 함께 보내야 합니다.

## Public

### `GET /api/public/catalog`

판매 페이지에서 상품 목록과 재고를 불러옵니다.

응답 예시:

```json
{
  "success": true,
  "products": []
}
```

### `POST /api/public/orders/pending`

확정 대기 주문을 생성합니다.

요청 예시:

```json
{
  "items": [
    {
      "productId": "product-carabiner",
      "size": "별",
      "quantity": 2
    }
  ]
}
```

### `POST /api/public/orders/confirm`

확정 대기 주문을 확정 주문으로 전환합니다.

요청 예시:

```json
{
  "pendingOrderId": "order-123",
  "adminCode": "123456"
}
```

## Auth

### `POST /api/admin/login`

관리자 비밀번호를 확인하고 세션 쿠키를 발급합니다.

요청:

```json
{
  "password": "admin-password"
}
```

응답:

```json
{
  "success": true,
  "role": "admin",
  "expiresAt": 1760000000000
}
```

### `POST /api/super-admin/login`

슈퍼 관리자 비밀번호를 확인하고 세션 쿠키를 발급합니다.

### `GET /api/admin/session`

현재 브라우저가 로그인된 관리자 세션을 갖고 있는지 확인합니다.

### `POST /api/auth/logout`

관리자 세션 쿠키를 만료시킵니다.

## Admin

### `GET /api/admin/orders`

확정 대기 / 확정 주문 목록을 가져옵니다.

### `PATCH /api/admin/orders/:id/status`

처리 상태를 변경합니다.

### `GET /api/admin/inventory`

재고 현황을 가져옵니다.

## Super Admin

### `PATCH /api/super-admin/products/:id/stock`

특정 옵션의 재고를 변경합니다.

요청:

```json
{
  "size": "별",
  "remainingStock": 12
}
```

### `DELETE /api/super-admin/orders/:id`

확정 주문을 삭제 보관함으로 이동합니다.

### `POST /api/super-admin/orders/:id/restore`

삭제 보관함에서 주문을 복구합니다.

### `POST /api/super-admin/reset-products`

상품 데이터를 초기화합니다.
