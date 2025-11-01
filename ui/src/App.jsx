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

  return (
    <div className="app">
      {currentPage === 'order' ? (
        <OrderPage />
      ) : (
        <AdminPage />
      )}
    </div>
  )
}

export default App
