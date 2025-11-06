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

async function testLogin() {
  try {
    const identifier = 'admin'
    const password = 'admin1234'
    
    console.log('테스트 로그인:')
    console.log('  아이디:', identifier)
    console.log('  비밀번호:', password)
    console.log('')
    
    // userId로 찾기
    let stmt = db.prepare('SELECT * FROM users WHERE userId = ? AND isActive = 1')
    let user = stmt.get(identifier.trim())
    
    console.log('userId로 검색 결과:', user ? '찾음' : '없음')
    
    // userId로 찾지 못한 경우 이름으로 검색
    if (!user) {
      stmt = db.prepare('SELECT * FROM users WHERE name = ? AND isActive = 1')
      user = stmt.get(identifier.trim())
      console.log('이름으로 검색 결과:', user ? '찾음' : '없음')
    }
    
    if (!user) {
      console.log('❌ 사용자를 찾을 수 없습니다.')
      return
    }
    
    console.log('\n사용자 정보:')
    console.log('  ID:', user.id)
    console.log('  이름:', user.name)
    console.log('  userId:', user.userId || '(없음)')
    console.log('  권한:', user.role)
    console.log('  활성화:', user.isActive === 1 ? '예' : '아니오')
    console.log('  비밀번호 해시:', user.password.substring(0, 20) + '...')
    
    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password)
    console.log('\n비밀번호 확인 결과:', isMatch ? '✅ 일치' : '❌ 불일치')
    
    if (!isMatch) {
      console.log('\n비밀번호가 일치하지 않습니다.')
      console.log('새로운 비밀번호 해시 생성 중...')
      const newHash = await bcrypt.hash(password, 10)
      console.log('새 해시:', newHash.substring(0, 50) + '...')
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    console.error(error.stack)
  } finally {
    db.close()
  }
}

testLogin()

