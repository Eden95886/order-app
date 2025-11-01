# 커피 주문 앱 백엔드 서버

Express.js 기반 백엔드 서버입니다.

## 기술 스택
- Node.js
- Express.js
- PostgreSQL (예정)

## 설치

```bash
npm install
```

## 실행

### 개발 모드 (자동 재시작)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_order_db
DB_USER=postgres
DB_PASSWORD=your_password
```

`.env.example` 파일을 참고하세요.

## API 엔드포인트

서버가 실행되면 `http://localhost:3000`에서 접속할 수 있습니다.

### 기본 엔드포인트
- `GET /` - 서버 상태 확인

### 메뉴 관련 (예정)
- `GET /api/menus` - 메뉴 목록 조회
- `GET /api/menus/:menuId` - 메뉴 상세 조회

### 주문 관련 (예정)
- `POST /api/orders` - 주문 생성
- `GET /api/orders` - 주문 목록 조회
- `GET /api/orders/:orderId` - 주문 상세 조회
- `PATCH /api/orders/:orderId/status` - 주문 상태 변경

### 재고 관련 (예정)
- `GET /api/inventory` - 재고 현황 조회
- `PATCH /api/menus/:menuId/stock` - 재고 수량 변경

### 통계 관련 (예정)
- `GET /api/orders/stats` - 주문 통계 조회

