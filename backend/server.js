import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { initializeDatabase } from './database/db.js'
import { getDb } from './database/db.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import expenseRoutes from './routes/expenses.js'
import approvalRoutes from './routes/approvals.js'
import sponsorshipRoutes from './routes/sponsorships.js'
import participantRoutes from './routes/participants.js'
import golfTournamentRoutes from './routes/golf-tournaments.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:3000'),
  credentials: true
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 정적 파일 제공 (업로드된 영수증 이미지)
app.use('/uploads', express.static('uploads'))

// 관리자 계정 자동 생성 함수
async function createDefaultAdmin() {
  try {
    const db = getDb()
    const adminUserId = 'admin'
    const adminPassword = 'admin1234'
    const adminName = '관리자'
    const adminPhone = '01012345678'

    // 이미 존재하는지 확인
    const checkStmt = db.prepare('SELECT * FROM users WHERE userId = ? OR phone = ?')
    const existing = checkStmt.get(adminUserId, adminPhone)

    if (existing) {
      console.log('✅ 관리자 계정이 이미 존재합니다.')
      return
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // 관리자 계정 생성
    const stmt = db.prepare(`
      INSERT INTO users (name, userId, email, phone, password, role, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      adminName,
      adminUserId,
      `${adminUserId}@admin.local`,
      adminPhone,
      hashedPassword,
      'admin',
      1
    )

    console.log('✅ 기본 관리자 계정이 생성되었습니다!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('아이디:', adminUserId)
    console.log('비밀번호:', adminPassword)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('⚠️ 관리자 계정 생성 실패:', error.message)
  }
}

// 서버 초기화 및 시작 함수
async function startServer() {
  try {
    // SQLite 데이터베이스 초기화
    initializeDatabase()
    console.log('✅ SQLite 데이터베이스 연결 성공')
    
    // 관리자 계정 자동 생성
    await createDefaultAdmin()
  } catch (err) {
    console.error('❌ 데이터베이스 초기화 실패:', err.message)
  }

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/expenses', expenseRoutes)
  app.use('/api/approvals', approvalRoutes)
  app.use('/api/sponsorships', sponsorshipRoutes)
  app.use('/api/participants', participantRoutes)
  app.use('/api/golf-tournaments', golfTournamentRoutes)

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK',
      message: '서버가 정상 작동 중입니다.',
      database: 'SQLite'
    })
  })

  // 프로덕션 환경에서 프론트엔드 빌드 파일 서빙
  if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist')
    app.use(express.static(frontendDistPath))
    
    // 모든 라우트를 index.html로 리다이렉트 (SPA 라우팅 지원)
    app.get('*', (req, res) => {
      // API 라우트는 제외
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API 엔드포인트를 찾을 수 없습니다.' })
      }
      res.sendFile(path.join(frontendDistPath, 'index.html'))
    })
  }

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message })
  })

  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
    if (process.env.NODE_ENV === 'production') {
      console.log('프로덕션 모드: 프론트엔드 빌드 파일을 서빙합니다.')
    }
  })
}

// 서버 시작
startServer()

