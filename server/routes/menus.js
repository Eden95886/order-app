import express from 'express'
import pool from '../config/db.js'

const router = express.Router()

// GET /api/menus - 메뉴 목록 조회
router.get('/', async (req, res, next) => {
  try {
    const includeStock = req.query.include_stock === 'true'
    
    // 메뉴 목록 조회
    const menusQuery = `
      SELECT 
        id, 
        name, 
        description, 
        price, 
        image_url as "imageUrl"
        ${includeStock ? ', stock' : ''}
      FROM menus
      ORDER BY id ASC
    `
    const menusResult = await pool.query(menusQuery)
    
    // 각 메뉴의 옵션 조회
    const menus = await Promise.all(
      menusResult.rows.map(async (menu) => {
        const optionsQuery = `
          SELECT id, name, price
          FROM options
          WHERE menu_id = $1
          ORDER BY id ASC
        `
        const optionsResult = await pool.query(optionsQuery, [menu.id])
        
        return {
          ...menu,
          options: optionsResult.rows
        }
      })
    )
    
    res.json({ menus })
  } catch (error) {
    next(error)
  }
})

// GET /api/menus/:menuId - 특정 메뉴 상세 조회
router.get('/:menuId', async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId)
    
    if (isNaN(menuId)) {
      return res.status(400).json({ 
        error: { message: '유효하지 않은 메뉴 ID입니다.' } 
      })
    }
    
    const menuQuery = `
      SELECT id, name, description, price, image_url as "imageUrl", stock
      FROM menus
      WHERE id = $1
    `
    const menuResult = await pool.query(menuQuery, [menuId])
    
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: '메뉴를 찾을 수 없습니다.' } 
      })
    }
    
    const menu = menuResult.rows[0]
    
    // 옵션 조회
    const optionsQuery = `
      SELECT id, name, price
      FROM options
      WHERE menu_id = $1
      ORDER BY id ASC
    `
    const optionsResult = await pool.query(optionsQuery, [menuId])
    
    menu.options = optionsResult.rows
    
    res.json(menu)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/menus/:menuId/stock - 재고 수량 변경
router.patch('/:menuId/stock', async (req, res, next) => {
  try {
    const menuId = parseInt(req.params.menuId)
    const { change } = req.body
    
    if (isNaN(menuId)) {
      return res.status(400).json({ 
        error: { message: '유효하지 않은 메뉴 ID입니다.' } 
      })
    }
    
    if (change === undefined || typeof change !== 'number') {
      return res.status(400).json({ 
        error: { message: '변경할 재고 수량(change)이 필요합니다.' } 
      })
    }
    
    // 현재 재고 확인
    const currentResult = await pool.query(
      'SELECT stock FROM menus WHERE id = $1',
      [menuId]
    )
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: '메뉴를 찾을 수 없습니다.' } 
      })
    }
    
    const currentStock = currentResult.rows[0].stock
    const newStock = Math.max(0, currentStock + change)
    
    // 재고가 0인데 감소 시도하는 경우
    if (currentStock === 0 && change < 0) {
      return res.status(400).json({ 
        error: { message: '재고가 0개인 메뉴는 더 이상 감소할 수 없습니다.' } 
      })
    }
    
    // 재고 업데이트
    const updateResult = await pool.query(
      `UPDATE menus 
       SET stock = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING id, name, stock`,
      [newStock, menuId]
    )
    
    res.json({
      menu_id: updateResult.rows[0].id,
      menu_name: updateResult.rows[0].name,
      stock: updateResult.rows[0].stock
    })
  } catch (error) {
    next(error)
  }
})

export default router

