# Render.com 배포 완벽 가이드

## 📋 배포 전 준비사항

- [ ] GitHub 계정 생성
- [ ] 코드를 GitHub에 푸시 완료
- [ ] Render.com 계정 생성 (https://render.com)

---

## 1️⃣ PostgreSQL 데이터베이스 생성

### Step 1: PostgreSQL 서비스 생성

1. **Render.com 대시보드 접속**
   - https://dashboard.render.com 접속
   - 로그인

2. **새 데이터베이스 생성**
   - 우측 상단 **"New +"** 버튼 클릭
   - **"PostgreSQL"** 선택

3. **데이터베이스 설정**
   ```
   Name: coffee-order-db
   Database: (자동 생성됨)
   User: (자동 생성됨)
   Region: Singapore (또는 Oregon - 무료 플랜 사용 가능)
   PostgreSQL Version: 16
   Plan: Free
   ```
   - **"Create Database"** 클릭

4. **데이터베이스 생성 대기**
   - 약 1-2분 소요
   - 상태가 "Available"이 되면 완료

### Step 2: 연결 정보 확인 및 복사

생성된 데이터베이스 페이지에서:

1. **Connections** 탭 클릭
2. 다음 정보 복사 및 저장:

   **Internal Database URL** (가장 중요!)
   ```
   postgresql://user:password@host:port/dbname
   ```

   또는 개별 정보:
   - **Host**: `dpg-xxxxx-a.singapore-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `coffee_order_xxxx`
   - **User**: `coffee_order_xxxx_user`
   - **Password**: (표시된 비밀번호 복사)

3. **⚠️ 중요**: 이 정보는 나중에 백엔드 환경 변수에 사용됩니다!

---

## 2️⃣ 백엔드 서버 배포

### Step 1: GitHub 저장소 준비

```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "Initial commit for deployment"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/order-app.git
git branch -M main
git push -u origin main
```

### Step 2: Render.com에서 Web Service 생성

1. **Render.com 대시보드**
   - **"New +"** 버튼 클릭
   - **"Web Service"** 선택

2. **GitHub 저장소 연결**
   - **"Connect account"** 클릭 (처음인 경우)
   - 또는 **"Public Git repository"**에 직접 URL 입력
   - 저장소: `YOUR_USERNAME/order-app` 선택
   - **"Connect"** 클릭

3. **서비스 설정** (⚠️ 중요!)
   ```
   Name: coffee-order-api
   Region: Singapore (데이터베이스와 동일한 지역 권장)
   Branch: main
   Root Directory: server  ⚠️ 필수!
   Runtime: Node
   Build Command: npm install && npm run db:init
   Start Command: npm start
   ```

   **설정 설명:**
   - **Root Directory**: `server` 폴더를 지정 (프로젝트 루트가 아닌 server 폴더!)
   - **Build Command**: 의존성 설치 + 데이터베이스 초기화
   - **Start Command**: 서버 시작

4. **Environment Variables 추가** (가장 중요!)

   **"Environment"** 섹션에서 다음 변수들을 추가:

   ⚠️ **방법 1: DATABASE_URL 사용 (권장 - 가장 간단)**
   ```
   Key: NODE_ENV
   Value: production

   Key: PORT
   Value: 10000

   Key: DATABASE_URL
   Value: postgresql://user:password@host:port/dbname
   (PostgreSQL의 "Internal Database URL" 전체 복사)
   ```

   ⚠️ **방법 2: 개별 환경 변수 사용**
   
   **중요**: DB_HOST에는 호스트만 입력하세요! (데이터베이스 이름 포함하지 않음)
   
   ```
   Key: NODE_ENV
   Value: production

   Key: PORT
   Value: 10000

   Key: DB_HOST
   Value: dpg-xxxxx-a.singapore-postgres.render.com
   ⚠️ 호스트만 입력 (예: "dpg-xxxxx-a.singapore-postgres.render.com")
   ❌ 잘못된 예: "dpg-xxxxx-a.singapore-postgres.render.com/order_app_db_b206"

   Key: DB_PORT
   Value: 5432

   Key: DB_NAME
   Value: order_app_db_b206
   (PostgreSQL의 Database 값)

   Key: DB_USER
   Value: order_app_db_b206_user
   (PostgreSQL의 User 값)

   Key: DB_PASSWORD
   Value: your_password_here
   (PostgreSQL의 Password 값)
   ```
   
   **참고**: 코드가 자동으로 DB_HOST에서 슬래시(/) 뒤의 데이터베이스 이름을 제거하지만, 
   처음부터 올바르게 설정하는 것이 좋습니다.

5. **"Create Web Service"** 클릭

6. **배포 대기 및 확인**
   - 배포 로그 확인 (하단의 "Logs" 탭)
   - "Build succeeded" 메시지 확인
   - 배포 완료 시 URL 제공: `https://coffee-order-api.onrender.com`

7. **배포 테스트**
   - 브라우저에서 제공된 URL 접속
   - `{"message":"커피 주문 앱 백엔드 서버"}` 메시지 확인
   - API 테스트: `https://your-api-url.onrender.com/api/menus`

---

## 3️⃣ 프런트엔드 배포

### Step 1: 환경 변수 파일 생성

`ui` 폴더에 `.env.production` 파일 생성:

```bash
# ui/.env.production
VITE_API_URL=https://coffee-order-api.onrender.com
```

⚠️ **중요**: 실제 배포한 백엔드 URL로 변경하세요!

### Step 2: GitHub에 푸시

```bash
git add ui/.env.production
git commit -m "Add production environment variables"
git push
```

### Step 3: Render.com에서 Static Site 생성

1. **Render.com 대시보드**
   - **"New +"** 버튼 클릭
   - **"Static Site"** 선택

2. **저장소 연결**
   - 동일한 GitHub 저장소 선택
   - **"Connect"** 클릭

3. **설정**
   ```
   Name: coffee-order-app
   Branch: main
   Root Directory: ui  ⚠️ 필수!
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Environment Variables** (선택사항)
   
   Static Site는 환경 변수 지원이 제한적이므로, 
   `.env.production` 파일을 사용하는 것이 더 확실합니다.

   그래도 추가하려면:
   ```
   Key: VITE_API_URL
   Value: https://coffee-order-api.onrender.com
   ```

5. **"Create Static Site"** 클릭

6. **배포 대기 및 확인**
   - 배포 완료 후 제공되는 URL 확인
   - 예: `https://coffee-order-app.onrender.com`

---

## ✅ 배포 후 확인

### 백엔드 확인

1. **헬스 체크**
   ```
   https://your-api-url.onrender.com/
   ```

2. **API 테스트**
   ```
   https://your-api-url.onrender.com/api/menus
   https://your-api-url.onrender.com/api/orders/stats
   ```

### 프런트엔드 확인

1. 프런트엔드 URL 접속
2. 메뉴 목록이 표시되는지 확인
3. 주문 기능 테스트
4. 관리자 화면 테스트

---

## 🔧 문제 해결

### 1. 빌드 실패

**증상**: Build failed 오류

**해결:**
- **Root Directory** 확인 (`server` 또는 `ui`)
- Build Command 확인
- 로그에서 구체적인 오류 메시지 확인
- `package.json`에 필요한 스크립트 있는지 확인

### 2. 데이터베이스 연결 실패

**증상**: "connection refused" 또는 "authentication failed"

**해결:**
- 환경 변수가 올바르게 설정되었는지 확인
- Internal Database URL 사용 (Render 서비스 간 통신)
- SSL 설정 확인 (코드에 자동 설정됨)
- 데이터베이스가 "Available" 상태인지 확인

### 3. 프런트엔드에서 API 호출 실패

**증상**: CORS 오류 또는 404 오류

**해결:**
- `VITE_API_URL` 환경 변수 확인
- 백엔드 URL이 올바른지 확인 (https 포함)
- CORS 설정 확인 (백엔드 코드에 이미 포함됨)
- 브라우저 개발자 도구(F12) → Network 탭에서 확인

### 4. 데이터베이스 초기화 안 됨

**증상**: API 호출 시 테이블이 없다는 오류

**해결:**
- Render Shell에서 수동 실행:
  1. 백엔드 서비스 → **Shell** 탭
  2. 다음 명령어 실행:
     ```bash
     cd server
     npm run db:init
     ```
- 또는 Build Command에 포함 확인

### 5. 환경 변수 미적용

**증상**: 환경 변수가 반영되지 않음

**해결:**
- Render 대시보드에서 환경 변수 재확인
- 변수 이름 대소문자 확인
- 서비스 재배포 (Settings → Manual Deploy)

---

## 📝 체크리스트

### 배포 전
- [ ] GitHub에 코드 푸시 완료
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] PostgreSQL 데이터베이스 생성 완료
- [ ] 데이터베이스 연결 정보 복사 완료

### 백엔드 배포
- [ ] Web Service 생성 완료
- [ ] Root Directory: `server` 설정 확인
- [ ] 환경 변수 모두 설정 완료
- [ ] 배포 완료 및 URL 확인
- [ ] API 테스트 성공

### 프런트엔드 배포
- [ ] `.env.production` 파일 생성 완료
- [ ] 백엔드 URL 올바르게 설정
- [ ] Static Site 생성 완료
- [ ] Root Directory: `ui` 설정 확인
- [ ] 배포 완료 및 URL 확인
- [ ] 프런트엔드 테스트 성공

---

## 💡 Render.com 무료 플랜 주의사항

1. **Web Service Sleep**
   - 15분 동안 요청이 없으면 sleep 상태
   - 첫 요청 시 약 30-60초 지연 가능
   - 해결: 유료 플랜 또는 주기적 ping

2. **PostgreSQL 제한**
   - 90일 미사용 시 삭제될 수 있음
   - 무료 플랜은 일정 데이터 저장 용량 제한

3. **빌드 시간**
   - 무료 플랜은 빌드 시간 제한 있음
   - 빌드 실패 시 로그 확인

---

## 🎉 완료!

배포가 완료되면:
1. 프런트엔드 URL로 접속하여 앱 사용
2. 관리자 화면에서 주문 관리
3. 백엔드 로그 모니터링
4. 필요시 도메인 연결 (유료 플랜)

---

## 📞 추가 도움말

- Render.com 문서: https://render.com/docs
- 문제 발생 시: Render 대시보드 → Logs 확인
- GitHub Issues: 프로젝트 저장소에 이슈 생성

