import { useState, useEffect } from 'react'
import Header from '../components/Header'
import AdminDashboard from '../components/AdminDashboard'
import InventoryStatus from '../components/InventoryStatus'
import OrderStatus from '../components/OrderStatus'
import { inventoryAPI, orderAPI, statsAPI, menuAPI } from '../utils/api'
import './AdminPage.css'

function AdminPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    receivedOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0
  })
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // 통계 조회
  const loadStats = async () => {
    try {
      const response = await statsAPI.getOrderStats()
      setStats({
        totalOrders: response.total_orders || 0,
        receivedOrders: response.received_orders || 0,
        inProgressOrders: response.in_progress_orders || 0,
        completedOrders: response.completed_orders || 0
      })
    } catch (error) {
      console.error('통계 조회 오류:', error)
    }
  }

  // 재고 현황 조회
  const loadInventory = async () => {
    try {
      const response = await inventoryAPI.getInventory()
      // API 응답의 snake_case를 camelCase로 변환
      const formattedInventory = (response.inventory || []).map(item => ({
        menuId: item.menu_id,
        menuName: item.menu_name,
        stock: item.stock
      }))
      setInventory(formattedInventory)
    } catch (error) {
      console.error('재고 조회 오류:', error)
    }
  }

  // 주문 목록 조회
  const loadOrders = async () => {
    try {
      const response = await orderAPI.getOrders()
      // API 응답의 snake_case를 camelCase로 변환
      const formattedOrders = (response.orders || []).map(order => ({
        id: order.id,
        orderDate: order.order_date,
        status: order.status,
        totalPrice: order.total_price,
        items: (order.items || []).map(item => ({
          menuId: item.menu_id,
          menuName: item.menu_name,
          quantity: item.quantity,
          options: item.options || [],
          unitPrice: item.unit_price
        }))
      }))
      setOrders(formattedOrders)
      // 통계도 함께 업데이트
      await loadStats()
    } catch (error) {
      console.error('주문 조회 오류:', error)
    }
  }

  // 초기 로드
  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      try {
        await Promise.all([
          loadStats(),
          loadInventory(),
          loadOrders()
        ])
      } catch (error) {
        console.error('초기 데이터 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [])

  // 주문 업데이트 이벤트 리스너
  useEffect(() => {
    const handleOrderUpdate = async () => {
      await loadOrders()
      await loadInventory()
    }

    window.addEventListener('order-updated', handleOrderUpdate)
    return () => {
      window.removeEventListener('order-updated', handleOrderUpdate)
    }
  }, [])

  // 재고 업데이트
  const updateStock = async (menuId, change) => {
    try {
      await menuAPI.updateStock(menuId, change)
      // 재고 목록 다시 조회
      await loadInventory()
    } catch (error) {
      console.error('재고 업데이트 오류:', error)
      alert(error.message || '재고 업데이트 중 오류가 발생했습니다.')
    }
  }

  // 주문 상태 변경
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus)
      // 주문 목록 다시 조회
      await loadOrders()
    } catch (error) {
      console.error('주문 상태 변경 오류:', error)
      alert(error.message || '주문 상태 변경 중 오류가 발생했습니다.')
    }
  }

  return (
    <>
      <Header currentPage="admin" />
      <div className="admin-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>데이터를 불러오는 중...</div>
        ) : (
          <>
            <AdminDashboard stats={stats} />
            <InventoryStatus inventory={inventory} onUpdateStock={updateStock} />
            <OrderStatus orders={orders} onUpdateOrderStatus={updateOrderStatus} />
          </>
        )}
      </div>
    </>
  )
}

export default AdminPage
