import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Expense from '../models/Expense.js'
import Approval from '../models/Approval.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// uploads 디렉토리 생성
const uploadsDir = path.join(__dirname, '..', 'uploads', 'receipts')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('이미지 또는 PDF 파일만 업로드 가능합니다.'))
    }
  }
})

// 모든 지출 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId, status } = req.query
    const filters = {}

    if (projectId && projectId !== 'all') {
      filters.projectId = parseInt(projectId)
    }

    if (status && status !== 'all') {
      filters.status = status
    }

    const expenses = Expense.findAll(filters)

    // 각 지출에 대한 승인 정보, 프로젝트 정보, 요청자 정보 추가
    const expensesWithDetails = expenses.map(expense => {
      const approvals = Approval.findByExpenseId(expense.id)
      const project = Project.findById(expense.projectId)
      const requester = User.findById(expense.requesterId)
      
      return {
        ...expense.toJSON(),
        project: project ? { id: project.id, name: project.name } : null,
        projectName: project ? project.name : null,
        requester: requester ? { id: requester.id, name: requester.name } : null,
        requesterName: requester ? requester.name : null,
        approvals: approvals.map(a => a.toJSON())
      }
    })

    res.json({ expenses: expensesWithDetails })
  } catch (error) {
    console.error('지출 조회 실패:', error)
    res.status(500).json({ message: '지출 조회 실패', error: error.message })
  }
})

// 승인 대기 지출 조회 (승인자용)
router.get('/pending', authenticate, async (req, res) => {
  try {
    // 승인자 권한 확인
    if (req.user.role !== 'admin' && req.user.role !== 'approver') {
      return res.status(403).json({ message: '승인자 권한이 필요합니다.' })
    }

    // 관리자는 모든 승인중인 지출을 볼 수 있음
    let expenses
    if (req.user.role === 'admin') {
      expenses = Expense.findAll({ status: '승인중' })
    } else {
      expenses = Expense.findPendingByApprover(req.user.id)
    }

    // 각 지출에 대한 승인 정보, 프로젝트 정보, 요청자 정보 추가
    const expensesWithDetails = expenses.map(expense => {
      const approvals = Approval.findByExpenseId(expense.id)
      const project = Project.findById(expense.projectId)
      const requester = User.findById(expense.requesterId)
      
      return {
        ...expense.toJSON(),
        project: project ? { id: project.id, name: project.name } : null,
        projectName: project ? project.name : null,
        requester: requester ? { id: requester.id, name: requester.name } : null,
        requesterName: requester ? requester.name : null,
        approvals: approvals.map(a => a.toJSON())
      }
    })

    res.json({ expenses: expensesWithDetails })
  } catch (error) {
    console.error('승인 대기 지출 조회 실패:', error)
    res.status(500).json({ message: '승인 대기 지출 조회 실패', error: error.message })
  }
})

// 지출 요청
router.post('/request', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    const { projectId, category, amount, currency, description, bankName, accountNumber, accountHolder } = req.body

    console.log('지출 요청 데이터:', { projectId, category, amount, currency, description, bankName, accountNumber, accountHolder })

    // 유효성 검사
    if (!projectId || !category || !amount || !description) {
      return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' })
    }

    const project = Project.findById(parseInt(projectId))
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' })
    }

    // 지출 생성
    const expenseData = {
      projectId: parseInt(projectId),
      requesterId: req.user.id,
      category,
      amount: parseFloat(amount),
      currency: currency || 'KRW',
      description,
      status: '대기중'
    }

    // 은행 정보 추가
    if (bankName) expenseData.bankName = bankName
    if (accountNumber) expenseData.accountNumber = accountNumber
    if (accountHolder) expenseData.accountHolder = accountHolder

    // 영수증 파일이 있으면 저장
    if (req.file) {
      expenseData.receiptFilename = req.file.filename
      // 프론트엔드에서 사용할 수 있는 상대 경로로 저장
      expenseData.receiptPath = `/uploads/receipts/${req.file.filename}`
      expenseData.receiptMimetype = req.file.mimetype
      console.log('영수증 파일 저장:', expenseData.receiptPath)
    }

    const expense = await Expense.create(expenseData)
    console.log('지출 생성 완료:', expense.id)

    // 금액에 따른 자동 승인자 지정
    const expenseAmount = parseFloat(amount)
    const THRESHOLD = 1000000 // 100만원
    
    // 직책별 승인자 찾기
    const dongmunhoejang = User.findByPosition('동문회장')
    const unyeongwijang = User.findByPosition('운영위원장')
    
    const approverIds = []
    
    if (expenseAmount >= THRESHOLD) {
      // 100만원 이상: 동문회장 + 운영위원장 두 사람 모두 승인 필요
      console.log('100만원 이상 지출 - 동문회장 + 운영위원장 승인 필요')
      
      if (dongmunhoejang) {
        await Approval.create({
          expenseId: expense.id,
          approverId: dongmunhoejang.id,
          status: '대기중'
        })
        approverIds.push(dongmunhoejang.id)
        console.log('승인자 추가:', dongmunhoejang.name, '(동문회장)')
      } else {
        console.warn('동문회장을 찾을 수 없습니다.')
      }
      
      if (unyeongwijang) {
        await Approval.create({
          expenseId: expense.id,
          approverId: unyeongwijang.id,
          status: '대기중'
        })
        approverIds.push(unyeongwijang.id)
        console.log('승인자 추가:', unyeongwijang.name, '(운영위원장)')
      } else {
        console.warn('운영위원장을 찾을 수 없습니다.')
      }
    } else {
      // 100만원 미만: 운영위원장만 승인 필요
      console.log('100만원 미만 지출 - 운영위원장 승인 필요')
      
      if (unyeongwijang) {
        await Approval.create({
          expenseId: expense.id,
          approverId: unyeongwijang.id,
          status: '대기중'
        })
        approverIds.push(unyeongwijang.id)
        console.log('승인자 추가:', unyeongwijang.name, '(운영위원장)')
      } else {
        console.warn('운영위원장을 찾을 수 없습니다.')
      }
    }

    if (approverIds.length > 0) {
      // 지출 상태를 승인중으로 변경
      await Expense.update(expense.id, { status: '승인중' })
      console.log('승인 요청 생성 완료:', approverIds.length, '명')
    } else {
      console.warn('승인자를 찾을 수 없어 자동 승인 처리합니다.')
      await Expense.update(expense.id, { status: '승인완료' })
    }

    // 최신 지출 정보 조회
    const createdExpense = Expense.findById(expense.id)
    const approvals = Approval.findByExpenseId(expense.id)

    res.status(201).json({ 
      message: '지출 요청이 제출되었습니다.', 
      expense: {
        ...createdExpense.toJSON(),
        approvals: approvals.map(a => a.toJSON())
      }
    })
  } catch (error) {
    console.error('지출 요청 실패:', error)
    res.status(500).json({ message: '지출 요청 실패', error: error.message })
  }
})

// 지출 상세 조회
router.get('/:id', authenticate, async (req, res) => {
  try {
    const expense = Expense.findById(parseInt(req.params.id))

    if (!expense) {
      return res.status(404).json({ message: '지출을 찾을 수 없습니다.' })
    }

    // 승인 정보 추가
    const approvals = Approval.findByExpenseId(expense.id)

    res.json({ 
      expense: {
        ...expense.toJSON(),
        approvals: approvals.map(a => a.toJSON())
      }
    })
  } catch (error) {
    console.error('지출 조회 실패:', error)
    res.status(500).json({ message: '지출 조회 실패', error: error.message })
  }
})

// 지출 수정
router.put('/:id', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id)
    const expense = Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({ message: '지출을 찾을 수 없습니다.' })
    }

    // 요청자이거나 관리자만 수정 가능
    if (req.user.role !== 'admin' && expense.requesterId !== req.user.id) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' })
    }

    // 승인된 지출은 수정 불가
    if (expense.status === '승인완료') {
      return res.status(400).json({ message: '승인된 지출은 수정할 수 없습니다.' })
    }

    const { category, amount, description, bankName, accountNumber, accountHolder } = req.body

    const updateData = {}
    if (category) updateData.category = category
    if (amount) updateData.amount = parseFloat(amount)
    if (description) updateData.description = description
    if (bankName !== undefined) updateData.bankName = bankName || null
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder || null
    
    // 새 영수증 파일이 업로드되었으면 추가
    if (req.file) {
      updateData.receiptFilename = req.file.filename
      updateData.receiptPath = req.file.path
      updateData.receiptMimetype = req.file.mimetype
    }

    await Expense.update(expenseId, updateData)
    const updatedExpense = Expense.findById(expenseId)

    res.json({ 
      message: '지출이 수정되었습니다.', 
      expense: updatedExpense.toJSON() 
    })
  } catch (error) {
    console.error('지출 수정 실패:', error)
    res.status(500).json({ message: '지출 수정 실패', error: error.message })
  }
})

// 지출 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = Expense.findById(parseInt(req.params.id))

    if (!expense) {
      return res.status(404).json({ message: '지출을 찾을 수 없습니다.' })
    }

    // 요청자이거나 관리자만 삭제 가능
    if (req.user.role !== 'admin' && expense.requesterId !== req.user.id) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' })
    }

    // 승인된 지출은 삭제 불가
    if (expense.status === '승인완료') {
      return res.status(400).json({ message: '승인된 지출은 삭제할 수 없습니다.' })
    }

    Expense.delete(parseInt(req.params.id))
    res.json({ message: '지출이 삭제되었습니다.' })
  } catch (error) {
    console.error('지출 삭제 실패:', error)
    res.status(500).json({ message: '지출 삭제 실패', error: error.message })
  }
})

export default router

