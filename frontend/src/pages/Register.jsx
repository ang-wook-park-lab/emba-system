import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 필수 필드 확인
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!formData.userId.trim()) {
      setError('아이디를 입력해주세요.')
      return
    }

    // 아이디 형식 확인 (영문, 숫자, 언더스코어, 하이픈만 허용, 3-20자)
    const userIdRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!userIdRegex.test(formData.userId.trim())) {
      setError('아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능하며 3-20자여야 합니다.')
      return
    }

    // 이메일이 제공된 경우 형식 확인
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('올바른 이메일 형식을 입력해주세요.')
        return
      }
    }

    if (!formData.phone.trim()) {
      setError('핸드폰 번호를 입력해주세요.')
      return
    }

    // 핸드폰 번호 형식 확인 (숫자만, 하이픈 제거)
    const phoneNumber = formData.phone.replace(/-/g, '').replace(/\s/g, '')
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      setError('핸드폰 번호를 올바르게 입력해주세요. (10-11자리 숫자)')
      return
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const phoneNumber = formData.phone.replace(/-/g, '').replace(/\s/g, '')
      const response = await api.post('/auth/register', {
        name: formData.name.trim(),
        userId: formData.userId.trim(),
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : null,
        phone: phoneNumber,
        password: formData.password
      })

      console.log('회원가입 응답:', response.data)

      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data
        
        // localStorage에 저장
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // AuthContext 상태 업데이트 (즉시 반영)
        setUser(user)
        
        setSuccess(true)
        setError('')
        
        // 1.5초 후 대시보드로 이동
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        console.error('응답 데이터 형식 오류:', response.data)
        throw new Error('응답 데이터 형식이 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('=== 회원가입 오류 상세 ===')
      console.error('에러 객체:', error)
      console.error('응답 상태:', error.response?.status)
      console.error('응답 데이터:', error.response?.data)
      console.error('에러 메시지:', error.message)
      console.error('에러 스택:', error.stack)
      console.error('========================')
      
      let errorMessage = ''
      
      // 1. 백엔드에서 보낸 에러 메시지가 있는 경우 (최우선)
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
        console.log('백엔드 에러 메시지:', errorMessage)
        
      }
      // 2. 응답은 있지만 message가 없는 경우
      else if (error.response?.data) {
        // error 필드 확인
        if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
        // 전체 데이터를 문자열로 변환
        else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
        else {
          errorMessage = JSON.stringify(error.response.data)
        }
      }
      // 3. 상태 코드만 있는 경우
      else if (error.response) {
        if (error.response.status === 400) {
          errorMessage = '입력 정보를 확인해주세요.'
        } else if (error.response.status === 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        } else {
          errorMessage = `서버 오류 (${error.response.status})`
        }
      }
      // 4. 네트워크 오류
      else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
      }
      // 5. 기타 오류
      else if (error.message) {
        errorMessage = error.message
      }
      // 6. 알 수 없는 오류
      else {
        errorMessage = '알 수 없는 오류가 발생했습니다. 브라우저 콘솔을 확인해주세요.'
      }
      
      // 최종 에러 메시지 설정 (항상 표시)
      setError(errorMessage || '회원가입에 실패했습니다.')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">EMBA 8대 동문 관리시스템</h2>
          <p className="mt-2 text-center text-sm text-gray-600">회원가입</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✓ 회원가입이 완료되었습니다! 대시보드로 이동합니다...
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름 *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                아이디 *
              </label>
              <input
                id="userId"
                name="userId"
                type="text"
                required
                placeholder="영문, 숫자, _, - 만 사용 가능 (3-20자)"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.userId}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">로그인 시 사용할 아이디를 입력해주세요</p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 (선택사항)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.email}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">이메일은 선택사항입니다</p>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                핸드폰 번호 *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="010-1234-5678"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.phone}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">하이픈(-) 없이 입력해도 됩니다</p>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호 *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">최소 4자 이상</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : success ? '가입 완료!' : '회원가입'}
            </button>
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                이미 계정이 있으신가요? 로그인
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

