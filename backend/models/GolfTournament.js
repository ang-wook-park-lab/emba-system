import db from '../database/db.js'

class GolfTournament {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.date = data.date
    this.location = data.location
    this.description = data.description
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // 골프대회 생성
  static create(tournamentData) {
    const stmt = db.prepare(`
      INSERT INTO golf_tournaments (name, date, location, description)
      VALUES (?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      tournamentData.name,
      tournamentData.date,
      tournamentData.location || null,
      tournamentData.description || null
    )
    
    return GolfTournament.findById(result.lastInsertRowid)
  }

  // ID로 골프대회 찾기
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM golf_tournaments WHERE id = ?')
    const row = stmt.get(id)
    return row ? new GolfTournament(row) : null
  }

  // 모든 골프대회 조회
  static findAll() {
    const stmt = db.prepare('SELECT * FROM golf_tournaments ORDER BY date DESC')
    const rows = stmt.all()
    return rows.map(row => new GolfTournament(row))
  }

  // 골프대회 업데이트
  static update(id, tournamentData) {
    const fields = []
    const values = []

    if (tournamentData.name !== undefined) { fields.push('name = ?'); values.push(tournamentData.name) }
    if (tournamentData.date !== undefined) { fields.push('date = ?'); values.push(tournamentData.date) }
    if (tournamentData.location !== undefined) { fields.push('location = ?'); values.push(tournamentData.location) }
    if (tournamentData.description !== undefined) { fields.push('description = ?'); values.push(tournamentData.description) }

    if (fields.length === 0) return GolfTournament.findById(id)

    fields.push('updatedAt = CURRENT_TIMESTAMP')
    const stmt = db.prepare(`UPDATE golf_tournaments SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values, id)
    return GolfTournament.findById(id)
  }

  // 골프대회 삭제
  static delete(id) {
    const stmt = db.prepare('DELETE FROM golf_tournaments WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // JSON 형태로 반환
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      date: this.date,
      location: this.location,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export default GolfTournament

