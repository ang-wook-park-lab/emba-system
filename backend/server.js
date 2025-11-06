import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './database/db.js'
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

// SQLite 데이터베이스 초기화
try {
  initializeDatabase()
  console.log('✅ SQLite 데이터베이스 연결 성공')
} catch (err) {
  console.error('❌ SQLite 데이터베이스 연결 실패:', err.message)
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

