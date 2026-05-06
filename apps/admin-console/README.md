# Admin Console App

관리자 및 슈퍼 관리자 전용 콘솔입니다.

## 포함 파일

- `index.html`
- `admin.html`
- `super-admin.html`
- `css/style.css`
- `js/data.js`
- `js/admin.js`
- `js/super-admin.js`
- `pic/*`

## Vercel 배포

1. Vercel에서 같은 GitHub 저장소를 다시 선택합니다.
2. Root Directory를 `apps/admin-console`로 지정합니다.
3. Deployment Protection을 켭니다.
4. 공개 판매 사이트와 다른 도메인 또는 서브도메인에 연결합니다.

## 주의

- 현재 콘솔도 정적 파일 기반 프로토타입입니다.
- 실제 운영 시에는 비밀번호, 권한 체크, 주문 삭제, 재고 변경을 반드시 백엔드에서 처리해야 합니다.
