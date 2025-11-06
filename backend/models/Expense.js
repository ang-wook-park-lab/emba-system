import db from '../database/db.js'

class Expense {
  constructor(data) {
    this.id = data.id
    this.projectId = data.projectId
    this.requesterId = data.requesterId
    this.category = data.category
    this.amount = data.amount
    this.currency = data.currency || 'KRW'
    this.description = data.description
    this.status = data.status || '대기중'
    this.receiptFilename = data.receiptFilename
    this.receiptPath = data.receiptPath
    this.receiptMimetype = data.receiptMimetype
    this.bankName = data.bankName
    this.accountNumber = data.accountNumber
    this.accountHolder = data.accountHolder
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // 지출 생성
  static async create(expenseData) {
    const stmt = db.prepare(`
      INSERT INTO expenses (projectId, requesterId, category, amount, currency, description, status, receiptFilename, receiptPath, receiptMimetype, bankName, accountNumber, accountHolder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      expenseData.projectId,
      expenseData.requesterId,
      expenseData.category,
      expenseData.amount,
      expenseData.currency || 'KRW',
      expenseData.description,
      expenseData.status || '대기중',
      expenseData.receiptFilename || null,
      expenseData.receiptPath || null,
      expenseData.receiptMimetype || null,
      expenseData.bankName || null,
      expenseData.accountNumber || null,
      expenseData.accountHolder || null
    )
    return Expense.findById(result.lastInsertRowid)
  }

  // ID로 지출 찾기
  static findById(id) {
    const stmt = db.prepare(`
      SELECT 
        e.*,
        p.name as projectName,
        u.name as requesterName,
        u.email as requesterEmail
      FROM expenses e
      LEFT JOIN projects p ON e.projectId = p.id
      LEFT JOIN users u ON e.requesterId = u.id
      WHERE e.id = ?
    `)
    const row = stmt.get(id)
    return row ? new Expense(row) : null
  }

  // 모든 지출 조회
  static findAll(filters = {}) {
    let query = `
      SELECT 
        e.*,
        p.name as projectName,
        u.name as requesterName,
        u.email as requesterEmail
      FROM expenses e
      LEFT JOIN projects p ON e.projectId = p.id
      LEFT JOIN users u ON e.requesterId = u.id
      WHERE 1=1
    `
    const params = []

    if (filters.projectId) {
      query += ' AND e.projectId = ?'
      params.push(filters.projectId)
    }

    if (filters.status) {
      query += ' AND e.status = ?'
      params.push(filters.status)
    }

    if (filters.requesterId) {
      query += ' AND e.requesterId = ?'
      params.push(filters.requesterId)
    }

    query += ' ORDER BY e.createdAt DESC'

    const stmt = db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(row => new Expense(row))
  }

  // 승인자의 대기 중인 지출 조회
  static findPendingByApprover(approverId) {
    const stmt = db.prepare(`
      SELECT DISTINCT
        e.*,
        p.name as projectName,
        u.name as requesterName,
        u.email as requesterEmail
      FROM expenses e
      INNER JOIN approvals a ON e.id = a.expenseId
      LEFT JOIN projects p ON e.projectId = p.id
      LEFT JOIN users u ON e.requesterId = u.id
      WHERE a.approverId = ? AND a.status = '대기중'
      ORDER BY e.createdAt DESC
    `)
    const rows = stmt.all(approverId)
    return rows.map(row => new Expense(row))
  }

  // 지출 업데이트
  static async update(id, updateData) {
    const fields = []
    const values = []

    if (updateData.category !== undefined) { fields.push('category = ?'); values.push(updateData.category) }
    if (updateData.amount !== undefined) { fields.push('amount = ?'); values.push(updateData.amount) }
    if (updateData.currency !== undefined) { fields.push('currency = ?'); values.push(updateData.currency) }
    if (updateData.description !== undefined) { fields.push('description = ?'); values.push(updateData.description) }
    if (updateData.status !== undefined) { fields.push('status = ?'); values.push(updateData.status) }
    if (updateData.receiptFilename !== undefined) { fields.push('receiptFilename = ?'); values.push(updateData.receiptFilename) }
    if (updateData.receiptPath !== undefined) { fields.push('receiptPath = ?'); values.push(updateData.receiptPath) }
    if (updateData.receiptMimetype !== undefined) { fields.push('receiptMimetype = ?'); values.push(updateData.receiptMimetype) }

    if (fields.length === 0) return Expense.findById(id)

    fields.push('updatedAt = CURRENT_TIMESTAMP')
    const stmt = db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values, id)
    return Expense.findById(id)
  }

  // 지출 삭제
  static delete(id) {
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?')
    stmt.run(id)
  }

  // JSON 형태로 반환
  toJSON() {
    return { ...this }
  }
}

export default Expense
