import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const user = User.findById(decoded.id)

    if (!user || user.isActive !== 1) {
      return res.status(401).json({ message: '유효하지 않은 사용자입니다.' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' })
  }
}

export const requireApprover = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'approver') {
    return res.status(403).json({ message: '승인자 권한이 필요합니다.' })
  }
  next()
}

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' })
  }
  next()
}

