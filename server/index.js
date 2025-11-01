import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pool, { testConnection } from './config/db.js'

const app = express()
const PORT = process.env.PORT || 3000

// 데이터베이스 연결 테스트
testConnection().catch(console.error)

// 미들웨어 설정
app.use(cors()) // CORS 활성화 (프런트엔드와 통신)
app.use(express.json()) // JSON 요청 본문 파싱
app.use(express.urlencoded({ extended: true })) // URL 인코딩된 요청 본문 파싱

// 기본 라우트 (헬스 체크)
app.get('/', (req, res) => {
  res.json({ message: '커피 주문 앱 백엔드 서버' })
})

// API 라우트 (추후 구현)
// app.use('/api/menus', menuRoutes)
// app.use('/api/orders', orderRoutes)
// app.use('/api/inventory', inventoryRoutes)

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: { message: '요청한 리소스를 찾을 수 없습니다.' } })
})

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러 발생:', err)
  res.status(err.status || 500).json({
    error: {
      message: err.message || '서버 오류가 발생했습니다.',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  })
})

// 서버 시작
app.listen(PORT, async () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`)
  console.log(`접속 주소: http://localhost:${PORT}`)
  
  // 서버 시작 시 데이터베이스 연결 확인
  const isConnected = await testConnection()
  if (isConnected) {
    console.log('✅ 데이터베이스가 준비되었습니다.')
  } else {
    console.warn('⚠️ 데이터베이스 연결에 실패했습니다. API 기능이 제한될 수 있습니다.')
  }
})

// 서버 종료 시 연결 풀 종료
process.on('SIGINT', async () => {
  console.log('\n서버를 종료합니다...')
  await pool.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n서버를 종료합니다...')
  await pool.end()
  process.exit(0)
})

export default app

