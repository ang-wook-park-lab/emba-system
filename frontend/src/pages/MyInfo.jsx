import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/axios'

export default function MyInfo() {
  const { user } = useAuth()
  const canApprove = user?.role === 'approver' || user?.role === 'admin'
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  // 승인자/관리자는 승인 대기 목록을 먼저 보여줌
  const [activeTab, setActiveTab] = useState(canApprove ? 'approvals' : 'info')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

  useEffect(() => {
    if (canApprove) {
      fetchPendingApprovals()
    } else {
      setLoading(false)
    }
  }, [user, canApprove])

  const fetchPendingApprovals = async () => {
    setLoading(true)
    try {
      const response = await api.get('/expenses/pending')
      setPendingApprovals(response.data.expenses || [])
      console.log('승인 대기 목록:', response.data.expenses)
    } catch (error) {
      console.error('승인 대기 목록 조회 실패:', error)
      setPendingApprovals([])
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '. ')
  }

  const handleApprove = async (approvalId) => {
    if (!confirm('이 지출을 승인하시겠습니까?')) return
    
    try {
      const response = await api.post(`/approvals/${approvalId}/approve`)
      alert(response.data.message || '승인이 완료되었습니다.')
      fetchPendingApprovals()
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
      fetchPendingApprovals()
    } catch (error) {
      console.error('반려 실패:', error)
      alert(error.response?.data?.message || '반려 처리에 실패했습니다.')
    }
  }

  // 영수증 미리보기 열기
  const handleShowReceipt = (expense) => {
    setSelectedExpense(expense)
    setShowReceiptModal(true)
  }

  // 영수증 미리보기 닫기
  const handleCloseReceipt = () => {
    setShowReceiptModal(false)
    setSelectedExpense(null)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내정보</h1>
        <p className="text-gray-600">관리자 정보를 확인하세요</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          {canApprove && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'approvals'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              승인 대기 목록
              {pendingApprovals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            내 정보
          </button>
        </div>
      </div>

      {/* 승인 대기 목록 탭 */}
      {activeTab === 'approvals' && canApprove && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">승인 대기 중인 작업</h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'admin' ? '관리자' : '승인자'} 권한으로 승인/거절할 수 있습니다.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">승인 대기 중인 작업이 없습니다</h3>
              <p className="text-gray-600">
                현재 승인이 필요한 지출 요청이 없습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      프로젝트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApprovals.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.requesterName || '알 수 없음'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleShowReceipt(expense)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {expense.projectName || '알 수 없음'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs">
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded mr-2">
                            {expense.category}
                          </span>
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {expense.amount?.toLocaleString()} {expense.currency || 'KRW'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {(() => {
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
                                      title="지출 승인 (관리자)"
                                    >
                                      승인
                                    </button>
                                    <button
                                      onClick={() => handleReject(pendingApproval.id)}
                                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      title="지출 거절 (관리자)"
                                    >
                                      거절
                                    </button>
                                  </>
                                )
                              }
                            } else {
                              // 일반 승인자는 자신의 승인 레코드만 처리 가능
                              const myApproval = expense.approvals?.find(a => 
                                parseInt(a.approverId) === parseInt(user.id) && a.status === '대기중'
                              )
                              
                              if (myApproval) {
                                return (
                                  <>
                                    <button
                                      onClick={() => handleApprove(myApproval.id)}
                                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                      title="지출 승인"
                                    >
                                      승인
                                    </button>
                                    <button
                                      onClick={() => handleReject(myApproval.id)}
                                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      title="지출 거절"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 내 정보 탭 */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-purple-600 text-3xl font-bold shadow-lg">
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{user?.name || '사용자'}</h2>
                <p className="text-purple-100 mt-1">@{user?.email?.split('@')[0] || 'user'}</p>
              </div>
            </div>
          </div>

          {/* 정보 섹션 */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 아이디 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">아이디</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.email?.split('@')[0] || '-'}
                </p>
              </div>

              {/* 이름 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">이름</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name || '-'}</p>
              </div>

              {/* 이메일 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">이메일</p>
                <p className="text-lg font-semibold text-gray-900">{user?.email || '-'}</p>
              </div>

              {/* 핸드폰 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">핸드폰</p>
                <p className="text-lg font-semibold text-gray-900">{user?.phone || '-'}</p>
              </div>

              {/* 권한 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">권한</p>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleName(user?.role)}
                </span>
              </div>

              {/* 부서 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">부서</p>
                <p className="text-lg font-semibold text-gray-900">{user?.department || '-'}</p>
              </div>

              {/* 직급/직책 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">직급/직책</p>
                <p className="text-lg font-semibold text-gray-900">{user?.position || '-'}</p>
              </div>

              {/* 가입일 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-500 mb-1">가입일</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(user?.createdAt)}</p>
              </div>

              {/* 최종 접속일 */}
              <div className="border-l-4 border-purple-500 pl-4 md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">최종 접속일</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(new Date())}</p>
              </div>
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
                    <span className="font-medium">프로젝트:</span> {selectedExpense.projectName || '알 수 없음'}
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
                      <span className="ml-2 font-bold text-lg">{selectedExpense.amount?.toLocaleString()} {selectedExpense.currency || 'KRW'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">설명:</span>
                      <p className="mt-1 text-gray-800">{selectedExpense.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">요청자:</span>
                      <span className="ml-2">{selectedExpense.requesterName || '알 수 없음'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">요청일:</span>
                      <span className="ml-2">{formatDate(selectedExpense.createdAt)}</span>
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

