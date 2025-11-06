import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('name')
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    userId: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    position: '',
    role: 'user'
  })
  const { user: currentUser } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      alert('사용자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // 검색 로직은 클라이언트에서 필터링
    fetchUsers()
  }

  const handleEdit = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      department: user.department || '',
      position: user.position || '',
      role: user.role
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    try {
      await api.put(`/auth/users/${editingUser.id}`, {
        department: editingUser.department,
        position: editingUser.position,
        role: editingUser.role
      })
      alert('사용자 정보가 수정되었습니다.')
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      console.error('사용자 수정 실패:', error)
      alert('사용자 정보 수정에 실패했습니다.')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return

    try {
      await api.delete(`/auth/users/${userId}`)
      alert('사용자가 삭제되었습니다.')
      fetchUsers()
    } catch (error) {
      console.error('사용자 삭제 실패:', error)
      alert('사용자 삭제에 실패했습니다.')
    }
  }

  const handleAddUser = () => {
    setNewUser({
      name: '',
      userId: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      position: '',
      role: 'user'
    })
    setShowAddModal(true)
  }

  const handleSaveNewUser = async () => {
    // 유효성 검사
    if (!newUser.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }
    if (!newUser.userId.trim()) {
      alert('아이디를 입력해주세요.')
      return
    }
    // 아이디 형식 확인 (영문, 숫자, 언더스코어, 하이픈만 허용, 3-20자)
    const userIdRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!userIdRegex.test(newUser.userId.trim())) {
      alert('아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능하며 3-20자여야 합니다.')
      return
    }
    // 이메일이 제공된 경우 형식 확인
    if (newUser.email && newUser.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        alert('올바른 이메일 형식을 입력해주세요.')
        return
      }
    }
    if (!newUser.phone.trim()) {
      alert('핸드폰 번호를 입력해주세요.')
      return
    }
    // 핸드폰 번호 형식 검증 (숫자만)
    const phoneNumber = newUser.phone.replace(/-/g, '').replace(/\s/g, '')
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      alert('올바른 핸드폰 번호를 입력해주세요. (10-11자리 숫자)')
      return
    }
    if (!newUser.password || newUser.password.length < 4) {
      alert('비밀번호는 최소 4자리 이상이어야 합니다.')
      return
    }

    try {
      await api.post('/auth/register', {
        name: newUser.name.trim(),
        userId: newUser.userId.trim(),
        email: newUser.email.trim() ? newUser.email.trim().toLowerCase() : null,
        phone: phoneNumber,
        password: newUser.password,
        department: newUser.department.trim() || undefined,
        position: newUser.position.trim() || undefined,
        role: newUser.role
      })
      alert('새 사용자가 추가되었습니다.')
      setShowAddModal(false)
      fetchUsers()
    } catch (error) {
      console.error('사용자 추가 실패:', error)
      alert(error.response?.data?.message || '사용자 추가에 실패했습니다.')
    }
  }

  const handleNewUserChange = (field, value) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleName = (role) => {
    switch(role) {
      case 'admin': return '관리자'
      case 'approver': return '승인자'
      case 'user': return '일반사용자'
      default: return role
    }
  }

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'approver': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    switch(searchType) {
      case 'name':
        return user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      case 'department':
        return user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      case 'position':
        return user.position?.toLowerCase().includes(searchTerm.toLowerCase())
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">계정관리</h1>
        <p className="text-gray-600">시스템 계정을 관리하세요</p>
      </div>

      {/* 검색 영역 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-medium text-gray-700">검색 (이름/부서/직책)</span>
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="name">이름</option>
              <option value="department">부서</option>
              <option value="position">직책</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="통합검색"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* 계정 추가 버튼 */}
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>계정 추가</span>
          </button>
        </div>
      </div>

      {/* 사용자 목록 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">총 {filteredUsers.length}개</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  핸드폰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직급/직책
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.position || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                      {currentUser.id !== user.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 계정 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-900">새 계정 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => handleNewUserChange('name', e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이디 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.userId}
                  onChange={(e) => handleNewUserChange('userId', e.target.value)}
                  placeholder="영문, 숫자, _, - 만 사용 가능 (3-20자)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">로그인 시 사용할 아이디를 입력해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 (선택사항)
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => handleNewUserChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">이메일은 선택사항입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  핸드폰 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => handleNewUserChange('phone', e.target.value)}
                  placeholder="01012345678 (숫자만 입력)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">하이픈(-) 없이 숫자만 입력하세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => handleNewUserChange('password', e.target.value)}
                  placeholder="최소 4자리 이상"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">최소 4자리 이상 입력하세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부서
                </label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => handleNewUserChange('department', e.target.value)}
                  placeholder="부서를 입력하세요 (선택사항)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  직급/직책
                </label>
                <input
                  type="text"
                  value={newUser.position}
                  onChange={(e) => handleNewUserChange('position', e.target.value)}
                  placeholder="직급/직책을 입력하세요 (선택사항)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  권한 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => handleNewUserChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">일반사용자</option>
                  <option value="approver">승인자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveNewUser}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">사용자 정보 수정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부서
                </label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                  placeholder="부서를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  직급/직책
                </label>
                <input
                  type="text"
                  value={editingUser.position}
                  onChange={(e) => setEditingUser({...editingUser, position: e.target.value})}
                  placeholder="직급/직책을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  권한
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="user">일반사용자</option>
                  <option value="approver">승인자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                저장
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

