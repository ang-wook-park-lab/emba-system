import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/axios'

export default function FindUserId() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUserId('')

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!phone.trim()) {
      setError('핸드폰 번호를 입력해주세요.')
      return
    }

    // 핸드폰 번호 형식 확인 (숫자만, 하이픈 제거)
    const phoneNumber = phone.replace(/-/g, '').replace(/\s/g, '')
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      setError('핸드폰 번호를 올바르게 입력해주세요. (10-11자리 숫자)')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/find-user-id', {
        name: name.trim(),
        phone: phoneNumber
      })

      if (response.data.success && response.data.userId) {
        setUserId(response.data.userId)
        setError('')
      } else {
        setError('일치하는 계정을 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('아이디 찾기 실패:', error)
      setError(error.response?.data?.message || '아이디 찾기에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">EMBA 8대 동문 관리시스템</h2>
          <p className="mt-2 text-center text-sm text-gray-600">아이디 찾기</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {userId && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold mb-2">아이디를 찾았습니다!</p>
              <p className="text-lg font-bold">{userId}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="이름을 입력하세요"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                핸드폰 번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="010-1234-5678"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">하이픈(-) 없이 입력해도 됩니다</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '찾는 중...' : '아이디 찾기'}
            </button>
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

