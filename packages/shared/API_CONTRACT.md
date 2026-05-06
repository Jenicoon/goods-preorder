# API Contract

프론트와 백엔드가 공유할 최소 계약입니다.

## Public

### `GET /api/public/catalog`

응답 예시:

```json
{
  "products": [
    {
      "id": "product-carabiner",
      "name": "카라비너",
      "price": 9000,
      "imageUrl": "/pic/카라비너.png",
      "sizes": ["별", "사자(남색)", "사자(회색)", "사자(하늘색)"],
      "remainingStock": {
        "별": 30,
        "사자(남색)": 30,
        "사자(회색)": 30,
        "사자(하늘색)": 30
      },
      "soldOut": false
    }
  ]
}
```

### `POST /api/public/orders/pending`

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

요청 예시:

```json
{
  "pendingOrderId": "order-123",
  "adminCode": "123456"
}
```

## Admin

### `POST /api/admin/login`

요청:

```json
{
  "password": "admin-password"
}
```

### `GET /api/admin/orders`

응답:

```json
{
  "orders": []
}
```

### `PATCH /api/admin/products/:id/stock`

요청:

```json
{
  "size": "별",
  "remainingStock": 12
}
```
