import express from 'express'
import Sponsorship from '../models/Sponsorship.js'
import Project from '../models/Project.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 후원 조회 또는 프로젝트별 후원 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.query
    
    let sponsorships
    if (projectId) {
      sponsorships = Sponsorship.findByProjectId(parseInt(projectId))
    } else {
      sponsorships = Sponsorship.findAll()
    }
    
    res.json({ sponsorships: sponsorships.map(s => s.toJSON()) })
  } catch (error) {
    console.error('후원 조회 실패:', error)
    res.status(500).json({ message: '후원 조회 실패', error: error.message })
  }
})

// 프로젝트별 후원 통계 조회
router.get('/stats/:projectId', authenticate, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId)
    
    // 프로젝트 존재 확인
    const project = Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' })
    }
    
    const stats = Sponsorship.getStatsByProjectId(projectId)
    res.json({ stats })
  } catch (error) {
    console.error('후원 통계 조회 실패:', error)
    res.status(500).json({ message: '후원 통계 조회 실패', error: error.message })
  }
})

// 특정 후원 조회
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sponsorship = Sponsorship.findById(parseInt(req.params.id))
    
    if (!sponsorship) {
      return res.status(404).json({ message: '후원을 찾을 수 없습니다.' })
    }
    
    res.json({ sponsorship: sponsorship.toJSON() })
  } catch (error) {
    console.error('후원 조회 실패:', error)
    res.status(500).json({ message: '후원 조회 실패', error: error.message })
  }
})

// 후원 일괄 추가 (엑셀 업로드)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { sponsorships } = req.body
    
    if (!Array.isArray(sponsorships) || sponsorships.length === 0) {
      return res.status(400).json({
        success: false,
        message: '후원 목록이 비어있습니다.'
      })
    }
    
    // 각 후원 데이터 검증
    for (const s of sponsorships) {
      if (!s.projectId || typeof s.projectId !== 'number') {
        return res.status(400).json({
          success: false,
          message: '각 후원은 유효한 프로젝트ID(숫자)를 포함해야 합니다.'
        })
      }
      if (!s.type || !['현금', '물품'].includes(s.type)) {
        return res.status(400).json({
          success: false,
          message: '각 후원은 유효한 유형(현금 또는 물품)을 포함해야 합니다.'
        })
      }
      if (!s.sponsorName || String(s.sponsorName).trim() === '') {
        return res.status(400).json({
          success: false,
          message: '각 후원은 협찬자명을 포함해야 합니다.'
        })
      }
    }
    
    const result = Sponsorship.bulkCreate(sponsorships)
    
    res.status(201).json({
      success: true,
      message: `${result.count}건의 후원 내역이 추가되었습니다.`,
      count: result.count
    })
  } catch (error) {
    console.error('후원 일괄 추가 실패:', error)
    res.status(500).json({
      success: false,
      message: '후원 일괄 추가에 실패했습니다.'
    })
  }
})

// 후원 생성
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, type, sponsorName, amount, itemName, quantity, date, notes } = req.body
    
    // 유효성 검사
    if (!projectId) {
      return res.status(400).json({ message: '프로젝트 ID가 필요합니다.' })
    }
    if (!type || !['현금', '물품'].includes(type)) {
      return res.status(400).json({ message: '유효한 후원 유형을 선택해주세요. (현금 또는 물품)' })
    }
    if (!sponsorName || !sponsorName.trim()) {
      return res.status(400).json({ message: '협찬자명을 입력해주세요.' })
    }
    if (!date) {
      return res.status(400).json({ message: '날짜를 입력해주세요.' })
    }
    
    // 현금 후원인 경우 금액 필수
    if (type === '현금' && (!amount || parseFloat(amount) <= 0)) {
      return res.status(400).json({ message: '현금 협찬은 금액을 입력해주세요.' })
    }
    
    // 물품 후원인 경우 물품명 필수
    if (type === '물품' && (!itemName || !itemName.trim())) {
      return res.status(400).json({ message: '물품 찬조는 물품명을 입력해주세요.' })
    }
    
    // 프로젝트 존재 확인
    const project = Project.findById(parseInt(projectId))
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' })
    }
    
    const sponsorshipData = {
      projectId: parseInt(projectId),
      type,
      sponsorName: sponsorName.trim(),
      amount: parseFloat(amount) || 0,
      itemName: itemName ? itemName.trim() : null,
      quantity: quantity ? parseInt(quantity) : null,
      date,
      notes: notes ? notes.trim() : null
    }
    
    const sponsorship = await Sponsorship.create(sponsorshipData)
    
    res.status(201).json({ 
      message: '후원이 등록되었습니다.', 
      sponsorship: sponsorship.toJSON() 
    })
  } catch (error) {
    console.error('후원 생성 실패:', error)
    res.status(500).json({ message: '후원 생성 실패', error: error.message })
  }
})

// 후원 수정
router.put('/:id', authenticate, async (req, res) => {
  try {
    const sponsorshipId = parseInt(req.params.id)
    const { type, sponsorName, amount, itemName, quantity, date, notes } = req.body
    
    // 후원 존재 확인
    const existingSponsorship = Sponsorship.findById(sponsorshipId)
    if (!existingSponsorship) {
      return res.status(404).json({ message: '후원을 찾을 수 없습니다.' })
    }
    
    // 유효성 검사
    if (type && !['현금', '물품'].includes(type)) {
      return res.status(400).json({ message: '유효한 후원 유형을 선택해주세요. (현금 또는 물품)' })
    }
    if (sponsorName !== undefined && !sponsorName.trim()) {
      return res.status(400).json({ message: '협찬자명을 입력해주세요.' })
    }
    
    const updateData = {}
    if (type !== undefined) updateData.type = type
    if (sponsorName !== undefined) updateData.sponsorName = sponsorName.trim()
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (itemName !== undefined) updateData.itemName = itemName ? itemName.trim() : null
    if (quantity !== undefined) updateData.quantity = quantity ? parseInt(quantity) : null
    if (date !== undefined) updateData.date = date
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null
    
    const updatedSponsorship = await Sponsorship.update(sponsorshipId, updateData)
    
    res.json({ 
      message: '후원이 수정되었습니다.', 
      sponsorship: updatedSponsorship.toJSON() 
    })
  } catch (error) {
    console.error('후원 수정 실패:', error)
    res.status(500).json({ message: '후원 수정 실패', error: error.message })
  }
})

// 후원 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sponsorshipId = parseInt(req.params.id)
    
    // 후원 존재 확인
    const sponsorship = Sponsorship.findById(sponsorshipId)
    if (!sponsorship) {
      return res.status(404).json({ message: '후원을 찾을 수 없습니다.' })
    }
    
    Sponsorship.delete(sponsorshipId)
    
    res.json({ message: '후원이 삭제되었습니다.' })
  } catch (error) {
    console.error('후원 삭제 실패:', error)
    res.status(500).json({ message: '후원 삭제 실패', error: error.message })
  }
})

export default router

