import './InventoryStatus.css'

function InventoryStatus({ inventory, onUpdateStock }) {
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { text: '품절', className: 'status-sold-out' }
    } else if (stock < 5) {
      return { text: '주의', className: 'status-warning' }
    } else {
      return { text: '정상', className: 'status-normal' }
    }
  }

  return (
    <div className="inventory-status">
      <h2 className="section-title">재고 현황</h2>
      <div className="inventory-grid">
        {inventory.map(item => {
          const status = getStockStatus(item.stock)
          return (
            <div key={item.menuId} className="inventory-card">
              <h3 className="inventory-item-name">{item.menuName}</h3>
              <div className="inventory-info">
                <span className="stock-count">{item.stock}개</span>
                <span className={`stock-status ${status.className}`}>
                  {status.text}
                </span>
              </div>
              <div className="stock-controls">
                <button 
                  className="stock-button decrease"
                  onClick={() => onUpdateStock(item.menuId, -1)}
                  disabled={item.stock === 0}
                >
                  -
                </button>
                <button 
                  className="stock-button increase"
                  onClick={() => onUpdateStock(item.menuId, 1)}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InventoryStatus

