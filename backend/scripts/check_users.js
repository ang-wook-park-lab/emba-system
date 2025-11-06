import Database from 'better-sqlite3'
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

try {
  // 모든 사용자 조회
  const stmt = db.prepare('SELECT id, name, userId, email, phone, role, isActive FROM users')
  const users = stmt.all()
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 등록된 사용자 목록')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (users.length === 0) {
    console.log('등록된 사용자가 없습니다.')
  } else {
    users.forEach((user, index) => {
      console.log(`\n[${index + 1}]`)
      console.log('  ID:', user.id)
      console.log('  이름:', user.name)
      console.log('  아이디:', user.userId || '(없음)')
      console.log('  이메일:', user.email || '(없음)')
      console.log('  전화번호:', user.phone || '(없음)')
      console.log('  권한:', user.role)
      console.log('  활성화:', user.isActive === 1 ? '예' : '아니오')
    })
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
} catch (error) {
  console.error('❌ 오류 발생:', error.message)
} finally {
  db.close()
}

