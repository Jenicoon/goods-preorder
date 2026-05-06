# Deployment Structure

이 프로젝트는 로컬 프로토타입과 실제 배포 구조를 분리해서 운영하는 것을 권장합니다.

## 권장 배포 방식

1. 공개용 판매 사이트:
`apps/storefront`

2. 비공개 관리자 사이트:
`apps/admin-console`

3. 민감한 데이터와 비밀번호 검증:
`services/backend`

4. 프론트와 백엔드가 공유하는 계약 문서:
`packages/shared`

## 왜 이렇게 나누는가

- `index.html`, `main.js` 같은 공개 프론트 파일은 배포되면 누구나 내려받을 수 있습니다.
- 관리자 페이지와 슈퍼 관리자 페이지는 공개 프로젝트에 포함하지 않는 편이 안전합니다.
- 비밀번호, 주문 생성, 수익 계산, 재고 수정, DB 키는 반드시 백엔드 또는 데이터베이스에 있어야 합니다.
- Vercel에서는 프로젝트마다 Root Directory를 다르게 지정할 수 있으므로, 같은 저장소에서도 공개용과 비공개용을 분리 배포할 수 있습니다.

## Vercel 설정 권장안

### 공개 프로젝트

- Project Name: `goods-storefront`
- Root Directory: `apps/storefront`
- 공개 도메인 연결

### 관리자 프로젝트

- Project Name: `goods-admin-console`
- Root Directory: `apps/admin-console`
- Deployment Protection 활성화
- 가능하면 private repository 또는 private team project 사용

### 백엔드 프로젝트

- Project Name: `goods-backend`
- Root Directory: `services/backend`
- Environment Variables 등록
- DB 연결 및 관리자 인증 처리

## 현재 루트 파일의 역할

현재 루트의 `index.html`, `admin.html`, `super-admin.html`, `js/data.js` 등은
로컬 프로토타입용입니다.

실제 배포를 시작할 때는:

- 공개용은 `apps/storefront`만 배포
- 관리자용은 `apps/admin-console`만 별도 보호 배포
- 민감 데이터는 `services/backend`로 이전

이 흐름으로 진행하는 것을 권장합니다.
