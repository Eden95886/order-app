# Render.com 배포 가이드

## 배포 순서

### 1단계: PostgreSQL 데이터베이스 생성
### 2단계: 백엔드 서버 배포
### 3단계: 프런트엔드 배포

---

## 1단계: PostgreSQL 데이터베이스 생성

### 1.1 Render.com에서 PostgreSQL 생성

1. Render.com 대시보드 접속
2. **New +** 버튼 클릭 → **PostgreSQL** 선택
3. 데이터베이스 설정:
   - **Name**: `coffee-order-db` (또는 원하는 이름)
   - **Database**: 자동 생성 (또는 원하는 이름)
   - **User**: 자동 생성
   - **Region**: 가장 가까운 지역 선택 (예: `Singapore` 또는 `Oregon`)
   - **PostgreSQL Version**: `16` (또는 최신 버전)
   - **Plan**: `Free` 또는 원하는 플랜
4. **Create Database** 클릭

### 1.2 데이터베이스 정보 확인

생성 후 **Connections** 섹션에서 다음 정보를 복사:
- **Internal Database URL**: 백엔드 서버에서 사용
- **External Database URL**: 로컬 개발 시 사용 (선택사항)
- **Host**: `dpg-xxxxx-a.singapore-postgres.render.com`
- **Port**: `5432`
- **Database**: `coffee_order_xxxx`
- **User**: `coffee_order_xxxx_user`
- **Password**: 자동 생성된 비밀번호 (저장해두기!)

---

## 2단계: 백엔드 서버 배포

### 2.1 GitHub 저장소에 코드 푸시

```bash
# Git 초기화 (아직 하지 않은 경우)
git init
git add .
git commit -m "Initial commit"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/order-app.git
git push -u origin main
```

### 2.2 Render.com에서 Web Service 생성

1. Render.com 대시보드에서 **New +** → **Web Service** 선택
2. **Connect account** 또는 **Public Git repository** 선택
3. 저장소 연결:
   - **Repository**: `YOUR_USERNAME/order-app` 선택
   - **Branch**: `main` (또는 기본 브랜치)
   - **Root Directory**: `server` (중요!)
4. 서비스 설정:
   - **Name**: `coffee-order-api` (또는 원하는 이름)
   - **Region**: 데이터베이스와 동일한 지역 선택
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.3 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수 추가:

```env
NODE_ENV=production
PORT=10000

# PostgreSQL 데이터베이스 연결 정보
DB_HOST=dpg-xxxxx-a.singapore-postgres.render.com
DB_PORT=5432
DB_NAME=coffee_order_xxxx
DB_USER=coffee_order_xxxx_user
DB_PASSWORD=your_password_here
```

**참고**: Render.com의 PostgreSQL은 자동으로 SSL 연결을 요구하므로 `DB_HOST`에 실제 호스트명을 사용합니다.

### 2.4 데이터베이스 연결 설정 수정

Render.com PostgreSQL은 SSL 연결이 필요할 수 있습니다. `server/config/db.js` 파일을 확인하고 필요시 SSL 설정을 추가합니다.

### 2.5 데이터베이스 초기화 스크립트 수정

배포 후 자동으로 데이터베이스를 초기화하도록 `package.json`에 스크립트를 추가하거나, Render의 **Build Command**에서 실행하도록 설정합니다.

**방법 1**: Build Command에 포함
```
npm install && npm run db:init
```

**방법 2**: 배포 후 수동 실행
Render의 Shell에서:
```bash
cd server
npm run db:init
```

### 2.6 배포 및 확인

1. **Create Web Service** 클릭
2. 배포 로그 확인
3. 배포 완료 후 제공되는 URL 확인 (예: `https://coffee-order-api.onrender.com`)
4. 헬스 체크: `https://your-api-url.onrender.com/` 접속하여 확인

---

## 3단계: 프런트엔드 배포

### 3.1 Static Site로 배포 (권장)

1. Render.com 대시보드에서 **New +** → **Static Site** 선택
2. 저장소 연결:
   - **Repository**: 동일한 저장소 (`YOUR_USERNAME/order-app`)
   - **Branch**: `main`
   - **Root Directory**: `ui` (중요!)
3. 빌드 설정:
   - **Name**: `coffee-order-app` (또는 원하는 이름)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.2 환경 변수 설정 (Static Site는 제한적)

Static Site는 환경 변수를 직접 사용할 수 없으므로, 빌드 시점에 환경 변수를 주입해야 합니다.

**방법 1**: `vite.config.js`에서 환경 변수 설정

`ui/vite.config.js` 수정:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:3000'
    )
  }
})
```

**방법 2**: `ui/.env.production` 파일 생성

```env
VITE_API_URL=https://coffee-order-api.onrender.com
```

그리고 `ui/src/utils/api.js` 수정:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
```

### 3.3 API URL 업데이트

프런트엔드에서 백엔드 API URL을 업데이트합니다.

---

## 전체 배포 체크리스트

### 배포 전 확인사항

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `package.json`에 `start` 스크립트가 있는지 확인
- [ ] 데이터베이스 스키마 파일(`schema.sql`)이 있는지 확인
- [ ] 시드 데이터 파일(`seed.sql`)이 있는지 확인
- [ ] GitHub에 코드가 푸시되어 있는지 확인

### 배포 순서 요약

1. ✅ PostgreSQL 데이터베이스 생성
2. ✅ 데이터베이스 정보 복사 및 저장
3. ✅ 백엔드 Web Service 생성
4. ✅ 환경 변수 설정 (데이터베이스 연결 정보 포함)
5. ✅ 백엔드 배포 완료 확인
6. ✅ 데이터베이스 초기화 (스키마 및 시드 데이터)
7. ✅ 프런트엔드 Static Site 생성
8. ✅ 프런트엔드 빌드 설정
9. ✅ API URL 환경 변수 설정
10. ✅ 프런트엔드 배포 완료 확인

---

## 배포 후 테스트

### 백엔드 테스트

```bash
# 헬스 체크
curl https://your-api-url.onrender.com/

# 메뉴 목록 조회
curl https://your-api-url.onrender.com/api/menus

# 통계 조회
curl https://your-api-url.onrender.com/api/orders/stats
```

### 프런트엔드 테스트

1. 프런트엔드 URL 접속
2. 메뉴 목록이 정상적으로 표시되는지 확인
3. 주문 기능 테스트
4. 관리자 화면 접속 및 기능 테스트

---

## 문제 해결

### 일반적인 문제

#### 1. 데이터베이스 연결 실패

**증상**: 백엔드 로그에 "connection refused" 또는 "authentication failed"

**해결**:
- 환경 변수가 올바르게 설정되었는지 확인
- PostgreSQL의 Internal Database URL 사용 (Render 서비스 간 통신)
- SSL 모드 확인 (Render PostgreSQL은 SSL 필수일 수 있음)

#### 2. 빌드 실패

**증상**: Build failed 오류

**해결**:
- `Root Directory`가 올바른지 확인 (`server` 또는 `ui`)
- `package.json`에 필요한 스크립트가 있는지 확인
- 로그에서 구체적인 오류 메시지 확인

#### 3. API 호출 실패 (CORS 오류)

**증상**: 프런트엔드에서 API 호출 시 CORS 오류

**해결**:
- 백엔드 `index.js`에서 CORS 설정 확인
- 프런트엔드 도메인을 CORS 허용 목록에 추가 (필요시)

#### 4. 환경 변수 미적용

**증상**: 환경 변수가 제대로 로드되지 않음

**해결**:
- Render 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- 변수 이름이 정확한지 확인 (대소문자 구분)
- 서비스 재배포

---

## 참고사항

### Render.com 무료 플랜 제한사항

- **Web Service**: 15분 동안 요청이 없으면 sleep 상태가 됨 (첫 요청 시 느림)
- **PostgreSQL**: 90일 동안 사용하지 않으면 삭제될 수 있음
- **Static Site**: 무제한 (다만 빌드 시간 제한)

### 성능 최적화

- Web Service sleep 문제를 해결하려면:
  - 유료 플랜 사용
  - 또는 Cron Job으로 주기적 ping (무료 서비스 사용)

### 보안 고려사항

- `.env` 파일은 절대 Git에 커밋하지 않기
- 데이터베이스 비밀번호는 안전하게 관리
- 프로덕션 환경에서는 적절한 에러 처리 및 로깅 구현

---

## 다음 단계

배포 완료 후:
1. 도메인 연결 (선택사항)
2. SSL 인증서 자동 설정 (Render가 자동 처리)
3. 모니터링 및 로그 확인
4. 성능 모니터링

