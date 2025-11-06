import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import db from '../database/db.js'

const router = express.Router()

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, userId, email, phone, password, role, department, position } = req.body
    
    console.log('=== 회원가입 요청 ===')
    console.log('이름:', name)
    console.log('아이디:', userId)
    console.log('이메일:', email)
    console.log('핸드폰:', phone)
    console.log('비밀번호 길이:', password?.length)
    console.log('권한:', role)
    console.log('부서:', department)
    console.log('직급/직책:', position)
    console.log('==================')

    // 필수 필드 확인
    if (!name || !password) {
      return res.status(400).json({ 
        message: '이름과 비밀번호는 필수 입력 항목입니다.' 
      })
    }

    if (!userId || !userId.trim()) {
      return res.status(400).json({ 
        message: '아이디는 필수 입력 항목입니다.' 
      })
    }

    // 아이디 형식 확인 (영문, 숫자, 언더스코어, 하이픈만 허용, 3-20자)
    const userIdRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!userIdRegex.test(userId.trim())) {
      return res.status(400).json({ 
        message: '아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능하며 3-20자여야 합니다.' 
      })
    }

    // 이메일이 제공된 경우 형식 확인
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: '올바른 이메일 형식을 입력해주세요.' 
        })
      }
    }

    if (!phone) {
      return res.status(400).json({ 
        message: '핸드폰 번호는 필수 입력 항목입니다.' 
      })
    }

    // 핸드폰 번호 형식 확인
    const phoneNumber = phone.replace(/-/g, '').replace(/\s/g, '')
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        message: '핸드폰 번호를 올바르게 입력해주세요. (10-11자리 숫자)' 
      })
    }

    // 아이디 중복 확인
    const existingUserByUserId = User.findByUserId(userId.trim())
    if (existingUserByUserId) {
      console.log('회원가입 실패: 이미 등록된 아이디 -', userId)
      return res.status(400).json({ 
        message: '이미 등록된 아이디입니다.' 
      })
    }

    // 이메일이 제공된 경우 중복 확인
    if (email && email.trim()) {
      const existingUserByEmail = User.findByEmail(email.toLowerCase())
      if (existingUserByEmail) {
        console.log('회원가입 실패: 이미 등록된 이메일 -', email)
        return res.status(400).json({ 
          message: '이미 등록된 이메일입니다.' 
        })
      }
    }

    // 핸드폰 번호 중복 확인
    const existingUserByPhone = User.findByPhone(phoneNumber)
    if (existingUserByPhone) {
      console.log('회원가입 실패: 이미 등록된 핸드폰 번호 -', phoneNumber)
      return res.status(400).json({ 
        message: '이미 등록된 핸드폰 번호입니다.' 
      })
    }

    // 비밀번호 길이 확인
    if (password.length < 4) {
      return res.status(400).json({ 
        message: '비밀번호는 최소 4자 이상이어야 합니다.' 
      })
    }

    // 사용자 생성
    try {
      const user = await User.create({
        name: name.trim(),
        userId: userId.trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone: phoneNumber,
        password,
        role: role || 'user',
        department: department || null,
        position: position || null
      })
      
      console.log('회원가입 성공:', userId, email ? `이메일: ${email}` : '', '핸드폰:', phoneNumber)

      // 토큰 생성
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      )

      res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        token,
        user: user.toJSON()
      })
    } catch (saveError) {
      console.error('사용자 저장 오류:', saveError)
      
      // SQLite UNIQUE 제약 조건 위반 (에러 코드 19)
      if (saveError.code === 19 || saveError.message?.includes('UNIQUE constraint')) {
        const errorMessage = saveError.message || ''
        if (errorMessage.includes('phone')) {
          return res.status(400).json({ 
            message: '이미 등록된 핸드폰 번호입니다.' 
          })
        } else if (errorMessage.includes('email')) {
          return res.status(500).json({ 
            message: '사용자 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' 
          })
        }
        return res.status(400).json({ 
          message: '이미 등록된 정보입니다.' 
        })
      }
      
      throw saveError
    }
  } catch (error) {
    console.error('=== 회원가입 오류 상세 ===')
    console.error('에러 이름:', error.name)
    console.error('에러 메시지:', error.message)
    console.error('에러 코드:', error.code)
    console.error('에러 스택:', error.stack)
    console.error('========================')
    
    res.status(500).json({ 
      message: '회원가입 처리 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'),
      error: error.message || '알 수 없는 오류'
    })
  }
})

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password) {
      return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' })
    }

    // 아이디로만 검색
    let user = User.findByUserId(identifier.trim())
    
    // 아이디로 찾지 못한 경우 이름으로 검색 (하위 호환성 유지)
    if (!user) {
      user = User.findByName(identifier.trim())
    }

    if (!user) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' })
    }

    if (user.isActive !== 1) {
      return res.status(401).json({ message: '비활성화된 계정입니다.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' })
    }

    // 토큰 생성
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    )

    res.json({
      message: '로그인 성공',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('로그인 오류:', error)
    res.status(500).json({ message: '로그인 실패', error: error.message })
  }
})

// 아이디 찾기
router.post('/find-user-id', async (req, res) => {
  try {
    const { name, phone } = req.body

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false,
        message: '이름과 핸드폰 번호를 입력해주세요.' 
      })
    }

    // 핸드폰 번호 형식 확인
    const phoneNumber = phone.replace(/-/g, '').replace(/\s/g, '')
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: '핸드폰 번호를 올바르게 입력해주세요. (10-11자리 숫자)' 
      })
    }

    // 이름과 핸드폰 번호로 사용자 찾기
    const stmt = db.prepare('SELECT userId FROM users WHERE name = ? AND phone = ? AND isActive = 1')
    const user = stmt.get(name.trim(), phoneNumber)

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: '일치하는 계정을 찾을 수 없습니다.' 
      })
    }

    if (!user.userId) {
      return res.status(404).json({ 
        success: false,
        message: '등록된 아이디가 없습니다. 관리자에게 문의해주세요.' 
      })
    }

    res.json({
      success: true,
      userId: user.userId,
      message: '아이디를 찾았습니다.'
    })
  } catch (error) {
    console.error('아이디 찾기 오류:', error)
    res.status(500).json({ 
      success: false,
      message: '아이디 찾기에 실패했습니다.', 
      error: error.message 
    })
  }
})

// 비밀번호 재설정
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, phone, newPassword } = req.body

    if (!userId || !phone || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: '아이디, 핸드폰 번호, 새 비밀번호를 모두 입력해주세요.' 
      })
    }

    // 핸드폰 번호 형식 확인
    const phoneNumber = phone.replace(/-/g, '').replace(/\s/g, '')
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: '핸드폰 번호를 올바르게 입력해주세요. (10-11자리 숫자)' 
      })
    }

    // 비밀번호 길이 확인
    if (newPassword.length < 4) {
      return res.status(400).json({ 
        success: false,
        message: '비밀번호는 최소 4자 이상이어야 합니다.' 
      })
    }

    // 아이디와 핸드폰 번호로 사용자 찾기
    const stmt = db.prepare('SELECT * FROM users WHERE userId = ? AND phone = ? AND isActive = 1')
    const userRow = stmt.get(userId.trim(), phoneNumber)

    if (!userRow) {
      return res.status(404).json({ 
        success: false,
        message: '일치하는 계정을 찾을 수 없습니다.' 
      })
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 비밀번호 업데이트
    const updateStmt = db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
    updateStmt.run(hashedPassword, userRow.id)

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 재설정되었습니다.'
    })
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error)
    res.status(500).json({ 
      success: false,
      message: '비밀번호 재설정에 실패했습니다.', 
      error: error.message 
    })
  }
})

// 현재 사용자 정보
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }
    res.json({ user: user.toJSON() })
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error)
    res.status(500).json({ message: '사용자 정보 조회 실패', error: error.message })
  }
})

// 모든 사용자 목록 조회 (관리자만)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, name, userId, email, phone, role, department, position, isActive, createdAt FROM users ORDER BY id DESC')
    const users = stmt.all()
    
    res.json({ 
      users: users.map(user => ({
        ...user,
        isActive: user.isActive === 1
      }))
    })
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    res.status(500).json({ message: '사용자 목록 조회 실패', error: error.message })
  }
})

// 사용자 정보 수정 (관리자만)
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { department, position, role, isActive } = req.body

    // 사용자 존재 확인
    const user = User.findById(id)
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }

    // 업데이트 쿼리
    const stmt = db.prepare(`
      UPDATE users 
      SET department = ?, position = ?, role = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    stmt.run(
      department || null,
      position || null,
      role || 'user',
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      id
    )

    // 업데이트된 사용자 정보 조회
    const updatedUser = User.findById(id)
    
    res.json({ 
      message: '사용자 정보가 수정되었습니다.',
      user: updatedUser.toJSON()
    })
  } catch (error) {
    console.error('사용자 수정 오류:', error)
    res.status(500).json({ message: '사용자 정보 수정 실패', error: error.message })
  }
})

// 사용자 삭제 (관리자만)
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // 자기 자신은 삭제 불가
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: '자기 자신은 삭제할 수 없습니다.' })
    }

    // 사용자 존재 확인
    const user = User.findById(id)
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }

    // 사용자 삭제
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    stmt.run(id)

    res.json({ message: '사용자가 삭제되었습니다.' })
  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    res.status(500).json({ message: '사용자 삭제 실패', error: error.message })
  }
})

export default router
