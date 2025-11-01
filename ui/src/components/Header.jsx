import './Header.css'

function Header({ currentPage, onNavigate }) {
  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      // 기본 동작: window.location 사용하거나 상태 관리
      window.dispatchEvent(new CustomEvent('navigate', { detail: page }))
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="brand">
          <span className="brand-name">COZY</span>
        </div>
        <nav className="navigation">
          <button 
            className={`nav-button ${currentPage === 'order' ? 'active' : ''}`}
            onClick={() => handleNavigation('order')}
          >
            주문하기
          </button>
          <button 
            className={`nav-button ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => handleNavigation('admin')}
          >
            관리자
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
