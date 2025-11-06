import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const allMenuItems = [
    { name: '내정보', path: '/my-info', icon: '👤', roles: ['admin', 'approver', 'user'] },
    { name: '승인관리', path: '/approvals', icon: '✅', roles: ['admin', 'approver'] },
    { name: '대시보드', path: '/', icon: '📊', roles: ['admin', 'approver'] },
    { name: '계정관리', path: '/users', icon: '👥', roles: ['admin'] },
    { name: '행사들', path: '/projects', icon: '🏖️', roles: ['admin', 'approver', 'user'] },
    { name: '참석자관리', path: '/participants', icon: '👨‍👩‍👧‍👦', roles: ['admin', 'approver', 'user'] },
    { name: '후원관리', path: '/sponsorships', icon: '🎁', roles: ['admin', 'approver', 'user'] },
    { name: '지출관리', path: '/expenses', icon: '💰', roles: ['admin', 'approver', 'user'] },
    { name: '골프대회 연례회의', path: '/golf-tournaments', icon: '⛳', roles: ['admin', 'approver', 'user'] },
  ]

  // 사용자 권한에 따라 메뉴 필터링
  const menuItems = allMenuItems.filter(item => {
    if (!item.roles) return true // roles가 없으면 모든 사용자에게 표시
    return item.roles.includes(user?.role || 'user')
  })

  const getRoleName = (role) => {
    switch(role) {
      case 'admin': return '관리자'
      case 'approver': return '승인자'
      case 'user': return '일반사용자'
      default: return role
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\. /g, '. ')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* 모바일 헤더 (햄버거 메뉴) */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-bold text-gray-800">EMBA 동문 관리</h1>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        w-64 bg-white border-r border-gray-200 flex flex-col
        fixed left-0 top-0 h-full z-50
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:z-auto
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 mt-14 md:mt-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">EMBA 8대 동문 관리시스템</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{user?.name || '사용자'}님</p>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* 메뉴 섹션 */}
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
