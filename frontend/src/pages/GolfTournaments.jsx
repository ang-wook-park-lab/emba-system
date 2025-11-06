import { useState, useEffect } from 'react'
import api from '../utils/axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import * as XLSX from 'xlsx'

export default function GolfTournaments() {
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [scores, setScores] = useState([])
  const [participantStats, setParticipantStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showEditScoreModal, setShowEditScoreModal] = useState(false)
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false)
  const [showTournamentExcelUploadModal, setShowTournamentExcelUploadModal] = useState(false)
  const [editingScore, setEditingScore] = useState(null)
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [participantScores, setParticipantScores] = useState([])
  const [excelFile, setExcelFile] = useState(null)
  const [tournamentExcelFile, setTournamentExcelFile] = useState(null)
  const [selectedTournamentsForStats, setSelectedTournamentsForStats] = useState([])
  const [statsScores, setStatsScores] = useState([])
  const [newTournament, setNewTournament] = useState({
    name: '',
    date: '',
    location: '',
    description: ''
  })
  const [editTournament, setEditTournament] = useState({
    name: '',
    date: '',
    location: '',
    description: ''
  })
  const [newScore, setNewScore] = useState({
    participantName: '',
    score: '',
    handicap: '',
    notes: ''
  })
  const [editScore, setEditScore] = useState({
    participantName: '',
    score: '',
    handicap: '',
    notes: ''
  })
  const [participantList, setParticipantList] = useState([])
  const [filteredParticipants, setFilteredParticipants] = useState([])
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false)
  const [showEditParticipantDropdown, setShowEditParticipantDropdown] = useState(false)

  useEffect(() => {
    fetchTournaments()
    fetchParticipantStats()
    fetchParticipantList()
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentDetails(selectedTournament.id)
    }
  }, [selectedTournament])

  // 통계용 대회들이 변경될 때 해당 대회들의 스코어 가져오기
  useEffect(() => {
    if (selectedTournamentsForStats.length > 0) {
      fetchMultipleTournamentScoresForStats(selectedTournamentsForStats)
    } else {
      setStatsScores([])
    }
  }, [selectedTournamentsForStats])

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/golf-tournaments')
      setTournaments(response.data.tournaments || [])
      if (response.data.tournaments && response.data.tournaments.length > 0 && !selectedTournament) {
        setSelectedTournament(response.data.tournaments[0])
      }
    } catch (error) {
      console.error('골프대회 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipantList = async () => {
    try {
      const response = await api.get('/participants')
      setParticipantList(response.data.participants || [])
    } catch (error) {
      console.error('참석자 목록 조회 실패:', error)
    }
  }

  const fetchTournamentDetails = async (tournamentId) => {
    try {
      const response = await api.get(`/golf-tournaments/${tournamentId}`)
      const fetchedScores = response.data.scores || []
      setScores(fetchedScores)
      
      // 통계용 대회에 현재 대회가 포함되어 있으면 통계 업데이트
      if (selectedTournamentsForStats.includes(tournamentId)) {
        fetchMultipleTournamentScoresForStats(selectedTournamentsForStats)
      }
    } catch (error) {
      console.error('골프대회 상세 조회 실패:', error)
    }
  }

  const fetchMultipleTournamentScoresForStats = async (tournamentIds) => {
    try {
      const allScores = []
      for (const tournamentId of tournamentIds) {
        try {
          const response = await api.get(`/golf-tournaments/${tournamentId}`)
          const scores = response.data.scores || []
          allScores.push(...scores)
        } catch (error) {
          console.error(`대회 ${tournamentId} 스코어 조회 실패:`, error)
        }
      }
      setStatsScores(allScores)
    } catch (error) {
      console.error('통계용 골프대회 스코어 조회 실패:', error)
      setStatsScores([])
    }
  }

  const handleTournamentStatsToggle = (tournamentId) => {
    setSelectedTournamentsForStats(prev => {
      if (prev.includes(tournamentId)) {
        // 이미 선택된 경우 제거
        return prev.filter(id => id !== tournamentId)
      } else {
        // 선택되지 않은 경우 추가
        return [...prev, tournamentId]
      }
    })
  }

  const fetchParticipantStats = async () => {
    try {
      const response = await api.get('/golf-tournaments/stats/participants')
      setParticipantStats(response.data.averages || [])
    } catch (error) {
      console.error('통계 조회 실패:', error)
    }
  }

  const handleAddTournament = async (e) => {
    e.preventDefault()
    try {
      await api.post('/golf-tournaments', newTournament)
      setShowAddModal(false)
      setNewTournament({ name: '', date: '', location: '', description: '' })
      fetchTournaments()
    } catch (error) {
      alert(error.response?.data?.message || '골프대회 생성에 실패했습니다.')
    }
  }

  const handleEditTournament = async (e) => {
    e.preventDefault()
    if (!selectedTournament) return
    
    try {
      await api.put(`/golf-tournaments/${selectedTournament.id}`, editTournament)
      setShowEditModal(false)
      setEditTournament({ name: '', date: '', location: '', description: '' })
      fetchTournaments()
      // 선택된 대회 정보도 업데이트
      const updated = tournaments.find(t => t.id === selectedTournament.id)
      if (updated) {
        setSelectedTournament({ ...updated, ...editTournament })
      }
    } catch (error) {
      alert(error.response?.data?.message || '골프대회 수정에 실패했습니다.')
    }
  }

  const handleUpdateScore = async (e) => {
    e.preventDefault()
    if (!editingScore) return
    
    try {
      await api.put(`/golf-tournaments/scores/${editingScore.id}`, {
        ...editScore,
        score: parseInt(editScore.score),
        handicap: editScore.handicap ? parseInt(editScore.handicap) : 0
      })
      setShowEditScoreModal(false)
      setEditingScore(null)
      setEditScore({ participantName: '', score: '', handicap: '', notes: '' })
      await fetchTournamentDetails(selectedTournament.id)
      fetchParticipantStats()
      // 통계용 대회에 현재 대회가 포함되어 있으면 통계 업데이트
      if (selectedTournamentsForStats.includes(selectedTournament.id)) {
        await fetchMultipleTournamentScoresForStats(selectedTournamentsForStats)
      }
      // 참석자 그래프도 업데이트
      if (selectedParticipant === editScore.participantName) {
        fetchParticipantScores(editScore.participantName)
      }
    } catch (error) {
      alert(error.response?.data?.message || '스코어 수정에 실패했습니다.')
    }
  }

  const fetchParticipantScores = async (participantName) => {
    try {
      const response = await api.get(`/golf-tournaments/participant/${encodeURIComponent(participantName)}/scores`)
      const scores = response.data.scores || []
      console.log('참석자별 스코어 조회 결과:', scores)
      setParticipantScores(scores)
      
      if (scores.length === 0) {
        alert(`${participantName}님의 스코어 기록이 없습니다.`)
      }
    } catch (error) {
      console.error('참석자별 스코어 조회 실패:', error)
      alert('참석자별 스코어 조회에 실패했습니다.')
      setParticipantScores([])
    }
  }

  const handleParticipantClick = async (participantName) => {
    setSelectedParticipant(participantName)
    await fetchParticipantScores(participantName)
  }

  const handleParticipantSearch = (value, isEdit = false) => {
    const searchValue = value.toLowerCase()
    const filtered = participantList.filter(p => 
      p.name.toLowerCase().includes(searchValue)
    )
    setFilteredParticipants(filtered)
    
    if (isEdit) {
      setShowEditParticipantDropdown(filtered.length > 0 && value.length > 0)
    } else {
      setShowParticipantDropdown(filtered.length > 0 && value.length > 0)
    }
  }

  const selectParticipant = (participantName, isEdit = false) => {
    if (isEdit) {
      setEditScore({ ...editScore, participantName })
      setShowEditParticipantDropdown(false)
    } else {
      setNewScore({ ...newScore, participantName })
      setShowParticipantDropdown(false)
    }
  }

  const handleExcelUpload = async (e) => {
    e.preventDefault()
    if (!excelFile || !selectedTournament) {
      alert('엑셀 파일을 선택하고 골프대회를 선택해주세요.')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            alert('엑셀 파일에 데이터가 없습니다.')
            return
          }

          // 엑셀 데이터 형식 확인 및 변환
          // 예상 형식: 참석자명, 스코어, 핸디캡(선택), 비고(선택)
          const scoresToAdd = []
          let successCount = 0
          let errorCount = 0

          for (const row of jsonData) {
            try {
              // 다양한 컬럼명 지원
              const participantName = row['참석자명'] || row['참석자'] || row['이름'] || row['name'] || row['Name'] || row['NAME']
              const score = row['스코어'] || row['점수'] || row['score'] || row['Score'] || row['SCORE']
              const handicap = row['핸디캡'] || row['handicap'] || row['Handicap'] || row['HANDICAP'] || 0
              const notes = row['비고'] || row['메모'] || row['notes'] || row['Notes'] || row['NOTES'] || ''

              if (!participantName || score === undefined || score === null || score === '') {
                errorCount++
                continue
              }

              scoresToAdd.push({
                participantName: String(participantName).trim(),
                score: parseInt(score),
                handicap: handicap ? parseInt(handicap) : 0,
                notes: notes ? String(notes).trim() : ''
              })
            } catch (err) {
              errorCount++
              console.error('행 처리 오류:', err, row)
            }
          }

          if (scoresToAdd.length === 0) {
            alert('유효한 데이터가 없습니다. 엑셀 파일 형식을 확인해주세요.\n필수 컬럼: 참석자명, 스코어')
            return
          }

          // 일괄 추가
          for (const scoreData of scoresToAdd) {
            try {
              await api.post(`/golf-tournaments/${selectedTournament.id}/scores`, scoreData)
              successCount++
            } catch (error) {
              errorCount++
              console.error('스코어 추가 실패:', error, scoreData)
            }
          }

          alert(`스코어 추가 완료!\n성공: ${successCount}개${errorCount > 0 ? `\n실패: ${errorCount}개` : ''}`)
          
          setShowExcelUploadModal(false)
          setExcelFile(null)
          await fetchTournamentDetails(selectedTournament.id)
          fetchParticipantStats()
          // 통계용 대회가 현재 대회인 경우 통계 업데이트
          if (selectedTournamentForStats === selectedTournament.id) {
            await fetchTournamentScoresForStats(selectedTournament.id)
          }
        } catch (error) {
          console.error('엑셀 파일 처리 오류:', error)
          alert('엑셀 파일 처리 중 오류가 발생했습니다.')
        }
      }
      reader.readAsArrayBuffer(excelFile)
    } catch (error) {
      console.error('엑셀 업로드 오류:', error)
      alert('엑셀 파일 업로드에 실패했습니다.')
    }
  }

  const handleExcelFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
        e.target.value = ''
        return
      }
      setExcelFile(file)
    }
  }

  const handleTournamentExcelFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
        e.target.value = ''
        return
      }
      setTournamentExcelFile(file)
    }
  }

  const downloadSampleTournamentExcel = () => {
    // 샘플 데이터
    const sampleData = [
      {
        대회명: '2024년 봄 대회',
        날짜: '2024-04-15',
        장소: '서울CC',
        설명: '연례 봄 대회'
      },
      {
        대회명: '2024년 가을 대회',
        날짜: '2024-10-20',
        장소: '부산GC',
        설명: '연례 가을 대회'
      }
    ]

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(sampleData)
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 20 }, // 대회명
      { wch: 15 }, // 날짜
      { wch: 15 }, // 장소
      { wch: 30 }  // 설명
    ]

    XLSX.utils.book_append_sheet(wb, ws, '골프대회')
    XLSX.writeFile(wb, '골프대회_샘플.xlsx')
  }

  const downloadSampleScoreExcel = () => {
    // 샘플 데이터
    const sampleData = [
      {
        참석자명: '홍길동',
        스코어: 85,
        핸디캡: 10,
        비고: ''
      },
      {
        참석자명: '김철수',
        스코어: 90,
        핸디캡: 15,
        비고: ''
      },
      {
        참석자명: '이영희',
        스코어: 88,
        핸디캡: 12,
        비고: ''
      }
    ]

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(sampleData)
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 15 }, // 참석자명
      { wch: 10 }, // 스코어
      { wch: 10 }, // 핸디캡
      { wch: 20 }  // 비고
    ]

    XLSX.utils.book_append_sheet(wb, ws, '스코어')
    XLSX.writeFile(wb, '골프스코어_샘플.xlsx')
  }

  const handleTournamentExcelUpload = async (e) => {
    e.preventDefault()
    if (!tournamentExcelFile) {
      alert('엑셀 파일을 선택해주세요.')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            alert('엑셀 파일에 데이터가 없습니다.')
            return
          }

          // 엑셀 데이터 형식 확인 및 변환
          // 예상 형식: 대회명, 날짜, 장소(선택), 설명(선택)
          const tournamentsToAdd = []
          let successCount = 0
          let errorCount = 0

          for (const row of jsonData) {
            try {
              // 다양한 컬럼명 지원
              const name = row['대회명'] || row['대회이름'] || row['이름'] || row['name'] || row['Name'] || row['NAME'] || row['tournament'] || row['Tournament']
              const date = row['날짜'] || row['일자'] || row['date'] || row['Date'] || row['DATE'] || row['일시']
              const location = row['장소'] || row['위치'] || row['location'] || row['Location'] || row['LOCATION'] || row['place'] || row['Place'] || ''
              const description = row['설명'] || row['비고'] || row['메모'] || row['description'] || row['Description'] || row['DESCRIPTION'] || row['notes'] || row['Notes'] || ''

              if (!name || !date) {
                errorCount++
                continue
              }

              // 날짜 형식 변환 (YYYY-MM-DD 형식으로)
              let formattedDate = date
              if (typeof date === 'number') {
                // 엑셀 날짜 숫자를 날짜 문자열로 변환
                // 엑셀 날짜는 1900-01-01부터의 일수 (1900년 1월 1일 = 1)
                try {
                  const excelEpoch = new Date(1899, 11, 30) // 1899-12-30 (엑셀의 기준 날짜)
                  const jsDate = new Date(excelEpoch.getTime() + (date - 1) * 24 * 60 * 60 * 1000)
                  const year = jsDate.getFullYear()
                  const month = String(jsDate.getMonth() + 1).padStart(2, '0')
                  const day = String(jsDate.getDate()).padStart(2, '0')
                  formattedDate = `${year}-${month}-${day}`
                } catch (err) {
                  console.error('날짜 변환 오류:', err)
                  // 변환 실패 시 원본 사용
                }
              } else if (typeof date === 'string') {
                // 문자열 날짜를 YYYY-MM-DD 형식으로 변환 시도
                const dateStr = date.trim()
                // YYYY-MM-DD 형식이 아니면 변환 시도
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  // 다른 형식의 날짜 처리 (예: 2024/01/01, 2024.01.01 등)
                  const dateMatch = dateStr.match(/(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/)
                  if (dateMatch) {
                    formattedDate = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[3]).padStart(2, '0')}`
                  } else {
                    // Date 객체로 파싱 시도
                    try {
                      const parsedDate = new Date(dateStr)
                      if (!isNaN(parsedDate.getTime())) {
                        const year = parsedDate.getFullYear()
                        const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
                        const day = String(parsedDate.getDate()).padStart(2, '0')
                        formattedDate = `${year}-${month}-${day}`
                      }
                    } catch (err) {
                      console.error('날짜 파싱 오류:', err)
                    }
                  }
                }
              }

              tournamentsToAdd.push({
                name: String(name).trim(),
                date: formattedDate,
                location: location ? String(location).trim() : '',
                description: description ? String(description).trim() : ''
              })
            } catch (err) {
              errorCount++
              console.error('행 처리 오류:', err, row)
            }
          }

          if (tournamentsToAdd.length === 0) {
            alert('유효한 데이터가 없습니다. 엑셀 파일 형식을 확인해주세요.\n필수 컬럼: 대회명, 날짜')
            return
          }

          // 일괄 추가
          for (const tournamentData of tournamentsToAdd) {
            try {
              await api.post('/golf-tournaments', tournamentData)
              successCount++
            } catch (error) {
              errorCount++
              console.error('골프대회 추가 실패:', error, tournamentData)
            }
          }

          alert(`골프대회 추가 완료!\n성공: ${successCount}개${errorCount > 0 ? `\n실패: ${errorCount}개` : ''}`)
          
          setShowTournamentExcelUploadModal(false)
          setTournamentExcelFile(null)
          fetchTournaments()
        } catch (error) {
          console.error('엑셀 파일 처리 오류:', error)
          alert('엑셀 파일 처리 중 오류가 발생했습니다.')
        }
      }
      reader.readAsArrayBuffer(tournamentExcelFile)
    } catch (error) {
      console.error('엑셀 업로드 오류:', error)
      alert('엑셀 파일 업로드에 실패했습니다.')
    }
  }

  const handleAddScore = async (e) => {
    e.preventDefault()
    if (!selectedTournament) return
    
    try {
      await api.post(`/golf-tournaments/${selectedTournament.id}/scores`, {
        ...newScore,
        score: parseInt(newScore.score),
        handicap: newScore.handicap ? parseInt(newScore.handicap) : 0
      })
      setShowScoreModal(false)
      setNewScore({ participantName: '', score: '', handicap: '', notes: '' })
      await fetchTournamentDetails(selectedTournament.id)
      fetchParticipantStats()
      // 통계용 대회에 현재 대회가 포함되어 있으면 통계 업데이트
      if (selectedTournamentsForStats.includes(selectedTournament.id)) {
        await fetchMultipleTournamentScoresForStats(selectedTournamentsForStats)
      }
    } catch (error) {
      alert(error.response?.data?.message || '스코어 추가에 실패했습니다.')
    }
  }

  const handleDeleteTournament = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await api.delete(`/golf-tournaments/${id}`)
      fetchTournaments()
      if (selectedTournament?.id === id) {
        setSelectedTournament(null)
        setScores([])
      }
    } catch (error) {
      alert(error.response?.data?.message || '골프대회 삭제에 실패했습니다.')
    }
  }

  const handleDeleteScore = async (scoreId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await api.delete(`/golf-tournaments/scores/${scoreId}`)
      await fetchTournamentDetails(selectedTournament.id)
      fetchParticipantStats()
      // 통계용 대회에 현재 대회가 포함되어 있으면 통계 업데이트
      if (selectedTournamentsForStats.includes(selectedTournament.id)) {
        await fetchMultipleTournamentScoresForStats(selectedTournamentsForStats)
      }
    } catch (error) {
      alert(error.response?.data?.message || '스코어 삭제에 실패했습니다.')
    }
  }

  // 그래프 데이터 준비
  const tournamentChartData = scores
    .sort((a, b) => a.score - b.score)
    .map(score => ({
      name: score.participantName,
      score: score.score,
      handicap: score.handicap
    }))

  // 선택된 대회들의 통계만 필터링
  const filteredParticipantStats = selectedTournamentsForStats.length > 0
    ? statsScores
        .reduce((acc, score) => {
          const existing = acc.find(s => s.participantName === score.participantName)
          if (existing) {
            existing.scores.push(score.score)
          } else {
            acc.push({
              participantName: score.participantName,
              scores: [score.score]
            })
          }
          return acc
        }, [])
        .map(participant => {
          const scoreValues = participant.scores
          const averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
          const bestScore = Math.min(...scoreValues)
          const worstScore = Math.max(...scoreValues)
          
          return {
            participantName: participant.participantName,
            averageScore: Math.round(averageScore * 10) / 10,
            bestScore: bestScore,
            worstScore: worstScore,
            tournamentCount: scoreValues.length
          }
        })
    : participantStats

  const averageChartData = filteredParticipantStats.map(stat => ({
    name: stat.participantName,
    평균타수: stat.averageScore,
    최고점수: stat.bestScore,
    최저점수: stat.worstScore,
    참가횟수: stat.tournamentCount
  }))

  if (loading) {
    return <div className="p-8">로딩 중...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">골프대회 연례회의</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTournamentExcelUploadModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            📊 골프대회 엑셀 업로드
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            + 새로운 골프대회 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 골프대회 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4">골프대회 목록</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className={`p-3 rounded-lg transition-colors ${
                    selectedTournament?.id === tournament.id
                      ? 'bg-purple-100 border-2 border-purple-600'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTournamentsForStats.includes(tournament.id)}
                      onChange={() => handleTournamentStatsToggle(tournament.id)}
                      className="mt-1 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedTournament(tournament)}
                    >
                      <div className="font-semibold">{tournament.name}</div>
                      <div className="text-sm text-gray-600">{tournament.date}</div>
                      {tournament.location && (
                        <div className="text-xs text-gray-500">{tournament.location}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-2 ml-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTournament(tournament)
                        setEditTournament({
                          name: tournament.name,
                          date: tournament.date,
                          location: tournament.location || '',
                          description: tournament.description || ''
                        })
                        setShowEditModal(true)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTournament(tournament.id)
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  등록된 골프대회가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 선택된 대회의 스코어 및 그래프 */}
        <div className="lg:col-span-2">
          {selectedTournament ? (
            <div className="space-y-6">
              {/* 대회 정보 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTournament.name}</h2>
                    <p className="text-gray-600">{selectedTournament.date}</p>
                    {selectedTournament.location && (
                      <p className="text-gray-500">{selectedTournament.location}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditTournament({
                          name: selectedTournament.name,
                          date: selectedTournament.date,
                          location: selectedTournament.location || '',
                          description: selectedTournament.description || ''
                        })
                        setShowEditModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setShowScoreModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      + 스코어 추가
                    </button>
                    <button
                      onClick={() => setShowExcelUploadModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      📊 엑셀 업로드
                    </button>
                  </div>
                </div>
                {selectedTournament.description && (
                  <p className="text-gray-700">{selectedTournament.description}</p>
                )}
              </div>

              {/* 스코어 테이블 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">참석자 스코어</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">순위</th>
                        <th className="text-left p-2">참석자</th>
                        <th className="text-right p-2">스코어</th>
                        <th className="text-right p-2">핸디캡</th>
                        <th className="text-left p-2">비고</th>
                        <th className="text-center p-2">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores
                        .sort((a, b) => a.score - b.score)
                        .map((score, index) => (
                          <tr key={score.id} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">
                              <button
                                onClick={() => handleParticipantClick(score.participantName)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {score.participantName}
                              </button>
                            </td>
                            <td className="p-2 text-right">{score.score}</td>
                            <td className="p-2 text-right">{score.handicap || 0}</td>
                            <td className="p-2 text-sm text-gray-600">{score.notes || '-'}</td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingScore(score)
                                    setEditScore({
                                      participantName: score.participantName,
                                      score: score.score.toString(),
                                      handicap: score.handicap ? score.handicap.toString() : '',
                                      notes: score.notes || ''
                                    })
                                    setShowEditScoreModal(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteScore(score.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {scores.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center text-gray-500 py-8">
                            등록된 스코어가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 그래프: 선택된 대회의 스코어 */}
              {scores.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">골프 스코어 그래프</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tournamentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#9333ea" name="스코어" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 참석자별 개인 스코어 그래프 */}
              {selectedParticipant && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{selectedParticipant}님의 전체 대회 스코어 추이</h3>
                    <button
                      onClick={() => {
                        setSelectedParticipant(null)
                        setParticipantScores([])
                      }}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  {participantScores.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={participantScores.map(score => ({
                        날짜: score.tournamentDate,
                        스코어: score.score,
                        대회명: score.tournamentName
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="날짜" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              return `대회: ${payload[0].payload.대회명}\n날짜: ${label}`
                            }
                            return `날짜: ${label}`
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="스코어" 
                          stroke="#9333ea" 
                          strokeWidth={2} 
                          name="스코어"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      {selectedParticipant}님의 스코어 기록을 불러오는 중...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              골프대회를 선택해주세요.
            </div>
          )}
        </div>
      </div>

      {/* 참석자별 평균 타수 그래프 */}
      {filteredParticipantStats.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              참석자별 골프 평균 타수
              {selectedTournamentsForStats.length > 0 && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({selectedTournamentsForStats.length}개 대회 선택)
                </span>
              )}
            </h3>
            {selectedTournamentsForStats.length > 0 && (
              <button
                onClick={() => {
                  setSelectedTournamentsForStats([])
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                전체 보기
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={averageChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="평균타수" fill="#9333ea" name="평균 타수" />
              <Bar dataKey="최고점수" fill="#10b981" name="최고 점수" />
              <Bar dataKey="최저점수" fill="#ef4444" name="최저 점수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}


      {/* 골프대회 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">새로운 골프대회 추가</h2>
            <form onSubmit={handleAddTournament}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">대회명 *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">날짜 *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newTournament.date}
                    onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">장소</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newTournament.location}
                    onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 골프대회 수정 모달 */}
      {showEditModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">골프대회 수정</h2>
            <form onSubmit={handleEditTournament}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">대회명 *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editTournament.name}
                    onChange={(e) => setEditTournament({ ...editTournament, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">날짜 *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editTournament.date}
                    onChange={(e) => setEditTournament({ ...editTournament, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">장소</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editTournament.location}
                    onChange={(e) => setEditTournament({ ...editTournament, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    value={editTournament.description}
                    onChange={(e) => setEditTournament({ ...editTournament, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 스코어 추가 모달 */}
      {showScoreModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">스코어 추가</h2>
            <form onSubmit={handleAddScore}>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">참석자명 *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newScore.participantName}
                    onChange={(e) => {
                      setNewScore({ ...newScore, participantName: e.target.value })
                      handleParticipantSearch(e.target.value, false)
                    }}
                    onFocus={(e) => handleParticipantSearch(e.target.value, false)}
                    placeholder="참석자 이름을 입력하세요"
                  />
                  {showParticipantDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredParticipants.length > 0 ? (
                        filteredParticipants.map((participant) => (
                          <button
                            key={participant.id}
                            type="button"
                            onClick={() => selectParticipant(participant.name, false)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="font-medium">{participant.name}</div>
                            {participant.affiliation && (
                              <div className="text-sm text-gray-500">{participant.affiliation}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">스코어 *</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newScore.score}
                    onChange={(e) => setNewScore({ ...newScore, score: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">핸디캡</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newScore.handicap}
                    onChange={(e) => setNewScore({ ...newScore, handicap: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">비고</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    value={newScore.notes}
                    onChange={(e) => setNewScore({ ...newScore, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 스코어 수정 모달 */}
      {showEditScoreModal && editingScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">스코어 수정</h2>
            <form onSubmit={handleUpdateScore}>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">참석자명 *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editScore.participantName}
                    onChange={(e) => {
                      setEditScore({ ...editScore, participantName: e.target.value })
                      handleParticipantSearch(e.target.value, true)
                    }}
                    onFocus={(e) => handleParticipantSearch(e.target.value, true)}
                    placeholder="참석자 이름을 입력하세요"
                  />
                  {showEditParticipantDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredParticipants.length > 0 ? (
                        filteredParticipants.map((participant) => (
                          <button
                            key={participant.id}
                            type="button"
                            onClick={() => selectParticipant(participant.name, true)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="font-medium">{participant.name}</div>
                            {participant.affiliation && (
                              <div className="text-sm text-gray-500">{participant.affiliation}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">스코어 *</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editScore.score}
                    onChange={(e) => setEditScore({ ...editScore, score: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">핸디캡</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editScore.handicap}
                    onChange={(e) => setEditScore({ ...editScore, handicap: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">비고</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    value={editScore.notes}
                    onChange={(e) => setEditScore({ ...editScore, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditScoreModal(false)
                    setEditingScore(null)
                    setEditScore({ participantName: '', score: '', handicap: '', notes: '' })
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {showExcelUploadModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">엑셀 파일로 스코어 업로드</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold mb-2">엑셀 파일 형식:</p>
                  <p className="text-xs text-gray-600 mb-1">• 필수 컬럼: 참석자명, 스코어</p>
                  <p className="text-xs text-gray-600 mb-1">• 선택 컬럼: 핸디캡, 비고</p>
                  <p className="text-xs text-gray-600">• 지원 형식: .xlsx, .xls</p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleScoreExcel}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  📥 샘플 다운로드
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <p className="font-semibold">예시:</p>
                <table className="mt-1 border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-2 py-1">참석자명</th>
                      <th className="border border-gray-300 px-2 py-1">스코어</th>
                      <th className="border border-gray-300 px-2 py-1">핸디캡</th>
                      <th className="border border-gray-300 px-2 py-1">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1">홍길동</td>
                      <td className="border border-gray-300 px-2 py-1">85</td>
                      <td className="border border-gray-300 px-2 py-1">10</td>
                      <td className="border border-gray-300 px-2 py-1">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <form onSubmit={handleExcelUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">엑셀 파일 *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    required
                    onChange={handleExcelFileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {excelFile && (
                    <p className="mt-1 text-sm text-gray-600">선택된 파일: {excelFile.name}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowExcelUploadModal(false)
                    setExcelFile(null)
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!excelFile}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 골프대회 엑셀 업로드 모달 */}
      {showTournamentExcelUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">엑셀 파일로 골프대회 업로드</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold mb-2">엑셀 파일 형식:</p>
                  <p className="text-xs text-gray-600 mb-1">• 필수 컬럼: 대회명, 날짜</p>
                  <p className="text-xs text-gray-600 mb-1">• 선택 컬럼: 장소, 설명</p>
                  <p className="text-xs text-gray-600">• 지원 형식: .xlsx, .xls</p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTournamentExcel}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  📥 샘플 다운로드
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <p className="font-semibold">예시:</p>
                <table className="mt-1 border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-2 py-1">대회명</th>
                      <th className="border border-gray-300 px-2 py-1">날짜</th>
                      <th className="border border-gray-300 px-2 py-1">장소</th>
                      <th className="border border-gray-300 px-2 py-1">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1">2024년 봄 대회</td>
                      <td className="border border-gray-300 px-2 py-1">2024-04-15</td>
                      <td className="border border-gray-300 px-2 py-1">서울CC</td>
                      <td className="border border-gray-300 px-2 py-1">연례 봄 대회</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1">2024년 가을 대회</td>
                      <td className="border border-gray-300 px-2 py-1">2024-10-20</td>
                      <td className="border border-gray-300 px-2 py-1">부산GC</td>
                      <td className="border border-gray-300 px-2 py-1">연례 가을 대회</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <form onSubmit={handleTournamentExcelUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">엑셀 파일 *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    required
                    onChange={handleTournamentExcelFileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {tournamentExcelFile && (
                    <p className="mt-1 text-sm text-gray-600">선택된 파일: {tournamentExcelFile.name}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTournamentExcelUploadModal(false)
                    setTournamentExcelFile(null)
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!tournamentExcelFile}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

