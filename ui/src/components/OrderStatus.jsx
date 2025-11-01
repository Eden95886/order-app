import './OrderStatus.css'

function OrderStatus({ orders, onUpdateOrderStatus }) {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}월 ${day}일 ${hours}:${minutes}`
  }

  const formatOrderItems = (items) => {
    return items.map(item => {
      const optionsText = item.options && item.options.length > 0 
        ? ` (${item.options.map(opt => opt.name).join(', ')})` 
        : ''
      return `${item.menuName}${optionsText} x ${item.quantity}`
    }).join(', ')
  }

  const getStatusButton = (order) => {
    switch (order.status) {
      case 'received':
        return (
          <button 
            className="status-button start-production"
            onClick={() => onUpdateOrderStatus(order.id, 'in_progress')}
          >
            제조 시작
          </button>
        )
      case 'in_progress':
        return (
          <button 
            className="status-button complete"
            onClick={() => onUpdateOrderStatus(order.id, 'completed')}
          >
            제조 완료
          </button>
        )
      case 'completed':
        return (
          <span className="status-completed">완료</span>
        )
      default:
        return null
    }
  }

  // 최신 주문이 위에 오도록 역순 정렬
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.orderDate) - new Date(a.orderDate)
  )

  return (
    <div className="order-status">
      <h2 className="section-title">주문 현황</h2>
      <div className="orders-list">
        {sortedOrders.length === 0 ? (
          <p className="empty-orders">주문이 없습니다.</p>
        ) : (
          sortedOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-info">
                <div className="order-header">
                  <span className="order-date">{formatDateTime(order.orderDate)}</span>
                  {getStatusButton(order)}
                </div>
                <div className="order-items">
                  {formatOrderItems(order.items)}
                </div>
                <div className="order-price">
                  {order.totalPrice.toLocaleString()}원
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderStatus

