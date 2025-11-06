import db from '../database/db.js'
import bcrypt from 'bcryptjs'

class User {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.userId = data.userId
    this.email = data.email
    this.phone = data.phone
    this.password = data.password
    this.role = data.role || 'user'
    this.department = data.department
    this.position = data.position
    this.isActive = data.isActive !== undefined ? data.isActive : 1
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // 사용자 생성
  static async create(userData) {
    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    
    const stmt = db.prepare(`
      INSERT INTO users (name, userId, email, phone, password, role, department, position, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      userData.name.trim(),
      userData.userId ? userData.userId.trim() : null,
      userData.email ? userData.email.toLowerCase().trim() : null,
      userData.phone || null,
      hashedPassword,
      userData.role || 'user',
      userData.department || null,
      userData.position || null,
      userData.isActive !== undefined ? (userData.isActive ? 1 : 0) : 1
    )
    
    return User.findById(result.lastInsertRowid)
  }

  // ID로 사용자 찾기
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const row = stmt.get(id)
    return row ? new User(row) : null
  }

  // 이메일로 사용자 찾기
  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
    const row = stmt.get(email.toLowerCase().trim())
    return row ? new User(row) : null
  }

  // 핸드폰 번호로 사용자 찾기
  static findByPhone(phone) {
    const stmt = db.prepare('SELECT * FROM users WHERE phone = ?')
    const row = stmt.get(phone)
    return row ? new User(row) : null
  }

  // 아이디로 사용자 찾기
  static findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE userId = ? AND isActive = 1')
    const row = stmt.get(userId.trim())
    return row ? new User(row) : null
  }

  // 이름으로 사용자 찾기
  static findByName(name) {
    const stmt = db.prepare('SELECT * FROM users WHERE name = ? AND isActive = 1')
    const row = stmt.get(name.trim())
    return row ? new User(row) : null
  }

  // 직책으로 사용자 찾기
  static findByPosition(position) {
    const stmt = db.prepare('SELECT * FROM users WHERE position = ? AND isActive = 1 LIMIT 1')
    const row = stmt.get(position.trim())
    return row ? new User(row) : null
  }

  // 모든 활성 사용자 찾기
  static findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE isActive = 1'
    const params = []
    
    if (filters.role) {
      query += ' AND role = ?'
      params.push(filters.role)
    }
    
    if (filters.position) {
      query += ' AND position = ?'
      params.push(filters.position)
    }
    
    query += ' ORDER BY createdAt DESC'
    
    const stmt = db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(row => new User(row))
  }

  // 사용자 업데이트
  static update(id, updates) {
    const allowedUpdates = ['name', 'userId', 'email', 'phone', 'role', 'department', 'position', 'isActive']
    const updateFields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (updateFields.length === 0) return false
    
    values.push(id)
    const stmt = db.prepare(`UPDATE users SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
    stmt.run(...values)
    
    return User.findById(id)
  }

  // 비밀번호 확인
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
  }

  // 사용자 정보를 JSON으로 변환 (비밀번호 제외)
  toJSON() {
    return {
      id: this.id.toString(),
      name: this.name,
      userId: this.userId,
      email: this.email,
      phone: this.phone,
      role: this.role,
      department: this.department,
      position: this.position,
      isActive: this.isActive === 1,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export default User
