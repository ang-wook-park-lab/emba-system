import express from 'express'
import GolfTournament from '../models/GolfTournament.js'
import GolfScore from '../models/GolfScore.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 골프대회 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const tournaments = GolfTournament.findAll()
    res.json({ tournaments })
  } catch (error) {
    console.error('골프대회 조회 오류:', error)
    res.status(500).json({ message: '골프대회 조회 실패', error: error.message })
  }
})

// 골프대회 상세 조회 (스코어 포함)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const tournament = GolfTournament.findById(id)
    
    if (!tournament) {
      return res.status(404).json({ message: '골프대회를 찾을 수 없습니다.' })
    }

    const scores = GolfScore.findByTournament(id)
    
    // 각 참석자별 평균 스코어 계산하여 추가 (현재 대회 제외한 과거 누적 평균)
    const scoresWithAverage = scores.map(score => {
      const averageData = GolfScore.getAverageScoreByParticipantExcludingTournament(score.participantName, id)
      // 과거 기록이 없으면 현재 스코어를 표시
      return {
        ...score.toJSON(),
        averageScore: averageData ? averageData.averageScore : score.score
      }
    })
    
    res.json({ 
      tournament: tournament.toJSON(),
      scores: scoresWithAverage
    })
  } catch (error) {
    console.error('골프대회 상세 조회 오류:', error)
    res.status(500).json({ message: '골프대회 상세 조회 실패', error: error.message })
  }
})

// 골프대회 생성
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, date, location, description } = req.body

    if (!name || !date) {
      return res.status(400).json({ message: '대회명과 날짜는 필수 입력 항목입니다.' })
    }

    const tournament = GolfTournament.create({
      name,
      date,
      location,
      description
    })

    res.status(201).json({
      message: '골프대회가 생성되었습니다.',
      tournament: tournament.toJSON()
    })
  } catch (error) {
    console.error('골프대회 생성 오류:', error)
    res.status(500).json({ message: '골프대회 생성 실패', error: error.message })
  }
})

// 골프대회 수정
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { name, date, location, description } = req.body

    const tournament = GolfTournament.findById(id)
    if (!tournament) {
      return res.status(404).json({ message: '골프대회를 찾을 수 없습니다.' })
    }

    const updated = GolfTournament.update(id, {
      name,
      date,
      location,
      description
    })

    res.json({
      message: '골프대회가 수정되었습니다.',
      tournament: updated.toJSON()
    })
  } catch (error) {
    console.error('골프대회 수정 오류:', error)
    res.status(500).json({ message: '골프대회 수정 실패', error: error.message })
  }
})

// 골프대회 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const tournament = GolfTournament.findById(id)
    if (!tournament) {
      return res.status(404).json({ message: '골프대회를 찾을 수 없습니다.' })
    }

    GolfTournament.delete(id)

    res.json({ message: '골프대회가 삭제되었습니다.' })
  } catch (error) {
    console.error('골프대회 삭제 오류:', error)
    res.status(500).json({ message: '골프대회 삭제 실패', error: error.message })
  }
})

// 스코어 추가
router.post('/:id/scores', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { participantName, score, handicap, notes } = req.body

    if (!participantName || score === undefined) {
      return res.status(400).json({ message: '참석자명과 스코어는 필수 입력 항목입니다.' })
    }

    const tournament = GolfTournament.findById(id)
    if (!tournament) {
      return res.status(404).json({ message: '골프대회를 찾을 수 없습니다.' })
    }

    const golfScore = GolfScore.create({
      tournamentId: id,
      participantName,
      score: parseInt(score),
      handicap: handicap ? parseInt(handicap) : 0,
      notes
    })

    res.status(201).json({
      message: '스코어가 추가되었습니다.',
      score: golfScore.toJSON()
    })
  } catch (error) {
    console.error('스코어 추가 오류:', error)
    res.status(500).json({ message: '스코어 추가 실패', error: error.message })
  }
})

// 스코어 수정
router.put('/scores/:scoreId', authenticate, async (req, res) => {
  try {
    const { scoreId } = req.params
    const { participantName, score, handicap, notes } = req.body

    const golfScore = GolfScore.findById(scoreId)
    if (!golfScore) {
      return res.status(404).json({ message: '스코어를 찾을 수 없습니다.' })
    }

    const updated = GolfScore.update(scoreId, {
      participantName,
      score: score !== undefined ? parseInt(score) : undefined,
      handicap: handicap !== undefined ? parseInt(handicap) : undefined,
      notes
    })

    res.json({
      message: '스코어가 수정되었습니다.',
      score: updated.toJSON()
    })
  } catch (error) {
    console.error('스코어 수정 오류:', error)
    res.status(500).json({ message: '스코어 수정 실패', error: error.message })
  }
})

// 스코어 삭제
router.delete('/scores/:scoreId', authenticate, async (req, res) => {
  try {
    const { scoreId } = req.params

    const golfScore = GolfScore.findById(scoreId)
    if (!golfScore) {
      return res.status(404).json({ message: '스코어를 찾을 수 없습니다.' })
    }

    GolfScore.delete(scoreId)

    res.json({ message: '스코어가 삭제되었습니다.' })
  } catch (error) {
    console.error('스코어 삭제 오류:', error)
    res.status(500).json({ message: '스코어 삭제 실패', error: error.message })
  }
})

// 통계 조회 (참석자별 평균 스코어 등)
router.get('/stats/participants', authenticate, async (req, res) => {
  try {
    const averages = GolfScore.getAllParticipantAverages()
    res.json({ averages })
  } catch (error) {
    console.error('통계 조회 오류:', error)
    res.status(500).json({ message: '통계 조회 실패', error: error.message })
  }
})

// 참석자별 스코어 조회 (날짜별)
router.get('/participant/:participantName/scores', authenticate, async (req, res) => {
  try {
    const { participantName } = req.params
    const scores = GolfScore.findByParticipantWithTournament(participantName)
    res.json({ scores })
  } catch (error) {
    console.error('참석자별 스코어 조회 오류:', error)
    res.status(500).json({ message: '참석자별 스코어 조회 실패', error: error.message })
  }
})

export default router

