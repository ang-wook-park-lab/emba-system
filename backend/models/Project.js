import db from '../database/db.js'

class Project {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.budget = data.budget
    this.spent = data.spent || 0
    this.status = data.status || '진행중'
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.participants = data.participants
    this.approvers = data.approvers
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // 프로젝트 생성
  static create(projectData) {
    const stmt = db.prepare(`
      INSERT INTO projects (name, budget, spent, status, startDate, endDate, participants, approvers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      projectData.name,
      projectData.budget,
      projectData.spent || 0,
      projectData.status || '진행중',
      projectData.startDate,
      projectData.endDate || null,
      projectData.participants || null,
      projectData.approvers || null
    )
    
    return Project.findById(result.lastInsertRowid)
  }

  // ID로 프로젝트 찾기
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?')
    const row = stmt.get(id)
    return row ? new Project(row) : null
  }

  // 모든 프로젝트 조회
  static findAll() {
    const stmt = db.prepare('SELECT * FROM projects ORDER BY createdAt DESC')
    const rows = stmt.all()
    return rows.map(row => new Project(row))
  }

  // 프로젝트 업데이트
  static update(id, projectData) {
    const fields = []
    const values = []

    if (projectData.name !== undefined) { fields.push('name = ?'); values.push(projectData.name) }
    if (projectData.budget !== undefined) { fields.push('budget = ?'); values.push(projectData.budget) }
    if (projectData.spent !== undefined) { fields.push('spent = ?'); values.push(projectData.spent) }
    if (projectData.status !== undefined) { fields.push('status = ?'); values.push(projectData.status) }
    if (projectData.startDate !== undefined) { fields.push('startDate = ?'); values.push(projectData.startDate) }
    if (projectData.endDate !== undefined) { fields.push('endDate = ?'); values.push(projectData.endDate) }
    if (projectData.participants !== undefined) { fields.push('participants = ?'); values.push(projectData.participants) }
    if (projectData.approvers !== undefined) { fields.push('approvers = ?'); values.push(projectData.approvers) }

    if (fields.length === 0) return Project.findById(id) // No fields to update

    fields.push('updatedAt = CURRENT_TIMESTAMP')
    const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values, id)
    return Project.findById(id)
  }

  // 프로젝트 삭제
  static delete(id) {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // JSON 형태로 반환
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      budget: this.budget,
      spent: this.spent,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      participants: this.participants ? this.participants.split(',').map(p => p.trim()) : [],
      approvers: this.approvers ? this.approvers.split(',').map(a => a.trim()) : [],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export default Project
