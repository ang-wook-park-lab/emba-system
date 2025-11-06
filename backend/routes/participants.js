import express from 'express'
import Participant from '../models/Participant.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 참석자 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const participants = Participant.findAll()
    res.json({
      success: true,
      participants
    })
  } catch (error) {
    console.error('참석자 조회 실패:', error)
    res.status(500).json({
      success: false,
      message: '참석자 조회에 실패했습니다.'
    })
  }
})

// 특정 참석자 조회
router.get('/:id', authenticate, async (req, res) => {
  try {
    const participant = Participant.findById(req.params.id)
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: '참석자를 찾을 수 없습니다.'
      })
    }
    
    res.json({
      success: true,
      participant
    })
  } catch (error) {
    console.error('참석자 조회 실패:', error)
    res.status(500).json({
      success: false,
      message: '참석자 조회에 실패했습니다.'
    })
  }
})

// 프로젝트별 참석자 조회
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const participants = Participant.findByProjectId(req.params.projectId)
    
    res.json({
      success: true,
      participants
    })
  } catch (error) {
    console.error('프로젝트 참석자 조회 실패:', error)
    res.status(500).json({
      success: false,
      message: '프로젝트 참석자 조회에 실패했습니다.'
    })
  }
})

// 프로젝트별 참석자 통계 조회
router.get('/stats/:projectId', authenticate, async (req, res) => {
  try {
    const stats = Participant.getStatsByProjectId(req.params.projectId)
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('참석자 통계 조회 실패:', error)
    res.status(500).json({
      success: false,
      message: '참석자 통계 조회에 실패했습니다.'
    })
  }
})

// 참석자 추가
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, category, name, phone, grade, notes } = req.body
    
    // 필수 필드 검증
    if (!projectId || !category || !name) {
      return res.status(400).json({
        success: false,
        message: '프로젝트, 구분, 이름은 필수 항목입니다.'
      })
    }
    
    const participant = Participant.create({
      projectId,
      category,
      name,
      phone,
      grade,
      notes
    })
    
    res.status(201).json({
      success: true,
      message: '참석자가 추가되었습니다.',
      participant
    })
  } catch (error) {
    console.error('참석자 추가 실패:', error)
    res.status(500).json({
      success: false,
      message: '참석자 추가에 실패했습니다.'
    })
  }
})

// 참석자 일괄 추가 (엑셀 업로드)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { participants } = req.body
    
    console.log('일괄 추가 요청:', {
      participantsCount: participants?.length,
      sampleData: participants?.[0]
    })
    
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: '참석자 목록이 비어있습니다.'
      })
    }
    
    // 각 참석자 데이터 검증
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i]
      if (!p.projectId || isNaN(parseInt(p.projectId))) {
        return res.status(400).json({
          success: false,
          message: `${i + 1}번째 참석자: 프로젝트ID가 올바르지 않습니다. (현재 값: ${p.projectId})`
        })
      }
      if (!p.category) {
        return res.status(400).json({
          success: false,
          message: `${i + 1}번째 참석자: 구분이 필요합니다.`
        })
      }
      if (!p.name || p.name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${i + 1}번째 참석자: 이름이 필요합니다.`
        })
      }
    }
    
    const result = Participant.bulkCreate(participants)
    console.log('일괄 추가 성공:', result)
    
    res.status(201).json({
      success: true,
      message: `${result.count}명의 참석자가 추가되었습니다.`,
      count: result.count
    })
  } catch (error) {
    console.error('참석자 일괄 추가 실패:', error)
    res.status(500).json({
      success: false,
      message: `참석자 일괄 추가에 실패했습니다. ${error.message}`
    })
  }
})

// 참석자 수정
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { category, name, phone, grade, notes } = req.body
    
    const participant = Participant.update(req.params.id, {
      category,
      name,
      phone,
      grade,
      notes
    })
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: '참석자를 찾을 수 없습니다.'
      })
    }
    
    res.json({
      success: true,
      message: '참석자가 수정되었습니다.',
      participant
    })
  } catch (error) {
    console.error('참석자 수정 실패:', error)
    res.status(500).json({
      success: false,
      message: '참석자 수정에 실패했습니다.'
    })
  }
})

// 참석자 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const success = Participant.delete(req.params.id)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '참석자를 찾을 수 없습니다.'
      })
    }
    
    res.json({
      success: true,
      message: '참석자가 삭제되었습니다.'
    })
  } catch (error) {
    console.error('참석자 삭제 실패:', error)
    res.status(500).json({
      success: false,
      message: '참석자 삭제에 실패했습니다.'
    })
  }
})

export default router

