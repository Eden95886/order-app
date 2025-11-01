import { useState, useEffect } from 'react'
import './App.css'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'

function App() {
  const [currentPage, setCurrentPage] = useState('order')

  // 네비게이션 이벤트 리스너
  useEffect(() => {
    const handleNavigate = (event) => {
      setCurrentPage(event.detail)
    }

    window.addEventListener('navigate', handleNavigate)
    return () => {
      window.removeEventListener('navigate', handleNavigate)
    }
  }, [])

  // 주문 처리 함수
  const handleOrder = (cartItems) => {
    // 주문 생성
    const newOrder = {
      id: Date.now(),
      orderDate: new Date().toISOString(),
      items: cartItems.map(item => ({
        menuId: item.menuId,
        menuName: item.menuName,
        quantity: item.quantity,
        options: item.selectedOptions.map((optId, index) => {
          const optionNames = item.optionNames ? item.optionNames.split(', ') : []
          return {
            id: optId,
            name: optionNames[index] || '옵션'
          }
        }),
        price: item.unitPrice
      })),
      totalPrice: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
      status: 'received' // 주문 접수 상태로 시작
    }

    // localStorage에 저장
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    const updatedOrders = [newOrder, ...existingOrders]
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    
    // 관리자 페이지가 열려있으면 새로고침되도록 이벤트 발생
    window.dispatchEvent(new CustomEvent('order-updated'))
  }

  return (
    <div className="app">
      {currentPage === 'order' ? (
        <OrderPage onOrder={handleOrder} />
      ) : (
        <AdminPage />
      )}
    </div>
  )
}

export default App
