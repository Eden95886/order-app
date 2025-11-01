import pg from 'pg'
const { Pool } = pg

// Render.com Internal Database URL 파싱 또는 개별 환경 변수 사용
let dbConfig = {}

if (process.env.DATABASE_URL) {
  // Internal Database URL 형식: postgresql://user:password@host:port/dbname
  try {
    const url = new URL(process.env.DATABASE_URL)
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // /dbname -> dbname
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false } // Render.com은 SSL 필요
    }
  } catch (error) {
    console.error('DATABASE_URL 파싱 오류:', error)
    // 파싱 실패 시 개별 환경 변수 사용
  }
}

// DATABASE_URL이 없거나 파싱 실패 시 개별 환경 변수 사용
if (!dbConfig.host) {
  // DB_HOST에서 호스트만 추출 (호스트/데이터베이스 형식 제거)
  let host = process.env.DB_HOST || 'localhost'
  
  // 호스트에 슬래시(/)가 포함되어 있으면 호스트만 추출
  if (host.includes('/')) {
    const hostPart = host.split('/')[0]
    host = hostPart.split(':')[0]
  }
  
  // 포트 번호가 호스트에 포함된 경우 제거
  if (host.includes(':')) {
    host = host.split(':')[0]
  }
  
  dbConfig = {
    host: host.trim(),
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'coffee_order_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('render.com')
      ? { rejectUnauthorized: false }
      : false
  }
}

// PostgreSQL 연결 풀 생성
const pool = new Pool({
  ...dbConfig,
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

