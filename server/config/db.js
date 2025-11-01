import pg from 'pg'
const { Pool } = pg

// PostgreSQL 연결 풀 생성
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_order_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // 연결 풀의 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
  connectionTimeoutMillis: 2000, // 연결 타임아웃 (2초)
})

// 연결 풀 이벤트 리스너
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.')
})

pool.on('error', (err) => {
  console.error('❌ 데이터베이스 연결 오류:', err)
})

// 데이터베이스 연결 테스트 함수
export const testConnection = async () => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('데이터베이스 연결 테스트 성공:', result.rows[0].now)
    client.release()
    return true
  } catch (error) {
    console.error('데이터베이스 연결 테스트 실패:', error.message)
    return false
  }
}

export default pool

