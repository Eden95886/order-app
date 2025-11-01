import express from 'express'
import pool from '../config/db.js'

const router = express.Router()

// POST /api/orders - 주문 생성
router.post('/', async (req, res, next) => {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const { items, total_price } = req.body
    
    // 입력 검증
    if (!items || !Array.isArray(items) || items.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        error: { message: '주문 아이템이 필요합니다.' } 
      })
    }
    
    if (!total_price || total_price < 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        error: { message: '유효한 총 금액이 필요합니다.' } 
      })
    }
    
    // 재고 확인 및 주문 생성
    for (const item of items) {
      const menuCheck = await client.query(
        'SELECT stock FROM menus WHERE id = $1',
        [item.menu_id]
      )
      
      if (menuCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ 
          error: { message: `메뉴 ID ${item.menu_id}를 찾을 수 없습니다.` } 
        })
      }
      
      const currentStock = menuCheck.rows[0].stock
      if (currentStock < item.quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({ 
          error: { message: `메뉴 ID ${item.menu_id}의 재고가 부족합니다.` } 
        })
      }
    }
    
    // Orders 테이블에 주문 생성
    const orderResult = await client.query(
      `INSERT INTO orders (order_date, status, total_price)
       VALUES (CURRENT_TIMESTAMP, 'received', $1)
       RETURNING id, order_date, status, total_price`,
      [total_price]
    )
    
    const order = orderResult.rows[0]
    const orderId = order.id
    
    // 각 아이템 처리
    const orderItems = []
    for (const item of items) {
      // OrderItems 테이블에 아이템 추가
      const orderItemResult = await client.query(
        `INSERT INTO order_items (order_id, menu_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, menu_id, quantity, unit_price`,
        [orderId, item.menu_id, item.quantity, item.unit_price]
      )
      
      const orderItem = orderItemResult.rows[0]
      const orderItemId = orderItem.id
      
      // 메뉴 정보 조회
      const menuResult = await client.query(
        'SELECT name FROM menus WHERE id = $1',
        [item.menu_id]
      )
      orderItem.menu_name = menuResult.rows[0].name
      
      // 재고 차감
      await client.query(
        'UPDATE menus SET stock = GREATEST(0, stock - $1) WHERE id = $2',
        [item.quantity, item.menu_id]
      )
      
      // 옵션 처리
      if (item.option_ids && item.option_ids.length > 0) {
        const options = []
        for (const optionId of item.option_ids) {
          await client.query(
            'INSERT INTO order_item_options (order_item_id, option_id) VALUES ($1, $2)',
            [orderItemId, optionId]
          )
          
          // 옵션 정보 조회
          const optionResult = await client.query(
            'SELECT id, name FROM options WHERE id = $1',
            [optionId]
          )
          if (optionResult.rows.length > 0) {
            options.push(optionResult.rows[0])
          }
        }
        orderItem.options = options
      } else {
        orderItem.options = []
      }
      
      orderItems.push(orderItem)
    }
    
    await client.query('COMMIT')
    
    res.status(201).json({
      id: order.id,
      order_date: order.order_date,
      status: order.status,
      total_price: order.total_price,
      items: orderItems
    })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

// GET /api/orders - 주문 목록 조회
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query
    
    let query = `
      SELECT 
        o.id,
        o.order_date,
        o.status,
        o.total_price
      FROM orders o
    `
    const params = []
    let paramCount = 0
    
    if (status) {
      paramCount++
      query += ` WHERE o.status = $${paramCount}`
      params.push(status)
    }
    
    query += ` ORDER BY o.order_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(parseInt(limit), parseInt(offset))
    
    const ordersResult = await pool.query(query, params)
    
    // 전체 개수 조회
    let countQuery = 'SELECT COUNT(*) FROM orders'
    const countParams = []
    if (status) {
      countQuery += ' WHERE status = $1'
      countParams.push(status)
    }
    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)
    
    // 각 주문의 아이템과 옵션 조회
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        // OrderItems 조회
        const itemsQuery = `
          SELECT 
            oi.id,
            oi.menu_id,
            m.name as menu_name,
            oi.quantity,
            oi.unit_price
          FROM order_items oi
          JOIN menus m ON oi.menu_id = m.id
          WHERE oi.order_id = $1
          ORDER BY oi.id ASC
        `
        const itemsResult = await pool.query(itemsQuery, [order.id])
        
        // 각 아이템의 옵션 조회
        const items = await Promise.all(
          itemsResult.rows.map(async (item) => {
            const optionsQuery = `
              SELECT o.id, o.name
              FROM order_item_options oio
              JOIN options o ON oio.option_id = o.id
              WHERE oio.order_item_id = $1
              ORDER BY o.id ASC
            `
            const optionsResult = await pool.query(optionsQuery, [item.id])
            
            return {
              menu_id: item.menu_id,
              menu_name: item.menu_name,
              quantity: item.quantity,
              options: optionsResult.rows,
              unit_price: item.unit_price
            }
          })
        )
        
        return {
          id: order.id,
          order_date: order.order_date,
          status: order.status,
          total_price: order.total_price,
          items
        }
      })
    )
    
    res.json({
      orders,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/orders/:orderId - 특정 주문 조회
router.get('/:orderId', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId)
    
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        error: { message: '유효하지 않은 주문 ID입니다.' } 
      })
    }
    
    const orderQuery = `
      SELECT id, order_date, status, total_price
      FROM orders
      WHERE id = $1
    `
    const orderResult = await pool.query(orderQuery, [orderId])
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: '주문을 찾을 수 없습니다.' } 
      })
    }
    
    const order = orderResult.rows[0]
    
    // OrderItems 조회
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.menu_id,
        m.name as menu_name,
        oi.quantity,
        oi.unit_price
      FROM order_items oi
      JOIN menus m ON oi.menu_id = m.id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `
    const itemsResult = await pool.query(itemsQuery, [orderId])
    
    // 각 아이템의 옵션 조회
    const items = await Promise.all(
      itemsResult.rows.map(async (item) => {
        const optionsQuery = `
          SELECT o.id, o.name
          FROM order_item_options oio
          JOIN options o ON oio.option_id = o.id
          WHERE oio.order_item_id = $1
          ORDER BY o.id ASC
        `
        const optionsResult = await pool.query(optionsQuery, [item.id])
        
        return {
          menu_id: item.menu_id,
          menu_name: item.menu_name,
          quantity: item.quantity,
          options: optionsResult.rows,
          unit_price: item.unit_price
        }
      })
    )
    
    res.json({
      id: order.id,
      order_date: order.order_date,
      status: order.status,
      total_price: order.total_price,
      items
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/orders/:orderId/status - 주문 상태 변경
router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId)
    const { status } = req.body
    
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        error: { message: '유효하지 않은 주문 ID입니다.' } 
      })
    }
    
    if (!status || !['received', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ 
        error: { message: '유효하지 않은 주문 상태입니다.' } 
      })
    }
    
    // 현재 주문 조회
    const currentOrderResult = await pool.query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId]
    )
    
    if (currentOrderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: '주문을 찾을 수 없습니다.' } 
      })
    }
    
    const currentStatus = currentOrderResult.rows[0].status
    
    // 상태 변경 검증
    const validTransitions = {
      'received': ['in_progress'],
      'in_progress': ['completed'],
      'completed': [] // 완료 상태에서는 더 이상 변경 불가
    }
    
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        error: { 
          message: `주문 상태를 ${currentStatus}에서 ${status}로 변경할 수 없습니다.` 
        } 
      })
    }
    
    // 상태 업데이트
    const updateResult = await pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING id, order_date, status, total_price`,
      [status, orderId]
    )
    
    const order = updateResult.rows[0]
    
    // 아이템 정보 조회
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.menu_id,
        m.name as menu_name,
        oi.quantity,
        oi.unit_price
      FROM order_items oi
      JOIN menus m ON oi.menu_id = m.id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `
    const itemsResult = await pool.query(itemsQuery, [orderId])
    
    // 각 아이템의 옵션 조회
    const items = await Promise.all(
      itemsResult.rows.map(async (item) => {
        const optionsQuery = `
          SELECT o.id, o.name
          FROM order_item_options oio
          JOIN options o ON oio.option_id = o.id
          WHERE oio.order_item_id = $1
          ORDER BY o.id ASC
        `
        const optionsResult = await pool.query(optionsQuery, [item.id])
        
        return {
          menu_id: item.menu_id,
          menu_name: item.menu_name,
          quantity: item.quantity,
          options: optionsResult.rows,
          unit_price: item.unit_price
        }
      })
    )
    
    res.json({
      id: order.id,
      order_date: order.order_date,
      status: order.status,
      total_price: order.total_price,
      items
    })
  } catch (error) {
    next(error)
  }
})

export default router

