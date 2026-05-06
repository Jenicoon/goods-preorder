# Storefront App

공개 배포용 굿즈 판매 사이트입니다.

## 포함 파일

- `index.html`
- `css/style.css`
- `js/data.js`
- `js/main.js`
- `pic/*`

## Vercel 배포

1. Vercel에서 같은 GitHub 저장소를 선택합니다.
2. Root Directory를 `apps/storefront`로 지정합니다.
3. 공개 도메인은 이 프로젝트에만 연결합니다.

## 주의

- 현재 `js/data.js`는 로컬 프로토타입 데이터 구조를 그대로 복사한 버전입니다.
- 실제 공개 배포 전에는 주문 생성, 재고 차감, 비밀번호 검증을 백엔드 API로 옮기는 것이 안전합니다.
