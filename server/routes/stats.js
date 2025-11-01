import express from 'express'
import pool from '../config/db.js'

const router = express.Router()

// GET /api/orders/stats - 주문 통계 조회
router.get('/', async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE TRUE) as total_orders,
        COUNT(*) FILTER (WHERE status = 'received') as received_orders,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders
      FROM orders
    `
    const result = await pool.query(statsQuery)
    
    const stats = result.rows[0]
    
    res.json({
      total_orders: parseInt(stats.total_orders),
      received_orders: parseInt(stats.received_orders),
      in_progress_orders: parseInt(stats.in_progress_orders),
      completed_orders: parseInt(stats.completed_orders)
    })
  } catch (error) {
    next(error)
  }
})

export default router

