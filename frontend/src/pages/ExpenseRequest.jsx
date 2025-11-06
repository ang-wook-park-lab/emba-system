import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'

const categories = ['식비', '교통비', '숙박비', '회의비', '재료비', '기타']
const currencies = ['KRW', 'USD', 'EUR', 'JPY']

export default function ExpenseRequest() {
  const [projects, setProjects] = useState([])
  const [formData, setFormData] = useState({
    projectId: '',
    category: '',
    amount: '',
    currency: 'KRW',
    description: '',
    receipt: null,
    participants: [],
    contributionItems: [],
    // 은행 정보
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data.projects || [])
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      setProjects([])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 금액 입력 핸들러 (쉼표 제거)
  const handleAmountChange = (e) => {
    const value = e.target.value
    // 쉼표와 숫자가 아닌 문자 제거
    const numericValue = value.replace(/[^\d]/g, '')
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }))
  }

  // 숫자를 천 단위 쉼표 형식으로 변환
  const formatNumberWithCommas = (number) => {
    if (!number) return ''
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      receipt: e.target.files[0]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('projectId', formData.projectId)
      submitData.append('category', formData.category)
      submitData.append('amount', formData.amount)
      submitData.append('currency', formData.currency)
      submitData.append('description', formData.description)
      
      // 은행 정보 추가
      if (formData.bankName) submitData.append('bankName', formData.bankName)
      if (formData.accountNumber) submitData.append('accountNumber', formData.accountNumber)
      if (formData.accountHolder) submitData.append('accountHolder', formData.accountHolder)
      
      if (formData.receipt) {
        submitData.append('receipt', formData.receipt)
      }

      console.log('지출 요청 전송:', {
        projectId: formData.projectId,
        category: formData.category,
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description,
        hasReceipt: !!formData.receipt
      })

      const response = await api.post('/expenses/request', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('지출 요청 성공:', response.data)
      alert(response.data.message || '지출 요청이 제출되었습니다.')
      navigate('/expenses')
    } catch (error) {
      console.error('지출 요청 실패:', error)
      alert(error.response?.data?.message || '지출 요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>지출 요청</span>
        </h1>
        <p className="text-gray-600 mt-2">새로운 지출을 요청하세요</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로젝트 *
              </label>
              <select
                name="projectId"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.projectId}
                onChange={handleChange}
              >
                <option value="">프로젝트 선택</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 *
              </label>
              <select
                name="category"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                금액 *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="amount"
                  required
                  inputMode="numeric"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formatNumberWithCommas(formData.amount)}
                  onChange={handleAmountChange}
                  placeholder="예: 1,000,000"
                />
                <select
                  name="currency"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receipt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지출증빙 (영수증/계산서)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={handleFileChange}
              />
              {formData.receipt && (
                <p className="mt-2 text-sm text-gray-600">선택된 파일: {formData.receipt.name}</p>
              )}
            </div>
          </div>

          {/* 송금 정보 섹션 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">송금 정보 (선택사항)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  은행명
                </label>
                <input
                  type="text"
                  name="bankName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="예: 국민은행"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="예: 123-45-678910"
                />
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예금주
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  placeholder="예: 홍길동"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.description}
              onChange={handleChange}
              placeholder="지출 내용을 설명해주세요"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/expenses')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? '제출 중...' : '요청 제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

