import Database from 'better-sqlite3'
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

// SQLite 데이터베이스 연결
const db = new Database(dbPath)

// 외래 키 제약 조건 활성화
db.pragma('foreign_keys = ON')

// 데이터베이스 초기화 (테이블 생성)
export function initializeDatabase() {
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
    // 컬럼 존재 여부 확인
    const tableInfo = db.prepare("PRAGMA table_info(users)").all()
    const hasUserIdColumn = tableInfo.some(col => col.name === 'userId')
    
    if (!hasUserIdColumn) {
      db.exec(`ALTER TABLE users ADD COLUMN userId TEXT`)
      // UNIQUE 제약 조건은 별도로 추가해야 함 (ALTER TABLE로는 제약 조건 추가 불가)
      console.log('✅ userId 컬럼이 추가되었습니다.')
    }
  } catch (error) {
    // 컬럼이 이미 존재하거나 다른 오류가 발생하면 무시
    console.log('⚠️ userId 컬럼 마이그레이션:', error.message)
  }

  // email 컬럼이 NOT NULL인 경우 NULL 허용으로 마이그레이션
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all()
    const emailColumn = tableInfo.find(col => col.name === 'email')
    
    if (emailColumn && emailColumn.notnull === 1) {
      // SQLite에서는 NOT NULL 제약을 직접 제거할 수 없으므로
      // 테이블을 재생성해야 합니다.
      console.log('⚠️ email 컬럼이 NOT NULL로 설정되어 있습니다. 마이그레이션을 진행합니다...')
      
      // 외래 키 제약 조건 일시 비활성화
      db.pragma('foreign_keys = OFF')
      
      try {
        // 1. 새 테이블 생성 (email NULL 허용)
        db.exec(`
          CREATE TABLE users_new (
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
        
        // 2. 기존 데이터 복사 (email이 null이거나 빈 문자열인 경우 NULL로 변환)
        db.exec(`
          INSERT INTO users_new (id, name, userId, email, phone, password, role, department, position, isActive, createdAt, updatedAt)
          SELECT id, name, userId, 
                 CASE WHEN email = '' OR email IS NULL THEN NULL ELSE email END,
                 phone, password, role, department, position, isActive, createdAt, updatedAt
          FROM users
        `)
        
        // 3. 기존 테이블 삭제
        db.exec(`DROP TABLE users`)
        
        // 4. 새 테이블 이름 변경
        db.exec(`ALTER TABLE users_new RENAME TO users`)
        
        console.log('✅ email 컬럼 마이그레이션 완료 (NULL 허용)')
      } finally {
        // 외래 키 제약 조건 다시 활성화
        db.pragma('foreign_keys = ON')
      }
    }
  } catch (error) {
    // 마이그레이션이 이미 완료되었거나 다른 오류가 발생하면 무시
    if (error.message && !error.message.includes('no such table')) {
      console.log('⚠️ email 컬럼 마이그레이션:', error.message)
    }
    // 외래 키 제약 조건 다시 활성화 (에러 발생 시에도)
    db.pragma('foreign_keys = ON')
  }

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
    CREATE INDEX IF NOT EXISTS idx_users_userId ON users(userId);
  `)

  // Projects 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      budget REAL NOT NULL,
      spent REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '진행중' CHECK(status IN ('진행중', '완료', '대기')),
      startDate TEXT NOT NULL,
      endDate TEXT,
      participants TEXT,
      approvers TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Expenses 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      requesterId INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KRW',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '대기중' CHECK(status IN ('대기중', '승인중', '승인완료', '반려')),
      receiptFilename TEXT,
      receiptPath TEXT,
      receiptMimetype TEXT,
      bankName TEXT,
      accountNumber TEXT,
      accountHolder TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Approvals 테이블 생성 (지출 승인 기록)
  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expenseId INTEGER NOT NULL,
      approverId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT '대기중' CHECK(status IN ('대기중', '승인', '반려')),
      comment TEXT,
      approvedAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY (approverId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Sponsorships 테이블 생성 (후원 내역)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sponsorships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('현금', '물품')),
      sponsorName TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      itemName TEXT,
      quantity INTEGER,
      date TEXT NOT NULL,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)

  // Participants 테이블 생성 (참석자 관리)
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('professor', 'vip', 'external', 'alumni', 'student', 'other')),
      name TEXT NOT NULL,
      phone TEXT,
      grade TEXT,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)
  
  // grade 컬럼이 없는 경우 추가 (기존 테이블 마이그레이션)
  try {
    db.exec(`ALTER TABLE participants ADD COLUMN grade TEXT`)
  } catch (error) {
    // 컬럼이 이미 존재하면 무시
  }
  
  // 불필요한 컬럼 제거는 SQLite에서 직접 불가능하므로 무시
  // (email, organization, position 컬럼은 사용하지 않지만 남겨둠)

  // Golf Tournaments 테이블 생성 (골프대회)
  db.exec(`
    CREATE TABLE IF NOT EXISTS golf_tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      description TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Golf Scores 테이블 생성 (골프 스코어)
  db.exec(`
    CREATE TABLE IF NOT EXISTS golf_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournamentId INTEGER NOT NULL,
      participantName TEXT NOT NULL,
      score INTEGER NOT NULL,
      handicap INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournamentId) REFERENCES golf_tournaments(id) ON DELETE CASCADE
    )
  `)

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(projectId);
    CREATE INDEX IF NOT EXISTS idx_expenses_requester ON expenses(requesterId);
    CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
    CREATE INDEX IF NOT EXISTS idx_approvals_expense ON approvals(expenseId);
    CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approverId);
    CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
    CREATE INDEX IF NOT EXISTS idx_sponsorships_project ON sponsorships(projectId);
    CREATE INDEX IF NOT EXISTS idx_sponsorships_type ON sponsorships(type);
    CREATE INDEX IF NOT EXISTS idx_participants_project ON participants(projectId);
    CREATE INDEX IF NOT EXISTS idx_participants_category ON participants(category);
    CREATE INDEX IF NOT EXISTS idx_golf_tournaments_date ON golf_tournaments(date);
    CREATE INDEX IF NOT EXISTS idx_golf_scores_tournament ON golf_scores(tournamentId);
    CREATE INDEX IF NOT EXISTS idx_golf_scores_participant ON golf_scores(participantName);
  `)

  console.log('✅ SQLite 데이터베이스 초기화 완료')
  console.log('데이터베이스 파일:', dbPath)
}

export default db

