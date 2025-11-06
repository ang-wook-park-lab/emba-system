import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '..', 'data', 'expense-management.db')

if (!fs.existsSync(dbPath)) {
  console.log('❌ 데이터베이스 파일이 없습니다:', dbPath)
  process.exit(1)
}

// 데이터베이스 연결
const db = new Database(dbPath)

// 관리자 계정 정보
const adminUserId = 'admin'
const adminPassword = 'admin1234'

async function resetAdminPassword() {
  try {
    // 관리자 계정 찾기
    const stmt = db.prepare('SELECT * FROM users WHERE userId = ?')
    const admin = stmt.get(adminUserId)
    
    if (!admin) {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.')
      return
    }
    
    console.log('관리자 계정을 찾았습니다:')
    console.log('  이름:', admin.name)
    console.log('  아이디:', admin.userId)
    
    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    // 비밀번호 업데이트
    const updateStmt = db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
    updateStmt.run(hashedPassword, admin.id)
    
    console.log('\n✅ 관리자 비밀번호가 재설정되었습니다!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('아이디:', adminUserId)
    console.log('비밀번호:', adminPassword)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    throw error
  } finally {
    db.close()
  }
}

resetAdminPassword()

