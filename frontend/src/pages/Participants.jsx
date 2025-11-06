import { useState, useEffect } from 'react'
import api from '../utils/axios'
import * as XLSX from 'xlsx'

const PARTICIPANT_CATEGORIES = [
  { id: 'professor', name: '교수님', color: 'bg-blue-100 text-blue-800' },
  { id: 'vip', name: 'VIP', color: 'bg-purple-100 text-purple-800' },
  { id: 'external', name: '외부초청', color: 'bg-green-100 text-green-800' },
  { id: 'alumni', name: '동문회', color: 'bg-yellow-100 text-yellow-800', hasGrade: true },
  { id: 'student', name: '재학생', color: 'bg-pink-100 text-pink-800', hasGrade: true },
  { id: 'other', name: '기타', color: 'bg-gray-100 text-gray-800' }
]

// 기수 목록 (1기 ~ 50기)
const GRADES = Array.from({ length: 50 }, (_, i) => (i + 1) + '기')

export default function Participants() {
  const [participants, setParticipants] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    projectId: '',
    category: 'professor',
    name: '',
    phone: '',
    grade: '',
    position: '',
    notes: ''
  })
  const [editingParticipant, setEditingParticipant] = useState({
    id: null,
    projectId: '',
    category: 'professor',
    name: '',
    phone: '',
    grade: '',
    position: '',
    notes: ''
  })

  useEffect(() => {
    fetchParticipants()
    fetchProjects()
  }, [])

  // 프로젝트가 로드된 후 참석자 데이터에 프로젝트 정보 추가
  useEffect(() => {
    if (projects.length > 0 && participants.length > 0) {
      const participantsWithProject = participants.map(participant => {
        const project = projects.find(p => p.id === participant.projectId)
        return {
          ...participant,
          projectName: project?.name || '알 수 없음',
          projectStartDate: project?.startDate || null,
          projectEndDate: project?.endDate || null
        }
      })
      setParticipants(participantsWithProject)
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

  const fetchParticipants = async () => {
    setLoading(true)
    try {
      const response = await api.get('/participants')
      const participantsData = response.data.participants || []
      
      // 참석자 데이터에 프로젝트 이름 및 날짜 추가
      const participantsWithProject = participantsData.map(participant => {
        const project = projects.find(p => p.id === participant.projectId)
        return {
          ...participant,
          projectName: project?.name || '알 수 없음',
          projectStartDate: project?.startDate || null,
          projectEndDate: project?.endDate || null
        }
      })
      
      setParticipants(participantsWithProject)
      setLoading(false)
    } catch (error) {
      console.error('참석자 로드 실패:', error)
      setParticipants([])
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipant.projectId) {
      alert('프로젝트를 선택해주세요.')
      return
    }
    if (!newParticipant.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    // 동문회/재학생인 경우 기수 필수
    const category = PARTICIPANT_CATEGORIES.find(c => c.id === newParticipant.category)
    if (category?.hasGrade && !newParticipant.grade) {
      alert('기수를 선택해주세요.')
      return
    }

    try {
      await api.post('/participants', {
        projectId: Number(newParticipant.projectId),
        category: newParticipant.category,
        name: newParticipant.name.trim(),
        phone: newParticipant.phone || null,
        grade: newParticipant.grade || null,
        position: newParticipant.position || null,
        notes: newParticipant.notes || null
      })

      setNewParticipant({
        projectId: '',
        category: 'professor',
        name: '',
        phone: '',
        grade: '',
        position: '',
        notes: ''
      })

      setShowAddModal(false)
      alert('참석자가 추가되었습니다.')
      fetchParticipants()
    } catch (error) {
      console.error('참석자 추가 실패:', error)
      alert(error.response?.data?.message || '참석자 추가에 실패했습니다.')
    }
  }

  const handleEditParticipant = (participant) => {
    setEditingParticipant({
      id: participant.id,
      projectId: participant.projectId,
      category: participant.category,
      name: participant.name,
      phone: participant.phone || '',
      grade: participant.grade || '',
      position: participant.position || '',
      notes: participant.notes || ''
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingParticipant.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    // 동문회/재학생인 경우 기수 필수
    const category = PARTICIPANT_CATEGORIES.find(c => c.id === editingParticipant.category)
    if (category?.hasGrade && !editingParticipant.grade) {
      alert('기수를 선택해주세요.')
      return
    }

    try {
      await api.put(`/participants/${editingParticipant.id}`, {
        category: editingParticipant.category,
        name: editingParticipant.name.trim(),
        phone: editingParticipant.phone || null,
        grade: editingParticipant.grade || null,
        position: editingParticipant.position || null,
        notes: editingParticipant.notes || null
      })

      setShowEditModal(false)
      alert('참석자 정보가 수정되었습니다.')
      fetchParticipants()
    } catch (error) {
      console.error('참석자 수정 실패:', error)
      alert(error.response?.data?.message || '참석자 수정에 실패했습니다.')
    }
  }

  const handleDeleteParticipant = async (id) => {
    if (!confirm('이 참석자를 삭제하시겠습니까?')) return

    try {
      await api.delete(`/participants/${id}`)
      alert('참석자가 삭제되었습니다.')
      fetchParticipants()
    } catch (error) {
      console.error('참석자 삭제 실패:', error)
      alert('참석자 삭제에 실패했습니다.')
    }
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('파일 선택됨:', file.name)
      setSelectedFile(file)
    }
  }

  // 엑셀 업로드 실행
  const handleExcelUpload = async () => {
    if (!selectedFile) {
      alert('파일을 먼저 선택해주세요.')
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        console.log('엑셀 데이터 파싱:', jsonData)

        if (jsonData.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.')
          setIsUploading(false)
          return
        }

        // 데이터 검증 및 변환
        const participantsData = jsonData.map((row, index) => {
          // 프로젝트 ID 검증 (더 엄격하게)
          const projectIdValue = row['프로젝트ID']
          let projectId = null
          
          // 빈 값 체크
          if (projectIdValue === undefined || projectIdValue === null || projectIdValue === '') {
            throw new Error(`${index + 2}번째 행: 프로젝트ID가 비어있습니다.`)
          }
          
          // 문자열인 경우 trim 후 파싱
          const trimmedValue = String(projectIdValue).trim()
          projectId = parseInt(trimmedValue)
          
          // 숫자로 변환 가능한지 확인
          if (isNaN(projectId) || trimmedValue === '') {
            throw new Error(`${index + 2}번째 행: 프로젝트ID가 올바르지 않습니다. (입력된 값: "${projectIdValue}")`)
          }
          
          // 실제 프로젝트가 존재하는지 확인
          const projectExists = projects.find(p => p.id === projectId)
          if (!projectExists) {
            throw new Error(`${index + 2}번째 행: 프로젝트ID ${projectId}는 존재하지 않는 프로젝트입니다. 사용 가능한 프로젝트 ID: ${projects.map(p => p.id).join(', ')}`)
          }
          
          const category = getCategoryId(row['구분'])
          const name = row['이름']
          
          // 구분 검증
          if (!category) {
            throw new Error(`${index + 2}번째 행: 구분이 올바르지 않습니다. (교수님, VIP, 외부초청, 동문회, 재학생, 기타 중 선택)`)
          }
          
          // 이름 검증
          if (!name || String(name).trim() === '') {
            throw new Error(`${index + 2}번째 행: 이름이 필요합니다.`)
          }
          
        return {
          projectId: projectId,
          category: category,
          name: String(name).trim(),
          phone: row['전화번호'] ? String(row['전화번호']).trim() : null,
          grade: row['기수'] ? String(row['기수']).trim() : null,
          position: row['직책'] ? String(row['직책']).trim() : null,
          notes: row['비고'] ? String(row['비고']).trim() : null
        }
        })

        console.log('변환된 데이터:', participantsData)

        // 일괄 업로드
        const response = await api.post('/participants/bulk', { participants: participantsData })
        console.log('업로드 응답:', response.data)
        
        alert(`${participantsData.length}명의 참석자가 추가되었습니다.`)
        setShowUploadModal(false)
        setSelectedFile(null)
        fetchParticipants()
      } catch (error) {
        console.error('엑셀 업로드 실패:', error)
        
        let errorMessage = '엑셀 파일 업로드에 실패했습니다.'
        
        if (error.message && !error.response) {
          // 프론트엔드 검증 오류 (데이터 변환 중 발생)
          errorMessage = error.message
        } else if (error.response?.data?.message) {
          // 백엔드 오류
          errorMessage = error.response.data.message
        } else if (error.message) {
          // 기타 오류
          errorMessage += `\n오류: ${error.message}`
        }
        
        alert(errorMessage)
      } finally {
        setIsUploading(false)
      }
    }
    
    reader.onerror = (error) => {
      console.error('파일 읽기 실패:', error)
      alert('파일을 읽는 중 오류가 발생했습니다.')
      setIsUploading(false)
    }
    
    reader.readAsArrayBuffer(selectedFile)
  }

  // 엑셀 양식 다운로드
  const handleDownloadTemplate = () => {
    // 프로젝트 목록을 포함한 안내 시트
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
    guide.push({ '항목': '사용 가능한 구분', '설명': '교수님, VIP, 외부초청, 동문회, 재학생, 기타' })
    guide.push({ '항목': '기수 입력', '설명': '동문회 또는 재학생인 경우 기수를 선택하세요' })
    guide.push({ '항목': '', '설명': '' })
    guide.push({ '항목': '⚠️ 중요', '설명': '각 항목은 셀에서 드롭다운으로 선택할 수 있습니다' })
    
    const template = [
      {
        '프로젝트ID': projects.length > 0 ? projects[0].id : '',
        '구분': '동문회',
        '이름': '홍길동',
        '전화번호': '010-1234-5678',
        '기수': '1기',
        '직책': '',
        '비고': ''
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
    
    // 구분 드롭다운 (B열, 2행부터 100행까지)
    const categories = PARTICIPANT_CATEGORIES.map(c => c.name).join(',')
    ws['!dataValidation'].push({
      sqref: 'B2:B100',
      type: 'list',
      allowBlank: false,
      showDropDown: true,
      formula1: `"${categories}"`
    })
    
    // 기수 드롭다운 (E열, 2행부터 100행까지)
    const grades = GRADES.join(',')
    ws['!dataValidation'].push({
      sqref: 'E2:E100',
      type: 'list',
      allowBlank: true,
      showDropDown: true,
      formula1: `"${grades}"`
    })
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 12 }, // 프로젝트ID
      { wch: 12 }, // 구분
      { wch: 12 }, // 이름
      { wch: 15 }, // 전화번호
      { wch: 10 }, // 기수
      { wch: 15 }, // 직책
      { wch: 20 }  // 비고
    ]
    
    XLSX.utils.book_append_sheet(wb, guideSheet, '사용 안내')
    XLSX.utils.book_append_sheet(wb, ws, '참석자명단')
    XLSX.writeFile(wb, '참석자_업로드_양식.xlsx')
  }

  // 카테고리 한글명 -> ID 변환
  const getCategoryId = (categoryName) => {
    const category = PARTICIPANT_CATEGORIES.find(cat => cat.name === categoryName)
    return category ? category.id : 'other'
  }

  // 필터링된 참석자 목록
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = 
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (participant.organization && participant.organization.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesProject = filterProject === 'all' || participant.projectId === parseInt(filterProject)
    const matchesCategory = filterCategory === 'all' || participant.category === filterCategory
    
    return matchesSearch && matchesProject && matchesCategory
  })

  // 통계 계산
  const stats = PARTICIPANT_CATEGORIES.map(category => ({
    ...category,
    count: participants.filter(p => p.category === category.id).length
  }))

  const getCategoryColor = (categoryId) => {
    const category = PARTICIPANT_CATEGORIES.find(cat => cat.id === categoryId)
    return category ? category.color : 'bg-gray-100 text-gray-800'
  }

  const getCategoryName = (categoryId) => {
    const category = PARTICIPANT_CATEGORIES.find(cat => cat.id === categoryId)
    return category ? category.name : '기타'
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>참석자 관리</span>
        </h1>
        <p className="text-gray-600 mt-2">프로젝트별 참석자 명단을 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
            <p className="text-2xl font-bold text-purple-600">{stat.count}명</p>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            + 참석자 추가
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            📊 엑셀 업로드
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">전체 구분</option>
            {PARTICIPANT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="검색 (이름, 소속)"
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

      {/* Participants Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">참석자 명단</h2>
          <p className="text-sm text-gray-600 mt-1">총 {filteredParticipants.length}명</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직책</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    참석자가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{participant.projectName}</span>
                        {participant.projectStartDate && (
                          <span className="text-xs text-gray-500 mt-1">
                            {formatDateRange(participant.projectStartDate, participant.projectEndDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(participant.category)}`}>
                        {getCategoryName(participant.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{participant.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{participant.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{participant.grade || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{participant.position || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditParticipant(participant)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(participant.id)}
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

      {/* 참석자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">참석자 추가</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newParticipant.projectId}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">프로젝트를 선택하세요</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      구분 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newParticipant.category}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {PARTICIPANT_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newParticipant.name}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="이름"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <input
                      type="tel"
                      value={newParticipant.phone}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {(newParticipant.category === 'alumni' || newParticipant.category === 'student') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        기수 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newParticipant.grade}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">기수를 선택하세요</option>
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(newParticipant.category !== 'alumni' && newParticipant.category !== 'student') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                      <input
                        type="text"
                        value={newParticipant.position}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="직책을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={newParticipant.notes}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="추가 설명"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddParticipant}
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

      {/* 참석자 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">참석자 수정</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트
                  </label>
                  <input
                    type="text"
                    value={projects.find(p => p.id === editingParticipant.projectId)?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      구분 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingParticipant.category}
                      onChange={(e) => setEditingParticipant(prev => ({ ...prev, category: e.target.value, grade: '', position: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {PARTICIPANT_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingParticipant.name}
                      onChange={(e) => setEditingParticipant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="이름"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <input
                      type="tel"
                      value={editingParticipant.phone}
                      onChange={(e) => setEditingParticipant(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {(editingParticipant.category === 'alumni' || editingParticipant.category === 'student') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        기수 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editingParticipant.grade}
                        onChange={(e) => setEditingParticipant(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">기수를 선택하세요</option>
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(editingParticipant.category !== 'alumni' && editingParticipant.category !== 'student') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                      <input
                        type="text"
                        value={editingParticipant.position}
                        onChange={(e) => setEditingParticipant(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="직책을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={editingParticipant.notes}
                    onChange={(e) => setEditingParticipant(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="추가 설명"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

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
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">엑셀 업로드</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>📌 업로드 방법:</strong>
                  </p>
                  <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                    <li>아래 버튼을 클릭하여 양식을 다운로드합니다</li>
                    <li>양식에 참석자 정보를 입력합니다</li>
                    <li>완성된 파일을 업로드합니다</li>
                  </ol>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  📥 엑셀 양식 다운로드
                </button>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        클릭하여 엑셀 파일을 선택하세요
                      </p>
                      <p className="text-xs text-gray-500">
                        .xlsx, .xls 파일만 업로드 가능
                      </p>
                      {selectedFile && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ {selectedFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <button
                    onClick={handleExcelUpload}
                    disabled={isUploading}
                    className="w-full bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUploading ? '업로드 중...' : '📤 파일 업로드'}
                  </button>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                  }}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isUploading}
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

