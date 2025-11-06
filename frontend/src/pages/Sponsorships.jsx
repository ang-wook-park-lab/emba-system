import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'

export default function Sponsorships() {
  const { user } = useAuth()
  const [sponsorships, setSponsorships] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSponsorship, setNewSponsorship] = useState({
    projectId: '',
    type: '현금',
    sponsorName: '',
    amount: '',
    itemName: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSponsorship, setSelectedSponsorship] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSponsorship, setEditingSponsorship] = useState(null)

  useEffect(() => {
    fetchSponsorships()
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

  const fetchSponsorships = async () => {
    setLoading(true)
    try {
      const response = await api.get('/sponsorships')
      
      // 후원 데이터에 프로젝트 이름 및 날짜 추가
      const sponsorshipsWithProject = (response.data.sponsorships || []).map(sponsorship => {
        const project = projects.find(p => p.id === sponsorship.projectId)
        return {
          ...sponsorship,
          projectName: project?.name || '알 수 없음',
          projectStartDate: project?.startDate || null,
          projectEndDate: project?.endDate || null
        }
      })
      
      setSponsorships(sponsorshipsWithProject)
      setLoading(false)
    } catch (error) {
      console.error('후원 내역 로드 실패:', error)
      setSponsorships([])
      setLoading(false)
    }
  }

  // 프로젝트가 로드된 후 후원 데이터 다시 가져오기
  useEffect(() => {
    if (projects.length > 0 && sponsorships.length > 0) {
      const sponsorshipsWithProject = sponsorships.map(sponsorship => {
        const project = projects.find(p => p.id === sponsorship.projectId)
        return {
          ...sponsorship,
          projectName: project?.name || '알 수 없음',
          projectStartDate: project?.startDate || null,
          projectEndDate: project?.endDate || null
        }
      })
      setSponsorships(sponsorshipsWithProject)
    }
  }, [projects])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
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

  // 후원 추가 핸들러
  const handleAddSponsorship = async () => {
    // 유효성 검사
    if (!newSponsorship.projectId) {
      alert('프로젝트를 선택해주세요.')
      return
    }
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
        projectId: Number(newSponsorship.projectId),
        type: newSponsorship.type,
        sponsorName: newSponsorship.sponsorName.trim(),
        amount: newSponsorship.type === '현금' ? Number(newSponsorship.amount) : 0,
        itemName: newSponsorship.type === '물품' ? newSponsorship.itemName : null,
        quantity: newSponsorship.quantity ? Number(newSponsorship.quantity) : null,
        date: newSponsorship.date,
        notes: newSponsorship.notes || null
      })

      // 초기화
      setNewSponsorship({
        projectId: '',
        type: '현금',
        sponsorName: '',
        amount: '',
        itemName: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })

      setShowAddModal(false)
      alert('후원 내역이 추가되었습니다.')
      fetchSponsorships()
    } catch (error) {
      console.error('후원 추가 실패:', error)
      alert(error.response?.data?.message || '후원 추가에 실패했습니다.')
    }
  }

  const handleNewSponsorshipChange = (field, value) => {
    // 프로젝트 선택 시 해당 프로젝트의 시작일을 자동으로 날짜에 반영
    if (field === 'projectId' && value) {
      const selectedProject = projects.find(p => p.id === parseInt(value))
      if (selectedProject && selectedProject.startDate) {
        setNewSponsorship(prev => ({
          ...prev,
          projectId: value,
          date: selectedProject.startDate
        }))
        return
      }
    }
    
    setNewSponsorship(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 금액 포맷팅 함수
  const formatNumberWithCommas = (value) => {
    if (!value) return ''
    // 숫자만 추출
    const numbers = value.toString().replace(/[^\d]/g, '')
    // 3자리마다 쉼표 추가
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 금액 입력 핸들러
  const handleAmountChange = (e) => {
    const value = e.target.value
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    // 포맷팅된 값으로 저장
    setNewSponsorship(prev => ({
      ...prev,
      amount: numbers
    }))
  }

  // 후원 상세보기 핸들러
  const handleShowDetail = (sponsorship) => {
    setSelectedSponsorship(sponsorship)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSponsorship(null)
  }

  // 후원 수정 핸들러
  const handleEditSponsorship = (sponsorship) => {
    setEditingSponsorship({
      id: sponsorship.id,
      projectId: sponsorship.projectId,
      type: sponsorship.type,
      sponsorName: sponsorship.sponsorName,
      amount: sponsorship.amount || '',
      itemName: sponsorship.itemName || '',
      quantity: sponsorship.quantity || '',
      date: sponsorship.date,
      notes: sponsorship.notes || ''
    })
    setShowEditModal(true)
  }

  // 후원 수정 저장
  const handleSaveEdit = async () => {
    // 유효성 검사
    if (!editingSponsorship.sponsorName.trim()) {
      alert('협찬자명을 입력해주세요.')
      return
    }
    if (editingSponsorship.type === '현금' && (!editingSponsorship.amount || isNaN(editingSponsorship.amount) || Number(editingSponsorship.amount) <= 0)) {
      alert('현금 협찬은 금액을 입력해주세요.')
      return
    }
    if (editingSponsorship.type === '물품' && !editingSponsorship.itemName.trim()) {
      alert('물품 찬조는 물품명을 입력해주세요.')
      return
    }

    try {
      await api.put(`/sponsorships/${editingSponsorship.id}`, {
        projectId: Number(editingSponsorship.projectId),
        type: editingSponsorship.type,
        sponsorName: editingSponsorship.sponsorName.trim(),
        amount: editingSponsorship.amount ? Number(editingSponsorship.amount) : 0,
        itemName: editingSponsorship.itemName || null,
        quantity: editingSponsorship.quantity ? Number(editingSponsorship.quantity) : null,
        date: editingSponsorship.date,
        notes: editingSponsorship.notes || null
      })

      setShowEditModal(false)
      setEditingSponsorship(null)
      alert('후원 내역이 수정되었습니다.')
      fetchSponsorships()
    } catch (error) {
      console.error('후원 수정 실패:', error)
      alert(error.response?.data?.message || '후원 수정에 실패했습니다.')
    }
  }

  // 후원 삭제 핸들러
  const handleDeleteSponsorship = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await api.delete(`/sponsorships/${id}`)
      alert('후원 내역이 삭제되었습니다.')
      fetchSponsorships()
    } catch (error) {
      console.error('후원 삭제 실패:', error)
      alert(error.response?.data?.message || '후원 삭제에 실패했습니다.')
    }
  }

  // 수정 모달의 금액 포맷팅 핸들러
  const handleEditAmountChange = (e) => {
    const value = e.target.value
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    // 포맷팅된 값으로 저장
    setEditingSponsorship(prev => ({
      ...prev,
      amount: numbers
    }))
  }

  // 엑셀 업로드 처리
  const handleExcelUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.')
      return
    }

    setIsUploading(true)

    try {
      // 파일 읽기
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      
      // 첫 번째 시트(사용 안내 제외)에서 데이터 읽기
      let sheetName = workbook.SheetNames[0]
      if (workbook.SheetNames.length > 1 && workbook.SheetNames[0] === '사용 안내') {
        sheetName = workbook.SheetNames[1]
      }
      
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        alert('엑셀 파일에 데이터가 없습니다.')
        setIsUploading(false)
        return
      }

      // 데이터 검증 및 변환
      const sponsorships = []
      const errors = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const rowNum = i + 2 // 엑셀 행 번호 (헤더 포함)

        // 프로젝트 ID 검증
        const projectId = parseInt(row['프로젝트ID'])
        if (isNaN(projectId)) {
          errors.push(`${rowNum}행: 프로젝트ID가 유효하지 않습니다.`)
          continue
        }
        const projectExists = projects.find(p => p.id === projectId)
        if (!projectExists) {
          errors.push(`${rowNum}행: 프로젝트ID ${projectId}는 존재하지 않는 프로젝트입니다.`)
          continue
        }

        // 유형 검증
        const type = String(row['유형']).trim()
        if (!['현금', '물품'].includes(type)) {
          errors.push(`${rowNum}행: 유형은 '현금' 또는 '물품'이어야 합니다.`)
          continue
        }

        // 협찬자명 검증
        const sponsorName = String(row['협찬자명'] || '').trim()
        if (!sponsorName) {
          errors.push(`${rowNum}행: 협찬자명을 입력해주세요.`)
          continue
        }

        // 현금 협찬인 경우 금액 검증
        if (type === '현금') {
          const amount = parseFloat(row['금액'])
          if (isNaN(amount) || amount <= 0) {
            errors.push(`${rowNum}행: 현금 협찬은 유효한 금액을 입력해주세요.`)
            continue
          }
        }

        // 물품 찬조인 경우 물품명 검증
        if (type === '물품') {
          const itemName = String(row['물품명'] || '').trim()
          if (!itemName) {
            errors.push(`${rowNum}행: 물품 찬조는 물품명을 입력해주세요.`)
            continue
          }
        }

        // 날짜 검증 및 변환
        let date = row['날짜']
        if (date) {
          if (typeof date === 'number') {
            // 엑셀 날짜 형식 변환
            const excelDate = new Date((date - 25569) * 86400 * 1000)
            date = excelDate.toISOString().split('T')[0]
          } else {
            date = String(date).trim()
          }
        } else {
          date = new Date().toISOString().split('T')[0]
        }

        sponsorships.push({
          projectId: projectId,
          type: type,
          sponsorName: sponsorName,
          amount: type === '현금' ? parseFloat(row['금액']) : (row['금액'] ? parseFloat(row['금액']) : 0),
          itemName: row['물품명'] ? String(row['물품명']).trim() : null,
          quantity: row['수량'] ? parseInt(row['수량']) : null,
          date: date,
          notes: row['메모'] ? String(row['메모']).trim() : null
        })
      }

      if (errors.length > 0) {
        alert(`다음 오류가 발견되었습니다:\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
        setIsUploading(false)
        return
      }

      if (sponsorships.length === 0) {
        alert('업로드할 유효한 데이터가 없습니다.')
        setIsUploading(false)
        return
      }

      // 백엔드에 전송
      const response = await api.post('/sponsorships/bulk', { sponsorships })

      if (response.data.success) {
        alert(response.data.message)
        setShowUploadModal(false)
        setSelectedFile(null)
        fetchSponsorships() // 데이터 새로고침
      }
    } catch (error) {
      console.error('엑셀 업로드 실패:', error)
      alert(error.response?.data?.message || '엑셀 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 엑셀 양식 다운로드
  const handleDownloadTemplate = () => {
    const guide = [
      { '항목': '사용 가능한 프로젝트 ID', '설명': '아래 프로젝트 중 하나의 ID를 사용하세요' }
    ]
    
    projects.forEach(p => {
      guide.push({
        '항목': `프로젝트 ID: ${p.id}`,
        '설명': p.name
      })
    })
    
    guide.push({ '항목': '', '설명': '' })
    guide.push({ '항목': '유형 입력', '설명': '현금 또는 물품을 입력하세요' })
    guide.push({ '항목': '⚠️ 중요', '설명': '각 항목은 셀에서 드롭다운으로 선택할 수 있습니다' })
    
    const template = [
      {
        '프로젝트ID': projects.length > 0 ? projects[0].id : '',
        '유형': '현금',
        '협찬자명': '홍길동',
        '물품명': '',
        '수량': '',
        '금액': '100000',
        '날짜': new Date().toISOString().split('T')[0],
        '메모': ''
      }
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(template)
    const guideSheet = XLSX.utils.json_to_sheet(guide)
    
    // 데이터 검증 추가 (드롭다운)
    if (!ws['!dataValidation']) ws['!dataValidation'] = []
    
    // 프로젝트 ID 드롭다운 (A열, 2행부터 100행까지)
    const projectIds = projects.map(p => p.id).join(',')
    if (projectIds) {
      ws['!dataValidation'].push({
        sqref: 'A2:A100',
        type: 'list',
        allowBlank: false,
        showDropDown: true,
        formula1: `"${projectIds}"`
      })
    }
    
    // 유형 드롭다운 (B열, 2행부터 100행까지)
    ws['!dataValidation'].push({
      sqref: 'B2:B100',
      type: 'list',
      allowBlank: false,
      showDropDown: true,
      formula1: '"현금,물품"'
    })
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 12 }, // 프로젝트ID
      { wch: 10 }, // 유형
      { wch: 15 }, // 협찬자명
      { wch: 20 }, // 물품명
      { wch: 10 }, // 수량
      { wch: 15 }, // 금액
      { wch: 12 }, // 날짜
      { wch: 25 }  // 메모
    ]
    
    XLSX.utils.book_append_sheet(wb, guideSheet, '사용 안내')
    XLSX.utils.book_append_sheet(wb, ws, '후원내역')
    XLSX.writeFile(wb, '후원_업로드_양식.xlsx')
  }

  const filteredSponsorships = sponsorships.filter(sponsorship => {
    const matchesSearch = 
      sponsorship.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sponsorship.itemName && sponsorship.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sponsorship.notes && sponsorship.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesProject = filterProject === 'all' || sponsorship.projectId === parseInt(filterProject)
    const matchesType = filterType === 'all' || sponsorship.type === filterType
    
    return matchesSearch && matchesProject && matchesType
  })

  // 통계 계산
  const stats = {
    total: filteredSponsorships.length,
    cashCount: filteredSponsorships.filter(s => s.type === '현금').length,
    itemCount: filteredSponsorships.filter(s => s.type === '물품').length,
    totalAmount: filteredSponsorships
      .filter(s => s.type === '현금')
      .reduce((sum, s) => sum + s.amount, 0)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span>후원 관리</span>
        </h1>
        <p className="text-gray-600 mt-2">모든 프로젝트의 후원 내역을 통합 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">총 후원 건수</p>
          <p className="text-2xl font-bold text-purple-600">{stats.total}건</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">현금 협찬</p>
          <p className="text-2xl font-bold text-green-600">{stats.cashCount}건</p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">물품 찬조</p>
          <p className="text-2xl font-bold text-blue-600">{stats.itemCount}건</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">평균 협찬 금액</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.cashCount > 0 ? formatCurrency(stats.totalAmount / stats.cashCount) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap"
          >
            + 후원 추가
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap flex items-center gap-2"
          >
            <span>📊</span> 엑셀 업로드
          </button>
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
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">전체 유형</option>
            <option value="현금">현금 협찬</option>
            <option value="물품">물품 찬조</option>
          </select>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="검색 (협찬자명, 물품명, 메모)"
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

      {/* Sponsorship Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">후원 내역</h2>
          <p className="text-sm text-gray-600 mt-1">총 {filteredSponsorships.length}개</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">협찬자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredSponsorships.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    후원 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredSponsorships.map((sponsorship) => (
                  <tr 
                    key={sponsorship.id} 
                    onClick={() => handleShowDetail(sponsorship)}
                    className="hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sponsorship.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{sponsorship.projectName}</span>
                        {sponsorship.projectStartDate && (
                          <span className="text-xs text-gray-500 mt-1">
                            {formatDateRange(sponsorship.projectStartDate, sponsorship.projectEndDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sponsorship.type === '현금' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sponsorship.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sponsorship.sponsorName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sponsorship.type === '현금' ? (
                        <span className="text-gray-600">-</span>
                      ) : (
                        <span>
                          {sponsorship.itemName}
                          {sponsorship.quantity && ` × ${sponsorship.quantity}개`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sponsorship.amount && sponsorship.amount > 0 ? formatCurrency(sponsorship.amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sponsorship.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sponsorship.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditSponsorship(sponsorship)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteSponsorship(sponsorship.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 후원 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">후원 추가</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* 프로젝트 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newSponsorship.projectId}
                    onChange={(e) => handleNewSponsorshipChange('projectId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">프로젝트를 선택하세요</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* 유형과 날짜 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      유형 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newSponsorship.type}
                      onChange={(e) => handleNewSponsorshipChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="현금">현금 협찬</option>
                      <option value="물품">물품 찬조</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      날짜 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newSponsorship.date}
                      onChange={(e) => handleNewSponsorshipChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* 협찬자명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    협찬자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSponsorship.sponsorName}
                    onChange={(e) => handleNewSponsorshipChange('sponsorName', e.target.value)}
                    placeholder="협찬자 이름"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 현금/물품 구분 입력 */}
                {newSponsorship.type === '현금' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      금액 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithCommas(newSponsorship.amount)}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          물품명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newSponsorship.itemName}
                          onChange={(e) => handleNewSponsorshipChange('itemName', e.target.value)}
                          placeholder="물품 이름"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          수량
                        </label>
                        <input
                          type="number"
                          value={newSponsorship.quantity}
                          onChange={(e) => handleNewSponsorshipChange('quantity', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        금액 (선택)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(newSponsorship.amount)}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    value={newSponsorship.notes}
                    onChange={(e) => handleNewSponsorshipChange('notes', e.target.value)}
                    placeholder="추가 설명 (선택)"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddSponsorship}
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
        </div>
      )}

      {/* 후원 상세보기 모달 */}
      {showDetailModal && selectedSponsorship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">후원 상세 정보</h2>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">ID:</span>
                      <span className="ml-2">{selectedSponsorship.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">프로젝트:</span>
                      <span className="ml-2">{selectedSponsorship.projectName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">유형:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedSponsorship.type === '현금' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedSponsorship.type}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">날짜:</span>
                      <span className="ml-2">{formatDate(selectedSponsorship.date)}</span>
                    </div>
                  </div>
                </div>

                {/* 협찬자 정보 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">협찬자 정보</h3>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">협찬자명:</span>
                      <span className="ml-2 text-lg font-bold text-blue-600">{selectedSponsorship.sponsorName}</span>
                    </div>
                  </div>
                </div>

                {/* 후원 내용 */}
                <div className={`p-4 rounded-lg ${
                  selectedSponsorship.type === '현금' ? 'bg-green-50' : 'bg-purple-50'
                }`}>
                  <h3 className="font-semibold text-gray-900 mb-3">후원 내용</h3>
                  <div className="text-sm space-y-2">
                    {selectedSponsorship.type === '현금' ? (
                      <div>
                        <span className="font-medium text-gray-600">금액:</span>
                        <span className="ml-2 text-2xl font-bold text-green-600">
                          {formatCurrency(selectedSponsorship.amount)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium text-gray-600">물품명:</span>
                          <span className="ml-2 text-lg font-semibold text-purple-600">
                            {selectedSponsorship.itemName}
                          </span>
                        </div>
                        {selectedSponsorship.quantity && (
                          <div>
                            <span className="font-medium text-gray-600">수량:</span>
                            <span className="ml-2 font-medium">{selectedSponsorship.quantity}개</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 메모 */}
                {selectedSponsorship.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">메모</h3>
                    <p className="text-sm text-gray-700">{selectedSponsorship.notes}</p>
                  </div>
                )}

                {/* 등록 일시 */}
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  등록일: {selectedSponsorship.createdAt ? new Date(selectedSponsorship.createdAt).toLocaleString('ko-KR') : '-'}
                </div>
              </div>

              {/* 닫기 버튼 */}
              <div className="mt-6">
                <button
                  onClick={handleCloseDetail}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 후원 수정 모달 */}
      {showEditModal && editingSponsorship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">후원 수정</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* 프로젝트 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingSponsorship.projectId}
                    onChange={(e) => setEditingSponsorship(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">프로젝트를 선택하세요</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* 유형과 날짜 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      유형 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingSponsorship.type}
                      onChange={(e) => setEditingSponsorship(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="현금">현금 협찬</option>
                      <option value="물품">물품 찬조</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      날짜 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={editingSponsorship.date}
                      onChange={(e) => setEditingSponsorship(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* 협찬자명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    협찬자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSponsorship.sponsorName}
                    onChange={(e) => setEditingSponsorship(prev => ({ ...prev, sponsorName: e.target.value }))}
                    placeholder="협찬자 이름"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 현금/물품 구분 입력 */}
                {editingSponsorship.type === '현금' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      금액 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithCommas(editingSponsorship.amount)}
                      onChange={handleEditAmountChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          물품명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingSponsorship.itemName}
                          onChange={(e) => setEditingSponsorship(prev => ({ ...prev, itemName: e.target.value }))}
                          placeholder="물품 이름"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          수량
                        </label>
                        <input
                          type="number"
                          value={editingSponsorship.quantity}
                          onChange={(e) => setEditingSponsorship(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        금액 (선택)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(editingSponsorship.amount)}
                        onChange={handleEditAmountChange}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    value={editingSponsorship.notes}
                    onChange={(e) => setEditingSponsorship(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="추가 설명 (선택)"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">엑셀 업로드</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📌 업로드 방법:</strong>
                  </p>
                  <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                    <li>아래 버튼을 클릭하여 양식을 다운로드합니다</li>
                    <li>양식에 후원 정보를 입력합니다</li>
                    <li>완성된 파일을 업로드합니다</li>
                  </ol>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span>📥</span> 엑셀 양식 다운로드
                </button>

                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('excel-upload').click()}
                >
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="hidden"
                  />
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-1">클릭하여 엑셀 파일을 선택하세요</p>
                  <p className="text-sm text-gray-500">.xlsx, .xls 파일만 업로드 가능</p>
                  {selectedFile && (
                    <p className="mt-3 text-sm text-purple-600 font-medium">
                      선택된 파일: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleExcelUpload}
                  disabled={!selectedFile || isUploading}
                  className={`w-full px-4 py-3 rounded-lg transition-colors font-medium ${
                    selectedFile && !isUploading
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                  }}
                  className="w-full mt-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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

