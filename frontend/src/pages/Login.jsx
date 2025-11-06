import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const result = await login(identifier, password)
    if (result.success) {
      navigate('/my-info')
    } else {
      setError(result.error || '로그인에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">EMBA 8대 동문 관리시스템</h2>
          <p className="mt-2 text-center text-sm text-gray-600">로그인하세요</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                아이디
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                placeholder="아이디를 입력하세요"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">아이디로 로그인하세요</p>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              로그인
            </button>
            <div className="flex justify-between text-sm">
              <Link
                to="/find-user-id"
                className="text-purple-600 hover:text-purple-500"
              >
                아이디 찾기
              </Link>
              <Link
                to="/reset-password"
                className="text-purple-600 hover:text-purple-500"
              >
                비밀번호 재설정
              </Link>
            </div>
            <div className="text-center">
              <Link
                to="/register"
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                계정이 없으신가요? 회원가입
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

