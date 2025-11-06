import db from '../database/db.js'

class Approval {
  constructor(data) {
    this.id = data.id
    this.expenseId = data.expenseId
    this.approverId = data.approverId
    this.status = data.status || '대기중'
    this.comment = data.comment
    this.approvedAt = data.approvedAt
    this.createdAt = data.createdAt
  }

  // 승인 생성
  static async create(approvalData) {
    const stmt = db.prepare(`
      INSERT INTO approvals (expenseId, approverId, status, comment)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(
      approvalData.expenseId,
      approvalData.approverId,
      approvalData.status || '대기중',
      approvalData.comment || null
    )
    return Approval.findById(result.lastInsertRowid)
  }

  // ID로 승인 찾기
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM approvals WHERE id = ?')
    const row = stmt.get(id)
    return row ? new Approval(row) : null
  }

  // 지출에 대한 모든 승인 조회
  static findByExpenseId(expenseId) {
    const stmt = db.prepare(`
      SELECT 
        a.*,
        u.name as approverName,
        u.email as approverEmail
      FROM approvals a
      LEFT JOIN users u ON a.approverId = u.id
      WHERE a.expenseId = ?
      ORDER BY a.createdAt ASC
    `)
    const rows = stmt.all(expenseId)
    return rows.map(row => new Approval(row))
  }

  // 승인자의 모든 승인 조회
  static findByApproverId(approverId, status = null) {
    let query = `
      SELECT 
        a.*,
        e.description as expenseDescription,
        e.amount as expenseAmount,
        p.name as projectName,
        u.name as requesterName
      FROM approvals a
      LEFT JOIN expenses e ON a.expenseId = e.id
      LEFT JOIN projects p ON e.projectId = p.id
      LEFT JOIN users u ON e.requesterId = u.id
      WHERE a.approverId = ?
    `
    const params = [approverId]

    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }

    query += ' ORDER BY a.createdAt DESC'

    const stmt = db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(row => new Approval(row))
  }

  // 승인 업데이트
  static async update(id, updateData) {
    const fields = []
    const values = []

    if (updateData.status !== undefined) { 
      fields.push('status = ?')
      values.push(updateData.status)
      if (updateData.status === '승인') {
        fields.push('approvedAt = CURRENT_TIMESTAMP')
      }
    }
    if (updateData.comment !== undefined) { fields.push('comment = ?'); values.push(updateData.comment) }

    if (fields.length === 0) return Approval.findById(id)

    const stmt = db.prepare(`UPDATE approvals SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values, id)
    return Approval.findById(id)
  }

  // 승인 삭제
  static delete(id) {
    const stmt = db.prepare('DELETE FROM approvals WHERE id = ?')
    stmt.run(id)
  }

  // JSON 형태로 반환
  toJSON() {
    return { ...this }
  }
}

export default Approval

