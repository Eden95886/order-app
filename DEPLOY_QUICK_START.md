# Render.com 배포 빠른 시작 가이드

## 🚀 배포 순서 (3단계)

### 1️⃣ PostgreSQL 데이터베이스 생성 (먼저!)

1. Render.com → **New +** → **PostgreSQL**
2. 설정:
   - Name: `coffee-order-db`
   - Region: `Singapore` (또는 원하는 지역)
   - Plan: `Free`
3. **Create Database** 클릭
4. 연결 정보 복사 및 저장:
   - Internal Database URL (백엔드에서 사용)
   - Host, Port, Database, User, Password

---

### 2️⃣ 백엔드 서버 배포

#### GitHub에 코드 푸시 (필요 시)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/order-app.git
git push -u origin main
```

#### Render.com에서 Web Service 생성

1. **New +** → **Web Service**
2. GitHub 저장소 연결
3. 설정:
   - **Name**: `coffee-order-api`
   - **Root Directory**: `server` ⚠️ **중요!**
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run db:init`
   - **Start Command**: `npm start`

4. **Environment Variables** 추가:
   ```env
   NODE_ENV=production
   PORT=10000
   
   DB_HOST=dpg-xxxxx-a.singapore-postgres.render.com
   DB_PORT=5432
   DB_NAME=coffee_order_xxxx
   DB_USER=coffee_order_xxxx_user
   DB_PASSWORD=your_password_from_step_1
   ```

5. **Create Web Service** 클릭
6. 배포 완료 후 URL 확인: `https://coffee-order-api.onrender.com`

---

### 3️⃣ 프런트엔드 배포

#### 1. 환경 변수 파일 생성

`ui/.env.production` 파일 생성:
```env
VITE_API_URL=https://coffee-order-api.onrender.com
```
⚠️ 실제 배포한 백엔드 URL로 변경하세요!

#### 2. Render.com에서 Static Site 생성

1. **New +** → **Static Site**
2. 동일한 GitHub 저장소 연결
3. 설정:
   - **Name**: `coffee-order-app`
   - **Root Directory**: `ui` ⚠️ **중요!**
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables** (선택사항, Static Site는 제한적):
   ```env
   VITE_API_URL=https://coffee-order-api.onrender.com
   ```

5. **Create Static Site** 클릭
6. 배포 완료 후 URL 확인

---

## ✅ 배포 확인

### 백엔드 테스트
```bash
# 브라우저에서 접속
https://your-api-url.onrender.com/

# API 테스트
https://your-api-url.onrender.com/api/menus
```

### 프런트엔드 테스트
1. 프런트엔드 URL 접속
2. 메뉴가 표시되는지 확인
3. 주문 기능 테스트
4. 관리자 화면 테스트

---

## ⚠️ 주의사항

### Render.com 무료 플랜
- **Web Service**: 15분 비활성 시 sleep 상태 (첫 요청이 느림)
- **PostgreSQL**: 90일 미사용 시 삭제될 수 있음

### 데이터베이스 초기화
- 첫 배포 후 **Shell**에서 수동 실행:
  ```bash
  cd server
  npm run db:init
  ```
- 또는 Build Command에 포함: `npm install && npm run db:init`

---

## 🔧 문제 해결

### 데이터베이스 연결 실패
- Internal Database URL 사용 확인
- SSL 설정 확인 (코드에 자동 설정됨)
- 환경 변수 정확성 확인

### 프런트엔드 API 호출 실패
- `VITE_API_URL` 환경 변수 확인
- 백엔드 URL이 올바른지 확인
- CORS 설정 확인

---

## 📚 상세 가이드
더 자세한 내용은 `docs/DEPLOYMENT.md` 파일을 참고하세요.

