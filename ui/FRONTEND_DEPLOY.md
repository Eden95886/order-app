# 프런트엔드 Render.com 배포 가이드

## 📋 배포 전 확인사항

- [ ] 백엔드가 Render.com에 배포되어 있고 정상 작동 중
- [ ] 백엔드 URL 확인 (예: `https://coffee-order-api.onrender.com`)
- [ ] GitHub에 코드가 푸시되어 있음

---

## 1️⃣ 코드 수정 사항

### ✅ 이미 완료된 수정
- `ui/src/utils/api.js`에서 환경 변수 `VITE_API_URL` 사용하도록 이미 설정됨
- 배포 시 환경 변수 또는 `.env.production` 파일 사용

### 📝 추가 작업 필요

#### 1. 프로덕션 환경 변수 파일 생성

`ui/.env.production` 파일을 생성하세요:

```env
# 백엔드 API URL (실제 배포된 백엔드 URL로 변경)
VITE_API_URL=https://your-api-url.onrender.com
```

⚠️ **중요**: 
- `your-api-url.onrender.com`을 실제 백엔드 URL로 변경하세요
- `https://` 포함하고, 마지막에 `/api`는 붙이지 마세요 (코드에서 자동 추가)

**예시:**
```env
# 올바른 예
VITE_API_URL=https://coffee-order-api.onrender.com

# 잘못된 예 (하지 마세요)
VITE_API_URL=https://coffee-order-api.onrender.com/api  ❌
```

---

## 2️⃣ GitHub에 푸시

```bash
# 프로젝트 루트에서
cd ui
# .env.production 파일 생성 후
cd ..
git add ui/.env.production
git commit -m "Add production environment variables"
git push
```

⚠️ **주의**: `.env.production` 파일이 `.gitignore`에 포함되어 있다면, 
Render.com에서 환경 변수를 직접 설정해야 합니다.

---

## 3️⃣ Render.com에서 Static Site 생성

### Step 1: Static Site 서비스 생성

1. **Render.com 대시보드 접속**
   - https://dashboard.render.com

2. **새 Static Site 생성**
   - 우측 상단 **"New +"** 버튼 클릭
   - **"Static Site"** 선택

3. **GitHub 저장소 연결**
   - **"Connect account"** 또는 **"Public Git repository"** 선택
   - 저장소: `YOUR_USERNAME/order-app` 선택
   - **"Connect"** 클릭

### Step 2: 서비스 설정

다음 정보를 입력하세요:

```
Name: coffee-order-app
(또는 원하는 이름)

Branch: main
(또는 기본 브랜치)

Root Directory: ui  ⚠️ 매우 중요!

Build Command: npm install && npm run build

Publish Directory: dist
```

**설명:**
- **Root Directory**: `ui` 폴더를 지정 (프로젝트 루트가 아님!)
- **Build Command**: Vite로 빌드 실행
- **Publish Directory**: Vite는 기본적으로 `dist` 폴더에 빌드 결과물 생성

### Step 3: 환경 변수 설정

**Environment Variables** 섹션에서:

```
Key: VITE_API_URL
Value: https://your-api-url.onrender.com
```

⚠️ **중요**: 
- 실제 백엔드 URL로 변경하세요
- `https://` 포함
- 마지막 `/api`는 제외 (코드에서 자동 추가됨)

**예시:**
```
VITE_API_URL=https://coffee-order-api.onrender.com
```

### Step 4: 배포

1. **"Create Static Site"** 클릭
2. 배포 진행 상황 확인 (Logs 탭)
3. 배포 완료 후 URL 확인
   - 예: `https://coffee-order-app.onrender.com`

---

## 4️⃣ 배포 확인

### 프런트엔드 테스트

1. **프런트엔드 URL 접속**
   - `https://your-frontend-url.onrender.com`

2. **기능 테스트**
   - [ ] 메뉴 목록이 정상적으로 표시되는지 확인
   - [ ] 주문하기 기능 테스트
   - [ ] 관리자 화면 접속
   - [ ] 재고 관리 기능 테스트
   - [ ] 주문 상태 변경 테스트

3. **브라우저 개발자 도구 확인**
   - F12 → Network 탭
   - API 호출이 올바른 백엔드 URL로 가는지 확인
   - 오류가 없는지 확인

---

## 🔧 문제 해결

### 1. API 호출 실패 (CORS 오류)

**증상**: 브라우저 콘솔에 CORS 오류

**해결:**
- 백엔드 서버의 CORS 설정 확인
- 백엔드 URL이 정확한지 확인
- 백엔드 서버가 실행 중인지 확인

### 2. 빌드 실패

**증상**: Build failed 오류

**해결:**
- **Root Directory**가 `ui`로 설정되었는지 확인
- **Build Command**가 `npm install && npm run build`인지 확인
- 로그에서 구체적인 오류 메시지 확인

### 3. 환경 변수 미적용

**증상**: API 호출이 여전히 localhost로 가는 경우

**해결:**
- Render.com 대시보드에서 환경 변수 확인
- `VITE_API_URL`이 올바르게 설정되었는지 확인
- 재배포 (Settings → Manual Deploy)

### 4. 404 오류 (페이지를 찾을 수 없음)

**증상**: React Router 사용 시 새로고침하면 404

**해결:**
- Vite 빌드 설정 확인
- Static Site는 SPA 라우팅을 자동으로 처리하지만, 
  필요 시 `vite.config.js`에 base 설정 추가

---

## 📝 체크리스트

### 배포 전
- [ ] 백엔드 서버가 정상 작동 중
- [ ] 백엔드 URL 확인 및 복사
- [ ] `.env.production` 파일 생성 (또는 환경 변수 준비)
- [ ] GitHub에 코드 푸시 완료

### Render.com 설정
- [ ] Static Site 생성 완료
- [ ] Root Directory: `ui` 설정 확인
- [ ] Build Command 확인
- [ ] Publish Directory: `dist` 확인
- [ ] 환경 변수 `VITE_API_URL` 설정 완료

### 배포 후
- [ ] 프런트엔드 URL 접속 성공
- [ ] 메뉴 목록 표시 확인
- [ ] API 호출이 올바른 백엔드로 가는지 확인
- [ ] 모든 기능 정상 작동 확인

---

## 💡 참고사항

### Vite 환경 변수 특징
- Vite는 `VITE_` 접두사가 있는 환경 변수만 클라이언트 코드에서 접근 가능
- 빌드 시점에 환경 변수가 번들에 포함됨
- 런타임에 변경 불가 (재빌드 필요)

### Render.com Static Site
- 무료 플랜 제공
- 자동 HTTPS
- CDN을 통한 빠른 전송
- 커스텀 도메인 지원 (유료 플랜)

---

## 🎉 완료!

배포가 완료되면:
1. 프런트엔드와 백엔드가 연결되어 정상 작동
2. 실제 URL로 앱 접근 가능
3. 모바일/데스크톱 모든 기기에서 접근 가능

