import './Cart.css'

function Cart({ items, totalAmount, onUpdateQuantity, onOrder }) {
  return (
    <div className="cart">
      <h2 className="cart-title">장바구니</h2>
      <div className="cart-items">
        {items.length === 0 ? (
          <p className="empty-cart">장바구니가 비어있습니다.</p>
        ) : (
          <ul className="cart-list">
            {items.map(item => (
              <li key={item.cartKey} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">
                    {item.menuName}
                    {item.optionNames && ` (${item.optionNames})`}
                  </span>
                  <div className="cart-item-controls">
                    <button 
                      className="quantity-button"
                      onClick={() => onUpdateQuantity(item.cartKey, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity">X {item.quantity}</span>
                    <button 
                      className="quantity-button"
                      onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="cart-item-price">{item.totalPrice.toLocaleString()}원</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {items.length > 0 && (
        <>
          <div className="cart-total">
            <span className="total-label">총 금액</span>
            <span className="total-amount">{totalAmount.toLocaleString()}원</span>
          </div>
          <button className="order-button" onClick={onOrder}>
            주문하기
          </button>
        </>
      )}
    </div>
  )
}

export default Cart

