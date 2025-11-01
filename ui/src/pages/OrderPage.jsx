import { useState } from 'react'
import Header from '../components/Header'
import MenuList from '../components/MenuList'
import Cart from '../components/Cart'

// 임시 메뉴 데이터
const menuData = [
  {
    id: 1,
    name: '아메리카노(ICE)',
    price: 4000,
    description: '깔끔하고 부드러운 아이스 아메리카노',
    imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 2,
    name: '아메리카노(HOT)',
    price: 4000,
    description: '따뜻하고 진한 핫 아메리카노',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 3,
    name: '카페라떼',
    price: 5000,
    description: '부드러운 우유와 에스프레소의 조화',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 4,
    name: '카푸치노',
    price: 5000,
    description: '에스프레소와 부드러운 우유 거품',
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  },
  {
    id: 5,
    name: '바닐라라떼',
    price: 5500,
    description: '달콤한 바닐라 시럽이 들어간 라떼',
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop',
    options: [
      { id: 1, name: '샷 추가', price: 500 },
      { id: 2, name: '시럽 추가', price: 0 }
    ]
  }
]

function OrderPage({ onOrder }) {
  const [cartItems, setCartItems] = useState([])

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

  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.')
      return
    }
    
    if (onOrder) {
      onOrder(cartItems)
    }
    
    console.log('주문 데이터:', cartItems)
    alert('주문이 접수되었습니다!')
    setCartItems([])
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)

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

