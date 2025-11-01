# 프런트엔드 코드 개선 사항

## 🚨 중요 버그 및 수정 필요 사항

### 1. **옵션 이름 매핑 버그** (App.jsx)
**문제**: 옵션 ID를 index로 매핑하여 잘못된 옵션 이름이 저장될 수 있음
```javascript
// 현재 코드 (31-36줄)
options: item.selectedOptions.map((optId, index) => {
  const optionNames = item.optionNames ? item.optionNames.split(', ') : []
  return {
    id: optId,
    name: optionNames[index] || '옵션'  // ❌ index 기반 매핑은 부정확
  }
})
```

### 2. **재고 차감 로직 최적화 필요** (AdminPage.jsx)
**문제**: forEach 내부에서 여러 번 setState 호출로 성능 저하
```javascript
// 현재 코드 (96-107줄)
order.items.forEach(item => {
  setInventory(prevInventory => {  // ❌ 여러 번의 setState 호출
    // ...
  })
})
```

### 3. **재고 부족 체크 없음**
**문제**: 주문 시 재고가 부족한 경우 체크하지 않음
- 품절 상태인 메뉴도 주문 가능
- 재고가 부족한 경우 사용자에게 알림 없음

### 4. **에러 처리 부족**
**문제**: localStorage 파싱 실패 시 적절한 fallback 없음
- 사용자에게 오류 알림 없음
- 기본값으로 복구하는 로직 필요

### 5. **사용자 피드백 개선 필요**
**문제**: `alert()` 사용으로 인한 불편한 UX
- 주문 성공/실패 메시지를 모달이나 토스트로 변경 필요
- 시각적 피드백 부족

## ⚠️ 개선 권장 사항

### 6. **컴포넌트 최적화**
- `useCallback`, `useMemo` 활용으로 불필요한 re-render 방지
- Cart 컴포넌트의 총 금액 계산 최적화

### 7. **상태 관리 개선**
- 여러 useState를 하나의 reducer로 통합 고려
- 복잡한 로직의 커스텀 훅으로 분리

### 8. **접근성 개선**
- 키보드 네비게이션 지원
- aria-label, role 속성 추가
- 포커스 관리 개선

### 9. **날짜 포맷팅 검증**
- `formatDateTime`에서 유효하지 않은 날짜 처리
- 타임존 고려

### 10. **코드 일관성**
- console.log 제거 (프로덕션 준비)
- 함수명 통일성 (handle vs on)
- 에러 메시지 통일

### 11. **데이터 검증**
- 주문 데이터 구조 검증
- Props 타입 검증 (PropTypes 또는 TypeScript)

### 12. **로딩 상태 표시**
- 주문 처리 중 로딩 인디케이터
- 재고 업데이트 중 로딩 표시

## 📝 우선순위별 개선 계획

### 높은 우선순위
1. ✅ 옵션 이름 매핑 버그 수정
2. ✅ 재고 차감 로직 최적화
3. ✅ 재고 부족 체크 추가
4. ✅ 에러 처리 강화

### 중간 우선순위
5. 사용자 피드백 개선 (alert → 토스트)
6. 로딩 상태 표시
7. 컴포넌트 최적화

### 낮은 우선순위
8. 접근성 개선
9. 코드 리팩토링
10. 테스트 코드 작성

