import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const categories = ['식비', '교통비', '숙박비', '회의비', '재료비', '기타']

export default function Expenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

  useEffect(() => {
    fetchExpenses()
    fetchProjects()
  }, [])

  // 프로젝트가 로드된 후 지출 데이터에 프로젝트 날짜 정보 추가
  useEffect(() => {
    if (projects.length > 0 && expenses.length > 0) {
      const expensesWithProject = expenses.map(expense => {
        const project = projects.find(p => p.id === expense.projectId)
        return {
          ...expense,
          projectName: project?.name || expense.projectName || '-',
          projectStartDate: project?.startDate || null,
          projectEndDate: project?.endDate || null
        }
      })
      setExpenses(expensesWithProject)
    }
  }, [projects])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data.projects || [])
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      setProjects([])
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const response = await api.get('/expenses')
      console.log('지출 목록 로드:', response.data)
      
      // API 응답 데이터 변환
      const transformedExpenses = (response.data.expenses || []).map(expense => {
        const project = projects.find(p => p.id === expense.projectId || (expense.project && p.id === expense.project.id))
        return {
          id: expense.id,
          projectId: expense.projectId || expense.project?.id,
          projectName: expense.project?.name || expense.projectName || project?.name || '-',
          projectStartDate: project?.startDate || null,
          projectEndDate: project?.endDate || null,
          category: expense.category,
          amount: expense.amount,
          currency: expense.currency || 'KRW',
          requester: expense.requester?.name || expense.requesterName || '-',
          requesterId: expense.requesterId,
          status: expense.status,
          requestDate: expense.createdAt ? new Date(expense.createdAt).toISOString().split('T')[0] : '-',
          approvedDate: expense.updatedAt ? new Date(expense.updatedAt).toISOString().split('T')[0] : '-',
          description: expense.description,
          receipt: expense.receiptFilename || null,
          receiptPath: expense.receiptPath || null,
          bankName: expense.bankName,
          accountNumber: expense.accountNumber,
          accountHolder: expense.accountHolder,
          createdAt: expense.createdAt
        }
      })
      
      setExpenses(transformedExpenses)
      setLoading(false)
    } catch (error) {
      console.error('지출 로드 실패:', error)
      setExpenses([])
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return ''
    const start = new Date(startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    if (endDate) {
      const end = new Date(endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      return `${start} ~ ${end}`
    }
    return `${start} ~`
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.requester.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = filterProject === 'all' || expense.projectName === filterProject
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus
    return matchesSearch && matchesProject && matchesStatus
  })

  // 금액을 천 단위 쉼표 형식으로 변환
  const formatNumberWithCommas = (number) => {
    if (!number) return ''
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 수정 모달 열기
  const handleEditExpense = (expense) => {
    setEditingExpense({
      id: expense.id,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      bankName: expense.bankName || '',
      accountNumber: expense.accountNumber || '',
      accountHolder: expense.accountHolder || '',
      receipt: null
    })
    setShowEditModal(true)
  }

  // 수정 필드 변경
  const handleEditChange = (field, value) => {
    setEditingExpense(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 금액 입력 핸들러 (쉼표 제거)
  const handleAmountChange = (e) => {
    const value = e.target.value
    const numericValue = value.replace(/[^\d]/g, '')
    setEditingExpense(prev => ({
      ...prev,
      amount: numericValue
    }))
  }

  // 영수증 파일 변경
  const handleFileChange = (e) => {
    setEditingExpense(prev => ({
      ...prev,
      receipt: e.target.files[0]
    }))
  }

  // 지출 수정 저장
  const handleSaveEdit = async () => {
    if (!editingExpense.category || !editingExpense.amount || !editingExpense.description) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('category', editingExpense.category)
      formData.append('amount', editingExpense.amount)
      formData.append('description', editingExpense.description)
      if (editingExpense.bankName) formData.append('bankName', editingExpense.bankName)
      if (editingExpense.accountNumber) formData.append('accountNumber', editingExpense.accountNumber)
      if (editingExpense.accountHolder) formData.append('accountHolder', editingExpense.accountHolder)
      if (editingExpense.receipt) {
        formData.append('receipt', editingExpense.receipt)
      }

      const response = await api.put(`/expenses/${editingExpense.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert(response.data.message || '지출이 수정되었습니다.')
      setShowEditModal(false)
      setEditingExpense(null)
      fetchExpenses()
    } catch (error) {
      console.error('지출 수정 실패:', error)
      alert(error.response?.data?.message || '지출 수정에 실패했습니다.')
    }
  }

  // 지출 삭제
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('정말 이 지출을 삭제하시겠습니까?')) return

    try {
      const response = await api.delete(`/expenses/${expenseId}`)
      alert(response.data.message || '지출이 삭제되었습니다.')
      fetchExpenses()
    } catch (error) {
      console.error('지출 삭제 실패:', error)
      alert(error.response?.data?.message || '지출 삭제에 실패했습니다.')
    }
  }

  // 영수증 보기
  const handleShowReceipt = (expense) => {
    setSelectedExpense(expense)
    setShowReceiptModal(true)
  }

  // 영수증 모달 닫기
  const handleCloseReceipt = () => {
    setShowReceiptModal(false)
    setSelectedExpense(null)
  }

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '. ')
  }

  // 수정/삭제 권한 확인
  const canEdit = (expense) => {
    // 관리자이거나 본인이 요청한 지출만 수정 가능
    // 승인 완료된 지출은 수정 불가
    return (user?.role === 'admin' || expense.requester === user?.name) && expense.status !== '승인완료'
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>지출 관리</span>
        </h1>
        <p className="text-gray-600 mt-2">모든 지출 내역을 확인하세요</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Link
            to="/expenses/request"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>지출 요청</span>
          </Link>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="all">전체 프로젝트</option>
            {projects.map(project => (
              <option key={project.id} value={project.name}>{project.name}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="대기중">대기중</option>
            <option value="승인중">승인중</option>
            <option value="승인완료">승인완료</option>
            <option value="거절">거절</option>
          </select>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="검색 (설명/요청자)"
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">지출 내역</h2>
          <p className="text-sm text-gray-600 mt-1">총 {filteredExpenses.length}개</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">증빙</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                    지출 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{expense.projectName}</span>
                        {expense.projectStartDate && (
                          <span className="text-xs text-gray-500 mt-1">
                            {formatDateRange(expense.projectStartDate, expense.projectEndDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.requester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        expense.status === '승인완료' ? 'bg-green-100 text-green-800' :
                        expense.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                        expense.status === '승인중' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.requestDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.receipt ? (
                        <button 
                          onClick={() => handleShowReceipt(expense)}
                          className="text-purple-600 hover:text-purple-900 underline"
                        >
                          보기
                        </button>
                      ) : (
                        <span className="text-gray-400">없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {canEdit(expense) ? (
                        <>
                          <button 
                            onClick={() => handleEditExpense(expense)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {expense.status === '승인완료' ? '승인 완료됨' : '권한 없음'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">지출 수정</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={editingExpense.category}
                  onChange={(e) => handleEditChange('category', e.target.value)}
                >
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
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formatNumberWithCommas(editingExpense.amount)}
                  onChange={handleAmountChange}
                  placeholder="예: 1,000,000"
                />
              </div>

              {/* Bank Info */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">송금 정보 (선택)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      은행명
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={editingExpense.bankName}
                      onChange={(e) => handleEditChange('bankName', e.target.value)}
                      placeholder="예: 국민은행"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={editingExpense.accountNumber}
                      onChange={(e) => handleEditChange('accountNumber', e.target.value)}
                      placeholder="예: 123-45-678910"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예금주
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={editingExpense.accountHolder}
                      onChange={(e) => handleEditChange('accountHolder', e.target.value)}
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
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={editingExpense.description}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  placeholder="지출 내용을 설명해주세요"
                />
              </div>

              {/* Receipt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 영수증 업로드 (선택)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={handleFileChange}
                />
                {editingExpense.receipt && (
                  <p className="mt-2 text-sm text-gray-600">선택된 파일: {editingExpense.receipt.name}</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingExpense(null)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 영수증 미리보기 모달 */}
      {showReceiptModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">지출 상세 정보</h3>
                <button
                  onClick={handleCloseReceipt}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* 프로젝트 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">프로젝트 정보</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">프로젝트:</span> {selectedExpense.projectName}
                  </p>
                </div>

                {/* 지출 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">지출 정보</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">카테고리:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">{selectedExpense.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">금액:</span>
                      <span className="ml-2 font-bold text-lg">{selectedExpense.amount?.toLocaleString()} {selectedExpense.currency}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">설명:</span>
                      <p className="mt-1 text-gray-800">{selectedExpense.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">요청자:</span>
                      <span className="ml-2">{selectedExpense.requester}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">요청일:</span>
                      <span className="ml-2">{formatDate(selectedExpense.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">상태:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedExpense.status === '승인완료' ? 'bg-green-100 text-green-800' :
                        selectedExpense.status === '반려' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedExpense.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 은행 정보 */}
                {(selectedExpense.bankName || selectedExpense.accountNumber || selectedExpense.accountHolder) && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">계좌 정보</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {selectedExpense.bankName && (
                        <div>
                          <span className="font-medium text-gray-600">은행:</span>
                          <span className="ml-2">{selectedExpense.bankName}</span>
                        </div>
                      )}
                      {selectedExpense.accountNumber && (
                        <div>
                          <span className="font-medium text-gray-600">계좌번호:</span>
                          <span className="ml-2">{selectedExpense.accountNumber}</span>
                        </div>
                      )}
                      {selectedExpense.accountHolder && (
                        <div>
                          <span className="font-medium text-gray-600">예금주:</span>
                          <span className="ml-2">{selectedExpense.accountHolder}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 영수증 이미지 */}
                {selectedExpense.receiptPath ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">영수증</h4>
                    <div className="flex justify-center">
                      <img
                        src={`http://localhost:5000${selectedExpense.receiptPath}`}
                        alt="영수증"
                        className="max-w-full h-auto rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E영수증 없음%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <p className="text-gray-500">첨부된 영수증이 없습니다</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseReceipt}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

