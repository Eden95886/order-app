import { useState } from 'react'
import './MenuCard.css'

function MenuCard({ menu, onAddToCart }) {
  const [selectedOptions, setSelectedOptions] = useState([])

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => {
      const isSelected = prev.some(opt => opt.id === option.id)
      if (isSelected) {
        return prev.filter(opt => opt.id !== option.id)
      } else {
        return [...prev, option]
      }
    })
  }

  const handleAddToCart = () => {
    onAddToCart(menu, selectedOptions)
    // 담기 후 옵션 초기화하여 다음 주문 준비
    setSelectedOptions([])
  }

  const totalPrice = menu.price + selectedOptions.reduce((sum, opt) => sum + opt.price, 0)

  return (
    <div className="menu-card">
      <div className="menu-image">
        {menu.imageUrl ? (
          <img src={menu.imageUrl} alt={menu.name} />
        ) : (
          <div className="image-placeholder">
            <span>이미지</span>
          </div>
        )}
      </div>
      <div className="menu-info">
        <h3 className="menu-name">{menu.name}</h3>
        <p className="menu-price">{menu.price.toLocaleString()}원</p>
        <p className="menu-description">{menu.description}</p>
      </div>
      <div className="menu-options">
        {menu.options.map(option => (
          <label key={option.id} className="option-checkbox">
            <input
              type="checkbox"
              checked={selectedOptions.some(opt => opt.id === option.id)}
              onChange={() => handleOptionToggle(option)}
            />
            <span>
              {option.name} {option.price > 0 ? `(+${option.price.toLocaleString()}원)` : '(+0원)'}
            </span>
          </label>
        ))}
      </div>
      <button className="add-to-cart-button" onClick={handleAddToCart}>
        담기
      </button>
    </div>
  )
}

export default MenuCard

