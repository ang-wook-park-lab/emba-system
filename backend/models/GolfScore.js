import db from '../database/db.js'

class GolfScore {
  constructor(data) {
    this.id = data.id
    this.tournamentId = data.tournamentId
    this.participantName = data.participantName
    this.score = data.score
    this.handicap = data.handicap || 0
    this.notes = data.notes
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // 골프 스코어 생성
  static create(scoreData) {
    const stmt = db.prepare(`
      INSERT INTO golf_scores (tournamentId, participantName, score, handicap, notes)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      scoreData.tournamentId,
      scoreData.participantName,
      scoreData.score,
      scoreData.handicap || 0,
      scoreData.notes || null
    )
    
    return GolfScore.findById(result.lastInsertRowid)
  }

  // ID로 스코어 찾기
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM golf_scores WHERE id = ?')
    const row = stmt.get(id)
    return row ? new GolfScore(row) : null
  }

  // 대회별 스코어 조회
  static findByTournament(tournamentId) {
    const stmt = db.prepare('SELECT * FROM golf_scores WHERE tournamentId = ? ORDER BY score ASC')
    const rows = stmt.all(tournamentId)
    return rows.map(row => new GolfScore(row))
  }

  // 참석자별 스코어 조회
  static findByParticipant(participantName) {
    const stmt = db.prepare('SELECT * FROM golf_scores WHERE participantName = ? ORDER BY createdAt DESC')
    const rows = stmt.all(participantName)
    return rows.map(row => new GolfScore(row))
  }

  // 참석자별 스코어를 날짜와 함께 조회 (대회 정보 포함)
  static findByParticipantWithTournament(participantName) {
    const stmt = db.prepare(`
      SELECT 
        gs.id,
        gs.tournamentId,
        gs.participantName,
        gs.score,
        gs.handicap,
        gs.notes,
        gs.createdAt,
        gs.updatedAt,
        gt.date as tournamentDate,
        gt.name as tournamentName
      FROM golf_scores gs
      JOIN golf_tournaments gt ON gs.tournamentId = gt.id
      WHERE gs.participantName = ?
      ORDER BY gt.date ASC
    `)
    const rows = stmt.all(participantName)
    return rows.map(row => ({
      id: row.id,
      tournamentId: row.tournamentId,
      participantName: row.participantName,
      score: row.score,
      handicap: row.handicap,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tournamentDate: row.tournamentDate,
      tournamentName: row.tournamentName
    }))
  }

  // 모든 스코어 조회
  static findAll() {
    const stmt = db.prepare('SELECT * FROM golf_scores ORDER BY createdAt DESC')
    const rows = stmt.all()
    return rows.map(row => new GolfScore(row))
  }

  // 스코어 업데이트
  static update(id, scoreData) {
    const fields = []
    const values = []

    if (scoreData.participantName !== undefined) { fields.push('participantName = ?'); values.push(scoreData.participantName) }
    if (scoreData.score !== undefined) { fields.push('score = ?'); values.push(scoreData.score) }
    if (scoreData.handicap !== undefined) { fields.push('handicap = ?'); values.push(scoreData.handicap) }
    if (scoreData.notes !== undefined) { fields.push('notes = ?'); values.push(scoreData.notes) }

    if (fields.length === 0) return GolfScore.findById(id)

    fields.push('updatedAt = CURRENT_TIMESTAMP')
    const stmt = db.prepare(`UPDATE golf_scores SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values, id)
    return GolfScore.findById(id)
  }

  // 스코어 삭제
  static delete(id) {
    const stmt = db.prepare('DELETE FROM golf_scores WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // 참석자별 평균 스코어 계산
  static getAverageScoreByParticipant(participantName) {
    const stmt = db.prepare(`
      SELECT AVG(score) as averageScore, COUNT(*) as tournamentCount
      FROM golf_scores
      WHERE participantName = ?
    `)
    const result = stmt.get(participantName)
    return result ? {
      averageScore: Math.round(result.averageScore * 10) / 10,
      tournamentCount: result.tournamentCount
    } : null
  }

  // 참석자별 평균 스코어 계산 (특정 대회 제외)
  static getAverageScoreByParticipantExcludingTournament(participantName, excludeTournamentId) {
    const stmt = db.prepare(`
      SELECT AVG(score) as averageScore, COUNT(*) as tournamentCount
      FROM golf_scores
      WHERE participantName = ? AND tournamentId != ?
    `)
    const result = stmt.get(participantName, excludeTournamentId)
    return result && result.tournamentCount > 0 ? {
      averageScore: Math.round(result.averageScore * 10) / 10,
      tournamentCount: result.tournamentCount
    } : null
  }

  // 모든 참석자별 평균 스코어 조회
  static getAllParticipantAverages() {
    const stmt = db.prepare(`
      SELECT 
        participantName,
        AVG(score) as averageScore,
        COUNT(*) as tournamentCount,
        MIN(score) as bestScore,
        MAX(score) as worstScore
      FROM golf_scores
      GROUP BY participantName
      ORDER BY averageScore ASC
    `)
    const rows = stmt.all()
    return rows.map(row => ({
      participantName: row.participantName,
      averageScore: Math.round(row.averageScore * 10) / 10,
      tournamentCount: row.tournamentCount,
      bestScore: row.bestScore,
      worstScore: row.worstScore
    }))
  }

  // JSON 형태로 반환
  toJSON() {
    return {
      id: this.id,
      tournamentId: this.tournamentId,
      participantName: this.participantName,
      score: this.score,
      handicap: this.handicap,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export default GolfScore

