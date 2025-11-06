import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/axios'

export default function Approvals() {
  const { user } = useAuth()
  const [pendingExpenses, setPendingExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [filterStatus, setFilterStatus] = useState('승인중') // 기본값: 승인중
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

  useEffect(() => {
    fetchPendingExpenses()
    fetchProjects()
  }, [filterStatus]) // filterStatus가 변경될 때마다 재조회

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data.projects || [])
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      setProjects([])
    }
  }

  const fetchPendingExpenses = async () => {
    setLoading(true)
    try {
      // 선택한 상태에 따라 지출 조회
      const statusParam = filterStatus === 'all' ? '' : `?status=${filterStatus}`
      const response = await api.get(`/expenses${statusParam}`)
      console.log('지출 목록:', response.data)
      
      // API 응답 데이터 변환
      const transformedExpenses = (response.data.expenses || []).map(expense => ({
        id: expense.id,
        projectName: expense.project?.name || expense.projectName || '-',
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency || 'KRW',
        requester: expense.requester?.name || expense.requesterName || '-',
        requestDate: expense.createdAt ? new Date(expense.createdAt).toISOString().split('T')[0] : '-',
        description: expense.description,
        receipt: expense.receiptFilename || null,
        receiptPath: expense.receiptPath || null,
        status: expense.status,
        approvals: expense.approvals || [],
        bankName: expense.bankName,
        accountNumber: expense.accountNumber,
        accountHolder: expense.accountHolder,
        createdAt: expense.createdAt
      }))
      
      setPendingExpenses(transformedExpenses)
      setLoading(false)
    } catch (error) {
      console.error('승인 대기 내역 로드 실패:', error)
      setPendingExpenses([])
      setLoading(false)
    }
  }

  const handleApprove = async (approvalId) => {
    if (!confirm('이 지출을 승인하시겠습니까?')) return
    
    try {
      const response = await api.post(`/approvals/${approvalId}/approve`)
      alert(response.data.message || '승인이 완료되었습니다.')
      fetchPendingExpenses()
    } catch (error) {
      console.error('승인 실패:', error)
      alert(error.response?.data?.message || '승인 처리에 실패했습니다.')
    }
  }

  const handleReject = async (approvalId) => {
    const comment = prompt('반려 사유를 입력해주세요:')
    if (!comment) return

    try {
      const response = await api.post(`/approvals/${approvalId}/reject`, { comment })
      alert(response.data.message || '반려가 완료되었습니다.')
      fetchPendingExpenses()
    } catch (error) {
      console.error('반려 실패:', error)
      alert(error.response?.data?.message || '반려 처리에 실패했습니다.')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const filteredExpenses = pendingExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.requester.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = filterProject === 'all' || expense.projectName === filterProject
    return matchesSearch && matchesProject
  })

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>승인 관리</span>
        </h1>
        <p className="text-gray-600 mt-2">지출 요청 승인 현황을 확인하고 처리하세요</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="승인중">승인 대기중</option>
              <option value="승인완료">승인 완료</option>
              <option value="반려">반려됨</option>
              <option value="all">전체</option>
            </select>
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
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {filterStatus === '승인중' ? '승인 대기 목록' : 
             filterStatus === '승인완료' ? '승인 완료 목록' : 
             filterStatus === '반려' ? '반려 목록' : '전체 지출 목록'}
          </h2>
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
                    {filterStatus === '승인중' ? '승인 대기 중인 지출 요청이 없습니다.' :
                     filterStatus === '승인완료' ? '승인 완료된 지출이 없습니다.' :
                     filterStatus === '반려' ? '반려된 지출이 없습니다.' :
                     '지출 요청이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.requester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        expense.status === '승인완료' ? 'bg-green-100 text-green-800' :
                        expense.status === '승인중' ? 'bg-yellow-100 text-yellow-800' :
                        expense.status === '반려' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {(() => {
                          // 승인 완료나 반려된 항목은 작업 불가
                          if (expense.status === '승인완료') {
                            return <span className="text-green-600 text-xs font-medium">✓ 승인 완료</span>
                          }
                          if (expense.status === '반려') {
                            return <span className="text-red-600 text-xs font-medium">✗ 반려됨</span>
                          }
                          if (expense.status !== '승인중') {
                            return <span className="text-gray-400 text-xs">-</span>
                          }
                          
                          // 승인중인 항목만 처리 가능
                          // 관리자는 모든 승인 처리 가능
                          if (user?.role === 'admin') {
                            // 대기중인 approval 찾기 (아무거나 하나)
                            const pendingApproval = expense.approvals?.find(a => a.status === '대기중')
                            
                            if (pendingApproval) {
                              return (
                                <>
                                  <button
                                    onClick={() => handleApprove(pendingApproval.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    title="관리자 권한으로 승인"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => handleReject(pendingApproval.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    title="관리자 권한으로 거절"
                                  >
                                    거절
                                  </button>
                                </>
                              )
                            }
                          } else {
                            // 일반 승인자는 자신의 승인 레코드만 처리 가능
                            const myApproval = expense.approvals?.find(a => 
                              parseInt(a.approverId) === parseInt(user?.id) && a.status === '대기중'
                            )
                            
                            if (myApproval) {
                              return (
                                <>
                                  <button
                                    onClick={() => handleApprove(myApproval.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => handleReject(myApproval.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    거절
                                  </button>
                                </>
                              )
                            }
                          }
                          return <span className="text-gray-400 text-xs">승인 권한 없음</span>
                        })()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

                {/* 승인 현황 */}
                {selectedExpense.approvals && selectedExpense.approvals.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">승인 현황</h4>
                    <div className="space-y-2">
                      {selectedExpense.approvals.map((approval, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{approval.approverName || '알 수 없음'}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            approval.status === '승인' ? 'bg-green-100 text-green-800' :
                            approval.status === '반려' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {approval.status}
                          </span>
                        </div>
                      ))}
                    </div>
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

