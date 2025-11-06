import db from '../database/db.js'

class Sponsorship {
  constructor(data) {
    this.id = data.id
    this.projectId = data.projectId
    this.type = data.type // '현금' 또는 '물품'
    this.sponsorName = data.sponsorName
    this.amount = data.amount
    this.itemName = data.itemName
    this.quantity = data.quantity
    this.date = data.date
    this.notes = data.notes
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // 후원 생성
  static async create(sponsorshipData) {
    const stmt = db.prepare(`
      INSERT INTO sponsorships (projectId, type, sponsorName, amount, itemName, quantity, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      sponsorshipData.projectId,
      sponsorshipData.type,
      sponsorshipData.sponsorName,
      sponsorshipData.amount || 0,
      sponsorshipData.itemName || null,
      sponsorshipData.quantity || null,
      sponsorshipData.date,
      sponsorshipData.notes || null
    )
    
    return Sponsorship.findById(result.lastInsertRowid)
  }

  // ID로 후원 조회
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM sponsorships WHERE id = ?')
    const row = stmt.get(id)
    return row ? new Sponsorship(row) : null
  }

  // 프로젝트 ID로 모든 후원 조회
  static findByProjectId(projectId) {
    const stmt = db.prepare('SELECT * FROM sponsorships WHERE projectId = ? ORDER BY date DESC, createdAt DESC')
    return stmt.all(projectId).map(row => new Sponsorship(row))
  }

  // 모든 후원 조회
  static findAll() {
    const stmt = db.prepare('SELECT * FROM sponsorships ORDER BY date DESC, createdAt DESC')
    return stmt.all().map(row => new Sponsorship(row))
  }

  // 프로젝트별 후원 총액 계산
  static getTotalAmountByProjectId(projectId) {
    const stmt = db.prepare('SELECT SUM(amount) as total FROM sponsorships WHERE projectId = ?')
    const result = stmt.get(projectId)
    return result.total || 0
  }

  // 프로젝트별 후원 통계 (현금/물품 개수)
  static getStatsByProjectId(projectId) {
    const stmt = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM sponsorships 
      WHERE projectId = ? 
      GROUP BY type
    `)
    const results = stmt.all(projectId)
    
    const stats = {
      cash: { count: 0, amount: 0 },
      item: { count: 0, amount: 0 },
      total: 0
    }
    
    results.forEach(row => {
      if (row.type === '현금') {
        stats.cash.count = row.count
        stats.cash.amount = row.totalAmount || 0
      } else if (row.type === '물품') {
        stats.item.count = row.count
        stats.item.amount = row.totalAmount || 0
      }
      stats.total += row.totalAmount || 0
    })
    
    return stats
  }

  // 후원 수정
  static async update(id, updateData) {
    const fields = []
    const values = []
    
    if (updateData.type !== undefined) {
      fields.push('type = ?')
      values.push(updateData.type)
    }
    if (updateData.sponsorName !== undefined) {
      fields.push('sponsorName = ?')
      values.push(updateData.sponsorName)
    }
    if (updateData.amount !== undefined) {
      fields.push('amount = ?')
      values.push(updateData.amount)
    }
    if (updateData.itemName !== undefined) {
      fields.push('itemName = ?')
      values.push(updateData.itemName)
    }
    if (updateData.quantity !== undefined) {
      fields.push('quantity = ?')
      values.push(updateData.quantity)
    }
    if (updateData.date !== undefined) {
      fields.push('date = ?')
      values.push(updateData.date)
    }
    if (updateData.notes !== undefined) {
      fields.push('notes = ?')
      values.push(updateData.notes)
    }
    
    fields.push('updatedAt = CURRENT_TIMESTAMP')
    values.push(id)
    
    const stmt = db.prepare(`
      UPDATE sponsorships 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `)
    
    stmt.run(...values)
    return Sponsorship.findById(id)
  }

  // 후원 삭제
  static delete(id) {
    const stmt = db.prepare('DELETE FROM sponsorships WHERE id = ?')
    return stmt.run(id)
  }

  // 후원 일괄 생성
  static bulkCreate(sponsorshipsArray) {
    const insertStmt = db.prepare(`
      INSERT INTO sponsorships (projectId, type, sponsorName, amount, itemName, quantity, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((sponsorships) => {
      for (const s of sponsorships) {
        insertStmt.run(
          s.projectId,
          s.type,
          s.sponsorName,
          s.amount || 0,
          s.itemName || null,
          s.quantity || null,
          s.date || new Date().toISOString().split('T')[0],
          s.notes || null
        )
      }
    })

    insertMany(sponsorshipsArray)
    return { success: true, count: sponsorshipsArray.length }
  }

  // JSON 변환
  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      type: this.type,
      sponsorName: this.sponsorName,
      amount: this.amount,
      itemName: this.itemName,
      quantity: this.quantity,
      date: this.date,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export default Sponsorship

