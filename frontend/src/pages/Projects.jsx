import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [newProject, setNewProject] = useState({
    name: '',
    budget: '',
    status: '진행중',
    startDate: '',
    endDate: '',
    participants: '',
    approvers: ''
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [sponsorships, setSponsorships] = useState([])
  const [newSponsorship, setNewSponsorship] = useState({
    type: '현금',
    sponsorName: '',
    amount: '',
    itemName: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailProject, setDetailProject] = useState(null)

  // 관리자 권한 확인
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      const projectsData = response.data.projects || []
      
      // 각 프로젝트의 후원 및 참석자 통계 가져오기
      const projectsWithDetails = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const [sponsorshipResponse, participantResponse] = await Promise.all([
              api.get(`/sponsorships/stats/${project.id}`),
              api.get(`/participants/stats/${project.id}`)
            ])
            
            return {
              ...project,
              sponsorshipTotal: sponsorshipResponse.data.stats?.total || 0,
              sponsorshipStats: sponsorshipResponse.data.stats || { cash: {count: 0, amount: 0}, item: {count: 0, amount: 0}, total: 0 },
              participantStats: participantResponse.data.stats || { professor: 0, vip: 0, external: 0, alumni: 0, student: 0, other: 0, total: 0 }
            }
          } catch (error) {
            console.error(`프로젝트 ${project.id} 상세 정보 로드 실패:`, error)
            return {
              ...project,
              sponsorshipTotal: 0,
              sponsorshipStats: { cash: {count: 0, amount: 0}, item: {count: 0, amount: 0}, total: 0 },
              participantStats: { professor: 0, vip: 0, external: 0, alumni: 0, student: 0, other: 0, total: 0 }
            }
          }
        })
      )
      
      setProjects(projectsWithDetails)
      setLoading(false)
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      setProjects([])
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
    if (!startDate) return '-'
    const start = startDate
    const end = endDate || '진행중'
    return `${start} ~ ${end}`
  }

  const handleAddProject = () => {
    setNewProject({
      name: '',
      budget: '',
      status: '진행중',
      startDate: '',
      endDate: '',
      participants: '',
      approvers: ''
    })
    setShowAddModal(true)
  }

  const handleNewProjectChange = (field, value) => {
    setNewProject(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 금액 포맷팅 함수
  const formatNumberWithCommas = (value) => {
    if (!value) return ''
    const numbers = value.toString().replace(/[^\d]/g, '')
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 예산 입력 핸들러
  const handleBudgetChange = (e) => {
    const value = e.target.value
    const numbers = value.replace(/[^\d]/g, '')
    setNewProject(prev => ({
      ...prev,
      budget: numbers
    }))
  }

  // 편집 모드 예산 입력 핸들러
  const handleEditBudgetChange = (e) => {
    const value = e.target.value
    const numbers = value.replace(/[^\d]/g, '')
    setEditingProject(prev => ({
      ...prev,
      budget: numbers
    }))
  }

  // 후원 금액 입력 핸들러
  const handleSponsorshipAmountChange = (e) => {
    const value = e.target.value
    const numbers = value.replace(/[^\d]/g, '')
    setNewSponsorship(prev => ({
      ...prev,
      amount: numbers
    }))
  }

  const handleSaveNewProject = async () => {
    // 유효성 검사
    if (!newProject.name.trim()) {
      alert('프로젝트 이름을 입력해주세요.')
      return
    }
    if (!newProject.budget || isNaN(newProject.budget) || Number(newProject.budget) <= 0) {
      alert('올바른 예산을 입력해주세요.')
      return
    }
    if (!newProject.startDate) {
      alert('시작일을 입력해주세요.')
      return
    }

    try {
      // 백엔드 API로 프로젝트 생성
      const projectData = {
        name: newProject.name.trim(),
        budget: Number(newProject.budget),
        status: newProject.status,
        startDate: newProject.startDate,
        endDate: newProject.endDate || null,
        participants: newProject.participants || null,
        approvers: newProject.approvers || null
      }

      await api.post('/projects', projectData)
      
      setShowAddModal(false)
      alert('프로젝트가 추가되었습니다.')
      
      // 프로젝트 목록 새로고침
      fetchProjects()
    } catch (error) {
      console.error('프로젝트 추가 실패:', error)
      alert(error.response?.data?.message || '프로젝트 추가에 실패했습니다.')
    }
  }

  // 프로젝트 상세보기
  const handleShowDetail = async (project) => {
    setDetailProject(project)
    await fetchSponsorships(project.id)
    setShowDetailModal(true)
  }

  const handleEditProject = async (project) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      budget: project.budget,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate || '',
      participants: Array.isArray(project.participants) ? project.participants.join(', ') : project.participants || '',
      approvers: Array.isArray(project.approvers) ? project.approvers.join(', ') : project.approvers || ''
    })
    
    // 후원 내역 가져오기
    await fetchSponsorships(project.id)
    
    setShowEditModal(true)
  }

  // 후원 내역 조회
  const fetchSponsorships = async (projectId) => {
    try {
      const response = await api.get(`/sponsorships?projectId=${projectId}`)
      setSponsorships(response.data.sponsorships || [])
    } catch (error) {
      console.error('후원 내역 조회 실패:', error)
      setSponsorships([])
    }
  }

  // 후원 추가
  const handleAddSponsorship = async () => {
    if (!editingProject) return

    // 유효성 검사
    if (!newSponsorship.sponsorName.trim()) {
      alert('협찬자명을 입력해주세요.')
      return
    }
    if (newSponsorship.type === '현금' && (!newSponsorship.amount || isNaN(newSponsorship.amount) || Number(newSponsorship.amount) <= 0)) {
      alert('현금 협찬은 금액을 입력해주세요.')
      return
    }
    if (newSponsorship.type === '물품' && !newSponsorship.itemName.trim()) {
      alert('물품 찬조는 물품명을 입력해주세요.')
      return
    }

    try {
      await api.post('/sponsorships', {
        projectId: editingProject.id,
        type: newSponsorship.type,
        sponsorName: newSponsorship.sponsorName,
        amount: newSponsorship.type === '현금' ? Number(newSponsorship.amount) : 0,
        itemName: newSponsorship.type === '물품' ? newSponsorship.itemName : null,
        quantity: newSponsorship.quantity ? Number(newSponsorship.quantity) : null,
        date: newSponsorship.date,
        notes: newSponsorship.notes
      })
      
      // 초기화
      setNewSponsorship({
        type: '현금',
        sponsorName: '',
        amount: '',
        itemName: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      // 후원 목록 새로고침
      await fetchSponsorships(editingProject.id)
      
      alert('후원 내역이 추가되었습니다.')
    } catch (error) {
      console.error('후원 추가 실패:', error)
      alert(error.response?.data?.message || '후원 추가에 실패했습니다.')
    }
  }

  // 후원 삭제
  const handleDeleteSponsorship = async (sponsorshipId) => {
    if (!confirm('이 후원 내역을 삭제하시겠습니까?')) return

    try {
      await api.delete(`/sponsorships/${sponsorshipId}`)
      await fetchSponsorships(editingProject.id)
      await fetchProjects() // 프로젝트 목록도 새로고침 (후원 총액 업데이트)
      alert('후원 내역이 삭제되었습니다.')
    } catch (error) {
      console.error('후원 삭제 실패:', error)
      alert(error.response?.data?.message || '후원 삭제에 실패했습니다.')
    }
  }

  const handleEditProjectChange = (field, value) => {
    setEditingProject(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEditProject = async () => {
    // 유효성 검사
    if (!editingProject.name.trim()) {
      alert('프로젝트 이름을 입력해주세요.')
      return
    }
    if (!editingProject.budget || isNaN(editingProject.budget) || Number(editingProject.budget) <= 0) {
      alert('올바른 예산을 입력해주세요.')
      return
    }
    if (!editingProject.startDate) {
      alert('시작일을 입력해주세요.')
      return
    }

    try {
      const updateData = {
        name: editingProject.name.trim(),
        budget: Number(editingProject.budget),
        status: editingProject.status,
        startDate: editingProject.startDate,
        endDate: editingProject.endDate || null,
        participants: editingProject.participants || null,
        approvers: editingProject.approvers || null
      }

      await api.put(`/projects/${editingProject.id}`, updateData)
      
      setShowEditModal(false)
      setEditingProject(null)
      alert('프로젝트가 수정되었습니다.')
      
      // 프로젝트 목록 새로고침
      fetchProjects()
    } catch (error) {
      console.error('프로젝트 수정 실패:', error)
      alert(error.response?.data?.message || '프로젝트 수정에 실패했습니다.')
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!confirm('정말 이 프로젝트를 삭제하시겠습니까?')) return
    
    try {
      await api.delete(`/projects/${projectId}`)
      alert('프로젝트가 삭제되었습니다.')
      
      // 프로젝트 목록 새로고침
      fetchProjects()
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error)
      alert(error.response?.data?.message || '프로젝트 삭제에 실패했습니다.')
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterProject === 'all' || project.id === parseInt(filterProject)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>프로젝트 관리</span>
        </h1>
        <p className="text-gray-600 mt-2">프로젝트별 지출을 관리하세요</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {isAdmin && (
            <button
              onClick={handleAddProject}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>프로젝트 추가</span>
            </button>
          )}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="all">전체 프로젝트</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="검색 (프로젝트명)"
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

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">프로젝트 목록</h2>
          <p className="text-sm text-gray-600 mt-1">총 {filteredProjects.length}개</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예산</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">후원</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지출</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">잔액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참석자</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                    프로젝트가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const remaining = project.budget - project.spent
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleShowDetail(project)}
                          className="text-purple-600 hover:text-purple-900 hover:underline font-semibold"
                        >
                          {project.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDateRange(project.startDate, project.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(project.budget)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-medium">
                            {formatCurrency(project.sponsorshipTotal || 0)}
                          </span>
                          {project.sponsorshipStats && (project.sponsorshipStats.cash.count > 0 || project.sponsorshipStats.item.count > 0) && (
                            <span className="text-xs text-gray-500 mt-1">
                              현금 {project.sponsorshipStats.cash.count}건, 물품 {project.sponsorshipStats.item.count}건
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(project.spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={remaining >= 0 ? 'text-blue-600' : 'text-red-600'}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === '진행중' ? 'bg-green-100 text-green-800' :
                          project.status === '완료' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {project.participantStats && project.participantStats.total > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">총 {project.participantStats.total}명</span>
                            <span className="text-xs text-gray-500 mt-1">
                              교수 {project.participantStats.professor}, VIP {project.participantStats.vip}, 
                              외부 {project.participantStats.external}, 동문 {project.participantStats.alumni}, 
                              학생 {project.participantStats.student}, 기타 {project.participantStats.other}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            onClick={() => handleEditProject(project)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 프로젝트 수정 모달 */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-900">프로젝트 수정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => handleEditProjectChange('name', e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예산 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(editingProject.budget)}
                    onChange={handleEditBudgetChange}
                    placeholder="예산 (원)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => handleEditProjectChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                    <option value="대기">대기</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editingProject.startDate}
                    onChange={(e) => handleEditProjectChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={editingProject.endDate}
                    onChange={(e) => handleEditProjectChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  참석자
                </label>
                <input
                  type="text"
                  value={editingProject.participants}
                  onChange={(e) => handleEditProjectChange('participants', e.target.value)}
                  placeholder="참석자 이름을 쉼표로 구분하여 입력 (예: 홍길동, 김철수)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">쉼표(,)로 구분하여 여러 명을 입력할 수 있습니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  승인자
                </label>
                <input
                  type="text"
                  value={editingProject.approvers}
                  onChange={(e) => handleEditProjectChange('approvers', e.target.value)}
                  placeholder="승인자 이름을 쉼표로 구분하여 입력 (예: 김승인, 이승인)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">쉼표(,)로 구분하여 여러 명을 입력할 수 있습니다</p>
              </div>

              {/* 후원 내역 섹션 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">후원 내역</h3>
                
                {/* 후원 목록 */}
                {sponsorships.length > 0 ? (
                  <div className="mb-4 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">날짜</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">유형</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">협찬자</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">내용</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">금액</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">작업</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sponsorships.map((sponsorship) => (
                          <tr key={sponsorship.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{new Date(sponsorship.date).toLocaleDateString('ko-KR')}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                sponsorship.type === '현금' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {sponsorship.type}
                              </span>
                            </td>
                            <td className="px-3 py-2">{sponsorship.sponsorName}</td>
                            <td className="px-3 py-2">
                              {sponsorship.type === '현금' ? (
                                <span>{sponsorship.notes || '-'}</span>
                              ) : (
                                <span>
                                  {sponsorship.itemName}
                                  {sponsorship.quantity && ` (${sponsorship.quantity}개)`}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {sponsorship.type === '현금' ? formatCurrency(sponsorship.amount) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleDeleteSponsorship(sponsorship.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-gray-50 rounded text-center text-sm text-gray-500">
                    등록된 후원 내역이 없습니다
                  </div>
                )}

                {/* 후원 추가 폼 */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-medium text-gray-900">새 후원 추가</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">유형</label>
                      <select
                        value={newSponsorship.type}
                        onChange={(e) => setNewSponsorship(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="현금">현금 협찬</option>
                        <option value="물품">물품 찬조</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">날짜 <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={newSponsorship.date}
                        onChange={(e) => setNewSponsorship(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">협찬자명 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newSponsorship.sponsorName}
                      onChange={(e) => setNewSponsorship(prev => ({ ...prev, sponsorName: e.target.value }))}
                      placeholder="협찬자 이름"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {newSponsorship.type === '현금' ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">금액 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(newSponsorship.amount)}
                        onChange={handleSponsorshipAmountChange}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">물품명 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={newSponsorship.itemName}
                          onChange={(e) => setNewSponsorship(prev => ({ ...prev, itemName: e.target.value }))}
                          placeholder="물품 이름"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">수량</label>
                        <input
                          type="number"
                          value={newSponsorship.quantity}
                          onChange={(e) => setNewSponsorship(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
                    <input
                      type="text"
                      value={newSponsorship.notes}
                      onChange={(e) => setNewSponsorship(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="추가 설명 (선택)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleAddSponsorship}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    후원 추가
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEditProject}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProject(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-900">새 프로젝트 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => handleNewProjectChange('name', e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예산 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(newProject.budget)}
                    onChange={handleBudgetChange}
                    placeholder="예산 (원)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => handleNewProjectChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                    <option value="대기">대기</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => handleNewProjectChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => handleNewProjectChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  참석자
                </label>
                <input
                  type="text"
                  value={newProject.participants}
                  onChange={(e) => handleNewProjectChange('participants', e.target.value)}
                  placeholder="참석자 이름을 쉼표로 구분하여 입력 (예: 홍길동, 김철수)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">쉼표(,)로 구분하여 여러 명을 입력할 수 있습니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  승인자
                </label>
                <input
                  type="text"
                  value={newProject.approvers}
                  onChange={(e) => handleNewProjectChange('approvers', e.target.value)}
                  placeholder="승인자 이름을 쉼표로 구분하여 입력 (예: 김승인, 이승인)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">쉼표(,)로 구분하여 여러 명을 입력할 수 있습니다</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveNewProject}
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

      {/* 프로젝트 상세 관리 모달 */}
      {showDetailModal && detailProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{detailProject.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">프로젝트 전체 관리</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* 프로젝트 개요 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">예산</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(detailProject.budget)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">후원 총액</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(detailProject.sponsorshipTotal || 0)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">지출</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(detailProject.spent)}</p>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">상태:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      detailProject.status === '진행중' ? 'bg-green-100 text-green-800' :
                      detailProject.status === '완료' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {detailProject.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">기간:</span>
                    <span className="ml-2">{formatDateRange(detailProject.startDate, detailProject.endDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">참석자:</span>
                    <span className="ml-2">
                      {detailProject.participants && detailProject.participants.length > 0 
                        ? detailProject.participants.join(', ')
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">승인자:</span>
                    <span className="ml-2">
                      {detailProject.approvers && detailProject.approvers.length > 0 
                        ? detailProject.approvers.join(', ')
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 후원 내역 */}
              <div className="bg-white border rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">후원 내역</h3>
                {sponsorships.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">날짜</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">유형</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">협찬자</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">내용</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">금액</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sponsorships.map((sponsorship) => (
                          <tr key={sponsorship.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{new Date(sponsorship.date).toLocaleDateString('ko-KR')}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                sponsorship.type === '현금' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {sponsorship.type}
                              </span>
                            </td>
                            <td className="px-3 py-2">{sponsorship.sponsorName}</td>
                            <td className="px-3 py-2">
                              {sponsorship.type === '현금' ? (
                                <span>{sponsorship.notes || '-'}</span>
                              ) : (
                                <span>
                                  {sponsorship.itemName}
                                  {sponsorship.quantity && ` (${sponsorship.quantity}개)`}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {sponsorship.type === '현금' ? formatCurrency(sponsorship.amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">등록된 후원 내역이 없습니다</p>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    handleEditProject(detailProject)
                  }}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  프로젝트 편집
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
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

