import './MenuList.css'
import MenuCard from './MenuCard'

function MenuList({ menus, onAddToCart }) {
  return (
    <div className="menu-list">
      <h2 className="menu-section-title">메뉴</h2>
      <div className="menu-grid">
        {menus.map(menu => (
          <MenuCard key={menu.id} menu={menu} onAddToCart={onAddToCart} />
        ))}
      </div>
    </div>
  )
}

export default MenuList

