import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [approvedExpenses, setApprovedExpenses] = useState([])
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    projectCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 병렬로 모든 데이터 가져오기
      const [approvedResponse, pendingResponse, projectsResponse] = await Promise.all([
        api.get('/expenses?status=승인완료'),
        api.get('/expenses?status=승인중'),
        api.get('/projects')
      ])

      console.log('대시보드 데이터:', { 
        approved: approvedResponse.data, 
        pending: pendingResponse.data,
        projects: projectsResponse.data
      })

      // 승인된 지출 데이터 변환
      const approvedExpensesData = (approvedResponse.data.expenses || []).map(expense => ({
        id: expense.id,
        projectName: expense.project?.name || expense.projectName || '-',
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency || 'KRW',
        requester: expense.requester?.name || expense.requesterName || '-',
        approvedBy: expense.approvals?.[0]?.approverName || '-', // 첫 번째 승인자
        approvedDate: expense.updatedAt ? new Date(expense.updatedAt).toISOString().split('T')[0] : '-',
        description: expense.description
      }))

      // 통계 계산
      const totalAmount = approvedExpensesData.reduce((sum, expense) => sum + expense.amount, 0)
      const pendingCount = pendingResponse.data.expenses?.length || 0
      const approvedCount = approvedExpensesData.length
      const projectCount = projectsResponse.data.projects?.length || 0

      setApprovedExpenses(approvedExpensesData)
      setStats({
        totalAmount,
        pendingCount,
        approvedCount,
        projectCount
      })
      setLoading(false)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      setApprovedExpenses([])
      setStats({
        totalAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        projectCount: 0
      })
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  if (loading) {
    return <div className="p-8">로딩 중...</div>
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>대시보드</span>
        </h1>
        <p className="text-gray-600 mt-2">승인된 결제 내역을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 승인 금액</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pendingCount}건</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 완료</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.approvedCount}건</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">프로젝트 수</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.projectCount}개</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Expenses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">승인된 결제 내역</h2>
            <p className="text-sm text-gray-600 mt-1">총 {approvedExpenses.length}개</p>
          </div>
          <Link
            to="/expenses/request"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>지출 요청</span>
          </Link>
        </div>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    승인된 결제 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                approvedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.requester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.approvedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.approvedDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

