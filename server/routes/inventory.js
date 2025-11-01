import express from 'express'
import pool from '../config/db.js'

const router = express.Router()

// GET /api/inventory - 재고 현황 조회
router.get('/', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        id as menu_id,
        name as menu_name,
        stock
      FROM menus
      ORDER BY id ASC
    `
    const result = await pool.query(query)
    
    res.json({ inventory: result.rows })
  } catch (error) {
    next(error)
  }
})

export default router

