# 커피 주문 앱 백엔드 서버

Express.js 기반 백엔드 서버입니다.

## 기술 스택
- Node.js
- Express.js
- PostgreSQL

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

## 데이터베이스 설정

### 1. 데이터베이스 초기화

`.env` 파일 설정 후 다음 명령어로 데이터베이스를 초기화하세요:

```bash
npm run db:init
```

이 명령어는 다음을 수행합니다:
- 데이터베이스 생성 (없는 경우)
- 테이블 스키마 생성
- 초기 메뉴 및 옵션 데이터 삽입

### 2. 수동 초기화

수동으로 초기화하려면:

```bash
# psql에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE coffee_order_db;

# 종료
\q

# 스키마 및 시드 실행
psql -U postgres -d coffee_order_db -f database/schema.sql
psql -U postgres -d coffee_order_db -f database/seed.sql
```

## API 엔드포인트

서버가 실행되면 `http://localhost:3000`에서 접속할 수 있습니다.

### 기본 엔드포인트
- `GET /` - 서버 상태 확인

### 메뉴 관련
- `GET /api/menus` - 메뉴 목록 조회
  - 쿼리 파라미터: `include_stock` (true/false) - 재고 정보 포함 여부
- `GET /api/menus/:menuId` - 메뉴 상세 조회
- `PATCH /api/menus/:menuId/stock` - 재고 수량 변경
  - 요청 본문: `{ "change": 1 }` (증가: 양수, 감소: 음수)

### 주문 관련
- `POST /api/orders` - 주문 생성
  - 요청 본문: `{ "items": [...], "total_price": 14000 }`
- `GET /api/orders` - 주문 목록 조회
  - 쿼리 파라미터: `status`, `limit`, `offset`
- `GET /api/orders/:orderId` - 주문 상세 조회
- `PATCH /api/orders/:orderId/status` - 주문 상태 변경
  - 요청 본문: `{ "status": "in_progress" }` (received, in_progress, completed)

### 재고 관련
- `GET /api/inventory` - 재고 현황 조회

### 통계 관련
- `GET /api/orders/stats` - 주문 통계 조회

