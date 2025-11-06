import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '..', 'data', 'expense-management.db')

// data 디렉토리가 없으면 생성
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 데이터베이스 연결
const db = new Database(dbPath)

// 외래 키 제약 조건 활성화
db.pragma('foreign_keys = ON')

// 데이터베이스 초기화
function initializeDatabase() {
  // Users 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      userId TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'approver', 'user')),
      department TEXT,
      position TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 기존 테이블에 userId 컬럼 추가 (마이그레이션)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN userId TEXT UNIQUE`)
  } catch (error) {
    // 컬럼이 이미 존재하면 무시
  }
}

// 관리자 계정 정보
const adminUserId = 'admin'
const adminPassword = 'admin1234'
const adminName = '관리자'
const adminPhone = '01012345678'

async function createAdmin() {
  try {
    // 데이터베이스 초기화
    initializeDatabase()

    // userId 컬럼 존재 여부 확인
    let hasUserIdColumn = false
    try {
      const testStmt = db.prepare('SELECT userId FROM users LIMIT 1')
      testStmt.get()
      hasUserIdColumn = true
    } catch (error) {
      // userId 컬럼이 없으면 마이그레이션 필요
      hasUserIdColumn = false
    }

    // 이미 존재하는지 확인
    let existing = null
    if (hasUserIdColumn) {
      const checkStmt = db.prepare('SELECT * FROM users WHERE userId = ? OR phone = ?')
      existing = checkStmt.get(adminUserId, adminPhone)
    } else {
      const checkStmt = db.prepare('SELECT * FROM users WHERE phone = ?')
      existing = checkStmt.get(adminPhone)
    }

    if (existing) {
      console.log('이미 관리자 계정이 존재합니다.')
      console.log('아이디:', existing.userId || '없음')
      console.log('이름:', existing.name)
      console.log('권한:', existing.role)
      
      // userId가 없으면 업데이트
      if (!existing.userId && hasUserIdColumn) {
        const updateStmt = db.prepare('UPDATE users SET userId = ? WHERE id = ?')
        updateStmt.run(adminUserId, existing.id)
        console.log('✅ 아이디가 업데이트되었습니다:', adminUserId)
      }
      return
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // 관리자 계정 생성
    let stmt
    if (hasUserIdColumn) {
      stmt = db.prepare(`
        INSERT INTO users (name, userId, email, phone, password, role, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(
        adminName,
        adminUserId,
        `${adminUserId}@admin.local`, // 이메일 기본값
        adminPhone,
        hashedPassword,
        'admin',
        1
      )
    } else {
      // userId 컬럼이 없는 경우
      // email 컬럼이 NOT NULL인지 확인
      let emailValue = null
      try {
        // email 컬럼이 NOT NULL인지 확인하기 위해 테스트
        const testStmt = db.prepare('SELECT email FROM users LIMIT 1')
        const test = testStmt.get()
        // 이메일이 필수라면 기본값 사용
        emailValue = `${adminUserId}@admin.local`
      } catch (error) {
        emailValue = null
      }
      
      stmt = db.prepare(`
        INSERT INTO users (name, email, phone, password, role, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        adminName,
        emailValue || `${adminUserId}@admin.local`, // 이메일 기본값
        adminPhone,
        hashedPassword,
        'admin',
        1
      )
      // userId 컬럼 추가 후 업데이트
      try {
        db.exec(`ALTER TABLE users ADD COLUMN userId TEXT UNIQUE`)
        const updateStmt = db.prepare('UPDATE users SET userId = ? WHERE id = ?')
        updateStmt.run(adminUserId, result.lastInsertRowid)
      } catch (error) {
        // 컬럼이 이미 존재하거나 업데이트 실패 시 무시
      }
    }

    console.log('✅ 관리자 계정이 생성되었습니다!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('아이디:', adminUserId)
    console.log('비밀번호:', adminPassword)
    console.log('이름:', adminName)
    console.log('권한: 관리자')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('❌ 관리자 계정 생성 실패:', error)
    throw error
  } finally {
    db.close()
  }
}

createAdmin()

