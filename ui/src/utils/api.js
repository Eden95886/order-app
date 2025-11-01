// API 기본 URL
// 배포 시: 환경 변수 VITE_API_URL 사용
// 개발 시: 기본값 http://localhost:3000/api 사용
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api'

// API 요청 헬퍼 함수
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, config)
    
    // 응답이 JSON이 아닌 경우 처리
    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      throw new Error(`서버 응답 오류: ${response.status} ${response.statusText} - ${text}`)
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `API 요청 실패 (${response.status})`)
    }

    return data
  } catch (error) {
    console.error('API 오류:', error)
    // 네트워크 오류인 경우 더 자세한 정보 제공
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
    }
    throw error
  }
}

// 메뉴 관련 API
export const menuAPI = {
  // 메뉴 목록 조회
  getMenus: async (includeStock = false) => {
    const query = includeStock ? '?include_stock=true' : ''
    return await fetchAPI(`/menus${query}`)
  },

  // 특정 메뉴 조회
  getMenu: async (menuId) => {
    return await fetchAPI(`/menus/${menuId}`)
  },

  // 재고 수량 변경
  updateStock: async (menuId, change) => {
    return await fetchAPI(`/menus/${menuId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ change })
    })
  }
}

// 주문 관련 API
export const orderAPI = {
  // 주문 생성
  createOrder: async (orderData) => {
    return await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  },

  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `/orders?${query}` : '/orders'
    return await fetchAPI(endpoint)
  },

  // 특정 주문 조회
  getOrder: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`)
  },

  // 주문 상태 변경
  updateOrderStatus: async (orderId, status) => {
    return await fetchAPI(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }
}

// 재고 관련 API
export const inventoryAPI = {
  // 재고 현황 조회
  getInventory: async () => {
    return await fetchAPI('/inventory')
  }
}

// 통계 관련 API
export const statsAPI = {
  // 주문 통계 조회
  getOrderStats: async () => {
    return await fetchAPI('/orders/stats')
  }
}

