import './Header.css'

function Header({ currentPage }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="brand">
          <span className="brand-name">COZY</span>
        </div>
        <nav className="navigation">
          <button 
            className={`nav-button ${currentPage === 'order' ? 'active' : ''}`}
          >
            주문하기
          </button>
          <button 
            className={`nav-button ${currentPage === 'admin' ? 'active' : ''}`}
          >
            관리자
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header

