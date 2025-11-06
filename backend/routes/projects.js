import express from 'express'
import Project from '../models/Project.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// 모든 프로젝트 조회 (인증된 사용자)
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = Project.findAll()
    res.json({
      projects: projects.map(p => p.toJSON())
    })
  } catch (error) {
    console.error('프로젝트 조회 실패:', error)
    res.status(500).json({ message: '프로젝트 조회에 실패했습니다.' })
  }
})

// 특정 프로젝트 조회 (인증된 사용자)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = Project.findById(req.params.id)
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' })
    }

    res.json({ project: project.toJSON() })
  } catch (error) {
    console.error('프로젝트 조회 실패:', error)
    res.status(500).json({ message: '프로젝트 조회에 실패했습니다.' })
  }
})

// 프로젝트 생성 (관리자만)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, budget, status, startDate, endDate, participants, approvers } = req.body

    // 유효성 검사
    if (!name || !name.trim()) {
      return res.status(400).json({ message: '프로젝트 이름을 입력해주세요.' })
    }

    if (!budget || isNaN(budget) || Number(budget) <= 0) {
      return res.status(400).json({ message: '올바른 예산을 입력해주세요.' })
    }

    if (!startDate) {
      return res.status(400).json({ message: '시작일을 입력해주세요.' })
    }

    // 참석자와 승인자를 배열에서 문자열로 변환
    const participantsStr = Array.isArray(participants) 
      ? participants.join(', ') 
      : participants || null
    
    const approversStr = Array.isArray(approvers) 
      ? approvers.join(', ') 
      : approvers || null

    const project = Project.create({
      name: name.trim(),
      budget: Number(budget),
      spent: 0,
      status: status || '진행중',
      startDate,
      endDate: endDate || null,
      participants: participantsStr,
      approvers: approversStr
    })

    res.status(201).json({
      message: '프로젝트가 생성되었습니다.',
      project: project.toJSON()
    })
  } catch (error) {
    console.error('프로젝트 생성 실패:', error)
    res.status(500).json({ message: '프로젝트 생성에 실패했습니다.' })
  }
})

// 프로젝트 수정 (관리자만)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, budget, spent, status, startDate, endDate, participants, approvers } = req.body

    const project = Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' })
    }

    // 참석자와 승인자를 배열에서 문자열로 변환
    const participantsStr = Array.isArray(participants) 
      ? participants.join(', ') 
      : participants
    
    const approversStr = Array.isArray(approvers) 
      ? approvers.join(', ') 
      : approvers

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (budget !== undefined) updateData.budget = Number(budget)
    if (spent !== undefined) updateData.spent = Number(spent)
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined) updateData.startDate = startDate
    if (endDate !== undefined) updateData.endDate = endDate
    if (participantsStr !== undefined) updateData.participants = participantsStr
    if (approversStr !== undefined) updateData.approvers = approversStr

    const updatedProject = Project.update(req.params.id, updateData)

    res.json({
      message: '프로젝트가 수정되었습니다.',
      project: updatedProject.toJSON()
    })
  } catch (error) {
    console.error('프로젝트 수정 실패:', error)
    res.status(500).json({ message: '프로젝트 수정에 실패했습니다.' })
  }
})

// 프로젝트 삭제 (관리자만)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const project = Project.findById(req.params.id)
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' })
    }

    const deleted = Project.delete(req.params.id)

    if (deleted) {
      res.json({ message: '프로젝트가 삭제되었습니다.' })
    } else {
      res.status(500).json({ message: '프로젝트 삭제에 실패했습니다.' })
    }
  } catch (error) {
    console.error('프로젝트 삭제 실패:', error)
    res.status(500).json({ message: '프로젝트 삭제에 실패했습니다.' })
  }
})

export default router
