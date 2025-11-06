import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('요청 인터셉터 오류:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('응답 인터셉터 오류:', error)
    console.error('응답 상태:', error.response?.status)
    console.error('응답 데이터:', error.response?.data)
    
    // 401 에러는 로그인 페이지로 리다이렉트 (회원가입 페이지는 제외)
    if (error.response?.status === 401 && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

