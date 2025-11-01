import { useState, useEffect } from 'react'
import Header from '../components/Header'
import MenuList from '../components/MenuList'
import Cart from '../components/Cart'
import { menuAPI, orderAPI } from '../utils/api'

function OrderPage({ onOrder }) {
  const [menuData, setMenuData] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)

  // 메뉴 데이터 로드
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true)
        const response = await menuAPI.getMenus(false)
        // 옵션 중복 제거 (같은 메뉴에 같은 이름의 옵션이 여러 개인 경우)
        const menus = (response.menus || []).map(menu => ({
          ...menu,
          options: menu.options ? menu.options.filter((option, index, self) => 
            // 같은 이름의 옵션 중 첫 번째 것만 유지
            self.findIndex(opt => opt.name === option.name) === index
          ) : []
        }))
        setMenuData(menus)
      } catch (error) {
        console.error('메뉴 로드 오류:', error)
        alert('메뉴를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadMenus()
  }, [])

  const addToCart = (menu, selectedOptions) => {
    const optionIds = selectedOptions.map(opt => opt.id).sort()
    const cartKey = `${menu.id}-${optionIds.join(',')}`
    
    const existingItem = cartItems.find(item => item.cartKey === cartKey)
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.cartKey === cartKey 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      const basePrice = menu.price
      const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      const unitPrice = basePrice + optionsPrice
      const optionNames = selectedOptions.map(opt => opt.name).join(', ')
      
      const newItem = {
        cartKey,
        menuId: menu.id,
        menuName: menu.name,
        basePrice,
        selectedOptions: optionIds,
        optionNames,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice
      }
      
      setCartItems([...cartItems, newItem])
    }
  }

  const updateCartItemQuantity = (cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.cartKey !== cartKey))
    } else {
      setCartItems(cartItems.map(item => 
        item.cartKey === cartKey 
          ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
          : item
      ))
    }
  }

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.')
      return
    }
    
    try {
      // 주문 데이터 준비
      const orderData = {
        items: cartItems.map(item => ({
          menu_id: item.menuId,
          quantity: item.quantity,
          option_ids: item.selectedOptions || [],
          unit_price: item.unitPrice
        })),
        total_price: cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
      }

      // API로 주문 전송
      const orderResult = await orderAPI.createOrder(orderData)
      
      // 성공 시 처리
      alert('주문이 접수되었습니다!')
      setCartItems([])
      
      // 부모 컴포넌트에 알림 (이벤트 발생)
      window.dispatchEvent(new CustomEvent('order-updated'))
    } catch (error) {
      console.error('주문 처리 오류:', error)
      alert(error.message || '주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)

  if (loading) {
    return (
      <>
        <Header currentPage="order" />
        <div className="main-content">
          <div style={{ textAlign: 'center', padding: '2rem' }}>메뉴를 불러오는 중...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header currentPage="order" />
      <div className="main-content">
        <MenuList menus={menuData} onAddToCart={addToCart} />
        <Cart 
          items={cartItems} 
          totalAmount={totalAmount}
          onUpdateQuantity={updateCartItemQuantity}
          onOrder={handleOrder}
        />
      </div>
    </>
  )
}

export default OrderPage

