import express from 'express'
import Expense from '../models/Expense.js'
import Approval from '../models/Approval.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 지출 승인
router.post('/:approvalId/approve', authenticate, async (req, res) => {
  try {
    const { approvalId } = req.params
    const userId = req.user.id
    
    // 승인 레코드 조회
    const approval = Approval.findById(parseInt(approvalId))
    if (!approval) {
      return res.status(404).json({ message: '승인 요청을 찾을 수 없습니다.' })
    }
    
    // 권한 확인: 지정된 승인자이거나 관리자여야 함
    if (approval.approverId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '승인 권한이 없습니다.' })
    }
    
    // 이미 처리된 승인인지 확인
    if (approval.status !== '대기중') {
      return res.status(400).json({ message: '이미 처리된 승인 요청입니다.' })
    }
    
    // 승인 처리
    Approval.update(parseInt(approvalId), {
      status: '승인',
      approvedAt: new Date().toISOString()
    })
    
    // 해당 지출의 모든 승인 상태 확인
    const expense = Expense.findById(approval.expenseId)
    const allApprovals = Approval.findByExpenseId(approval.expenseId)
    
    // 모든 승인이 완료되었는지 확인
    const allApproved = allApprovals.every(a => a.status === '승인')
    
    if (allApproved) {
      // 모두 승인되면 지출 상태를 '승인완료'로 변경
      Expense.update(approval.expenseId, { status: '승인완료' })
      console.log(`지출 ID ${approval.expenseId} 승인 완료`)
    }
    
    res.json({
      message: '승인이 완료되었습니다.',
      approval: Approval.findById(parseInt(approvalId)).toJSON()
    })
  } catch (error) {
    console.error('승인 처리 실패:', error)
    res.status(500).json({ message: '승인 처리에 실패했습니다.', error: error.message })
  }
})

// 지출 반려
router.post('/:approvalId/reject', authenticate, async (req, res) => {
  try {
    const { approvalId } = req.params
    const { comment } = req.body
    const userId = req.user.id
    
    // 승인 레코드 조회
    const approval = Approval.findById(parseInt(approvalId))
    if (!approval) {
      return res.status(404).json({ message: '승인 요청을 찾을 수 없습니다.' })
    }
    
    // 권한 확인: 지정된 승인자이거나 관리자여야 함
    if (approval.approverId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '반려 권한이 없습니다.' })
    }
    
    // 이미 처리된 승인인지 확인
    if (approval.status !== '대기중') {
      return res.status(400).json({ message: '이미 처리된 승인 요청입니다.' })
    }
    
    // 반려 처리
    Approval.update(parseInt(approvalId), {
      status: '반려',
      comment: comment || '반려됨',
      approvedAt: new Date().toISOString()
    })
    
    // 지출 상태를 '반려'로 변경
    Expense.update(approval.expenseId, { status: '반려' })
    console.log(`지출 ID ${approval.expenseId} 반려됨`)
    
    res.json({
      message: '반려가 완료되었습니다.',
      approval: Approval.findById(parseInt(approvalId)).toJSON()
    })
  } catch (error) {
    console.error('반려 처리 실패:', error)
    res.status(500).json({ message: '반려 처리에 실패했습니다.', error: error.message })
  }
})

export default router
