import { useState, useEffect } from 'react'
import Header from '../components/Header'
import AdminDashboard from '../components/AdminDashboard'
import InventoryStatus from '../components/InventoryStatus'
import OrderStatus from '../components/OrderStatus'
import './AdminPage.css'

function AdminPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    receivedOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0
  })

  // 재고 초기값을 localStorage에서 로드하거나 기본값 사용
  const loadInventory = () => {
    const defaultInventory = [
      { menuId: 1, menuName: '아메리카노(ICE)', stock: 10 },
      { menuId: 2, menuName: '아메리카노(HOT)', stock: 10 },
      { menuId: 3, menuName: '카페라떼', stock: 10 },
      { menuId: 4, menuName: '카푸치노', stock: 10 },
      { menuId: 5, menuName: '바닐라라떼', stock: 10 }
    ]

    const storedInventory = localStorage.getItem('inventory')
    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory)
        // 기존 재고에 없는 메뉴 항목 추가
        const existingMenuIds = new Set(parsed.map(item => item.menuId))
        const missingItems = defaultInventory.filter(item => !existingMenuIds.has(item.menuId))
        const merged = [...parsed, ...missingItems]
        // menuId 순서로 정렬
        merged.sort((a, b) => a.menuId - b.menuId)
        // 업데이트된 재고를 localStorage에 저장
        localStorage.setItem('inventory', JSON.stringify(merged))
        return merged
      } catch (e) {
        console.error('재고 데이터 파싱 오류:', e)
      }
    }
    return defaultInventory
  }

  const [inventory, setInventory] = useState(loadInventory)
  const [orders, setOrders] = useState([])
  const [processedOrders, setProcessedOrders] = useState(new Set())

  // 통계 업데이트 함수
  const updateStats = (ordersList) => {
    const total = ordersList.length
    const received = ordersList.filter(o => o.status === 'received').length
    const inProgress = ordersList.filter(o => o.status === 'in_progress').length
    const completed = ordersList.filter(o => o.status === 'completed').length
    
    setStats({
      totalOrders: total,
      receivedOrders: received,
      inProgressOrders: inProgress,
      completedOrders: completed
    })
  }

  // 주문 상태 변경
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => {
      const updated = prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
      updateStats(updated)
      return updated
    })
  }

  // 재고 업데이트
  const updateStock = (menuId, change) => {
    setInventory(prevInventory => {
      const updated = prevInventory.map(item => {
        if (item.menuId === menuId) {
          const newStock = Math.max(0, item.stock + change)
          return { ...item, stock: newStock }
        }
        return item
      })
      // localStorage에 저장
      localStorage.setItem('inventory', JSON.stringify(updated))
      return updated
    })
  }

  // 주문에 따른 재고 차감
  const deductStockForOrder = (order) => {
    // 주문 접수 상태인 주문만 재고 차감
    if (order.status === 'received') {
      order.items.forEach(item => {
        setInventory(prevInventory => {
          const updated = prevInventory.map(invItem => {
            if (invItem.menuId === item.menuId) {
              const newStock = Math.max(0, invItem.stock - item.quantity)
              return { ...invItem, stock: newStock }
            }
            return invItem
          })
          localStorage.setItem('inventory', JSON.stringify(updated))
          return updated
        })
      })
      // 처리된 주문으로 표시
      setProcessedOrders(prev => {
        const newSet = new Set([...prev, order.id])
        localStorage.setItem('processedOrders', JSON.stringify(Array.from(newSet)))
        return newSet
      })
      return true
    }
    return false
  }

  // 주문 데이터 로드
  const loadOrders = () => {
    const storedOrders = localStorage.getItem('orders')
    const storedProcessed = localStorage.getItem('processedOrders')
    const processedSet = storedProcessed ? new Set(JSON.parse(storedProcessed)) : new Set()
    
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders)
        setOrders(parsedOrders)
        updateStats(parsedOrders)
        
        // 새로 들어온 주문 접수 상태의 주문에 대해 재고 차감
        parsedOrders.forEach(order => {
          if (order.status === 'received' && !processedSet.has(order.id)) {
            deductStockForOrder(order)
          }
        })
      } catch (e) {
        console.error('주문 데이터 파싱 오류:', e)
      }
    }
  }

  // 처리된 주문 ID 로드
  const loadProcessedOrders = () => {
    const stored = localStorage.getItem('processedOrders')
    if (stored) {
      try {
        return new Set(JSON.parse(stored))
      } catch (e) {
        console.error('처리된 주문 데이터 파싱 오류:', e)
      }
    }
    return new Set()
  }

  // 초기 로드
  useEffect(() => {
    const initialProcessedOrders = loadProcessedOrders()
    setProcessedOrders(initialProcessedOrders)
    loadOrders()
  }, [])

  // 주문 추가 (주문하기 화면에서 주문이 들어올 때 사용)
  useEffect(() => {
    // 주문 업데이트 이벤트 리스너
    const handleOrderUpdate = () => {
      loadOrders()
    }

    window.addEventListener('order-updated', handleOrderUpdate)
    return () => {
      window.removeEventListener('order-updated', handleOrderUpdate)
    }
  }, [])

  // 주문 상태 변경 시 localStorage 업데이트
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('orders', JSON.stringify(orders))
    }
  }, [orders])

  // 처리된 주문 ID 저장
  useEffect(() => {
    if (processedOrders.size > 0) {
      localStorage.setItem('processedOrders', JSON.stringify(Array.from(processedOrders)))
    }
  }, [processedOrders])

  // 재고 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory))
  }, [inventory])

  return (
    <>
      <Header currentPage="admin" />
      <div className="admin-content">
        <AdminDashboard stats={stats} />
        <InventoryStatus inventory={inventory} onUpdateStock={updateStock} />
        <OrderStatus orders={orders} onUpdateOrderStatus={updateOrderStatus} />
      </div>
    </>
  )
}

export default AdminPage

