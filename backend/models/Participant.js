import db from '../database/db.js'

class Participant {
  static create(participantData) {
    const stmt = db.prepare(`
      INSERT INTO participants 
      (projectId, category, name, phone, grade, position, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    const info = stmt.run(
      participantData.projectId,
      participantData.category,
      participantData.name,
      participantData.phone || null,
      participantData.grade || null,
      participantData.position || null,
      participantData.notes || null
    )
    
    return this.findById(info.lastInsertRowid)
  }

  static findAll() {
    const stmt = db.prepare(`
      SELECT p.*, proj.name as projectName
      FROM participants p
      LEFT JOIN projects proj ON p.projectId = proj.id
      ORDER BY p.createdAt DESC
    `)
    return stmt.all()
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT p.*, proj.name as projectName
      FROM participants p
      LEFT JOIN projects proj ON p.projectId = proj.id
      WHERE p.id = ?
    `)
    return stmt.get(id)
  }

  static findByProjectId(projectId) {
    const stmt = db.prepare(`
      SELECT p.*, proj.name as projectName
      FROM participants p
      LEFT JOIN projects proj ON p.projectId = proj.id
      WHERE p.projectId = ?
      ORDER BY p.category, p.name
    `)
    return stmt.all(projectId)
  }

  static update(id, updateData) {
    const fields = []
    const values = []
    
    if (updateData.category !== undefined) {
      fields.push('category = ?')
      values.push(updateData.category)
    }
    if (updateData.name !== undefined) {
      fields.push('name = ?')
      values.push(updateData.name)
    }
    if (updateData.phone !== undefined) {
      fields.push('phone = ?')
      values.push(updateData.phone)
    }
    if (updateData.grade !== undefined) {
      fields.push('grade = ?')
      values.push(updateData.grade)
    }
    if (updateData.position !== undefined) {
      fields.push('position = ?')
      values.push(updateData.position)
    }
    if (updateData.notes !== undefined) {
      fields.push('notes = ?')
      values.push(updateData.notes)
    }
    
    fields.push('updatedAt = CURRENT_TIMESTAMP')
    values.push(id)
    
    const stmt = db.prepare(`
      UPDATE participants 
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    
    stmt.run(...values)
    return this.findById(id)
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM participants WHERE id = ?')
    const info = stmt.run(id)
    return info.changes > 0
  }

  static bulkCreate(participantsArray) {
    const insertStmt = db.prepare(`
      INSERT INTO participants 
      (projectId, category, name, phone, grade, position, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((participants) => {
      for (const p of participants) {
        insertStmt.run(
          p.projectId,
          p.category,
          p.name,
          p.phone || null,
          p.grade || null,
          p.position || null,
          p.notes || null
        )
      }
    })

    insertMany(participantsArray)
    return { success: true, count: participantsArray.length }
  }

  // 프로젝트별 카테고리 통계
  static getStatsByProjectId(projectId) {
    const stmt = db.prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM participants
      WHERE projectId = ?
      GROUP BY category
    `)
    
    const results = stmt.all(projectId)
    
    // 결과를 객체로 변환
    const stats = {
      professor: 0,
      vip: 0,
      external: 0,
      alumni: 0,
      student: 0,
      other: 0,
      total: 0
    }
    
    results.forEach(row => {
      stats[row.category] = row.count
      stats.total += row.count
    })
    
    return stats
  }
}

export default Participant

