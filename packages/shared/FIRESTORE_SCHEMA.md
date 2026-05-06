# Firestore Schema

이 문서는 현재 `localStorage` 기반 구조를 Firebase Cloud Firestore로 옮길 때의 기준 스키마입니다.

공식 참고:
- Firestore quickstart: https://firebase.google.com/docs/firestore/quickstart
- Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Functions: https://firebase.google.com/docs/functions

## 권장 컬렉션

### `products/{productId}`

```json
{
  "id": "product-baseball-white",
  "name": "야구 유니폼 (WHITE)",
  "price": 40000,
  "imageUrl": "pic/야구화이트.png",
  "sizes": ["S", "M", "L", "XL", "2XL", "3XL"],
  "initialStock": {
    "S": 10
  },
  "remainingStock": {
    "S": 8
  },
  "soldOut": false,
  "updatedAt": "serverTimestamp()"
}
```

### `pendingOrders/{orderId}`

```json
{
  "id": "order-123",
  "buyerConfirmationCode": "482193",
  "randomCode": "120488",
  "status": "확정 대기",
  "totalQuantity": 3,
  "totalPrice": 98000,
  "items": [
    {
      "productId": "product-baseball-white",
      "productName": "야구 유니폼 (WHITE)",
      "size": "L",
      "quantity": 2,
      "unitPrice": 40000,
      "totalPrice": 80000
    }
  ],
  "createdAt": "serverTimestamp()"
}
```

### `orders/{orderId}`

```json
{
  "id": "order-123",
  "buyerConfirmationCode": "482193",
  "randomCode": "120488",
  "status": "처리 대기",
  "totalQuantity": 3,
  "totalPrice": 98000,
  "items": [],
  "createdAt": "serverTimestamp()"
}
```

### `deletedOrders/{orderId}`

```json
{
  "id": "order-123",
  "buyerConfirmationCode": "482193",
  "status": "처리 완료",
  "totalQuantity": 3,
  "totalPrice": 98000,
  "items": [],
  "createdAt": "serverTimestamp()",
  "deletedAt": "serverTimestamp()"
}
```

### `settings/shop`

```json
{
  "accountNumber": "신한은행 100-031-980976",
  "shopAccessPassword": "replace-with-server-side-auth",
  "adminPassword": "replace-with-auth",
  "superAdminPassword": "replace-with-auth",
  "updatedAt": "serverTimestamp()"
}
```

### `roles/{uid}`

```json
{
  "role": "admin"
}
```

허용 역할:
- `admin`
- `super_admin`

## 추천 처리 책임

클라이언트가 직접 해도 되는 것:
- 상품 목록 읽기
- 확정 대기 주문 생성

Cloud Functions로 옮기는 것을 권장하는 것:
- 관리자 확인 번호 검증
- 확정 대기 → 주문 확정 이동
- 확정된 주문 삭제/복구
- 재고 차감/복원
- 관리자/슈퍼관리자 권한 변경

## 왜 Functions를 권장하나

Firebase 공식 문서 기준으로, Cloud Functions는 클라이언트에 노출되면 안 되는 로직을 서버리스로 숨기는 데 적합합니다.
주문 확정, 삭제, 복구, 재고 수정 같은 로직은 프론트에서 직접 처리하지 않는 편이 안전합니다.
