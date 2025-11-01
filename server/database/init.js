import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Render.com Internal Database URL 파싱 또는 개별 환경 변수 사용
let dbConfig = {}

if (process.env.DATABASE_URL) {
  // Internal Database URL 형식: postgresql://user:password@host:port/dbname
  const url = new URL(process.env.DATABASE_URL)
  dbConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // /dbname -> dbname
    user: url.username,
    password: url.password,
    ssl: { rejectUnauthorized: false } // Render.com은 SSL 필요
  }
} else {
  // 개별 환경 변수 사용
  // DB_HOST에서 호스트만 추출 (URL 형식인 경우)
  let host = process.env.DB_HOST || 'localhost'
  if (host.includes('/')) {
    // URL 형식인 경우 호스트만 추출
    try {
      const url = new URL(`postgresql://${host}`)
      host = url.hostname
    } catch (e) {
      // URL 파싱 실패 시 '/' 앞부분만 사용
      host = host.split('/')[0]
    }
  }
  
  dbConfig = {
    host: host,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'coffee_order_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('render.com')
      ? { rejectUnauthorized: false }
      : false
  }
}

const dbName = dbConfig.database

async function initDatabase() {
  try {
    console.log('데이터베이스 초기화 시작...')
    console.log('데이터베이스 연결 정보:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    })

    // Render.com에서는 데이터베이스가 이미 생성되어 있으므로 바로 연결
    // 로컬 환경에서만 데이터베이스 생성 시도
    if (!process.env.DB_HOST?.includes('render.com') && !process.env.DATABASE_URL) {
      // 로컬 환경: postgres 데이터베이스에 연결하여 새 DB 생성
      const adminPool = new Pool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'postgres',
        user: dbConfig.user,
        password: dbConfig.password,
        ssl: false
      })

      const dbCheck = await adminPool.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      )

      if (dbCheck.rows.length === 0) {
        console.log(`데이터베이스 "${dbName}" 생성 중...`)
        await adminPool.query(`CREATE DATABASE ${dbName}`)
        console.log(`✅ 데이터베이스 "${dbName}" 생성 완료`)
      } else {
        console.log(`✅ 데이터베이스 "${dbName}" 이미 존재합니다`)
      }

      await adminPool.end()
    } else {
      console.log('✅ Render.com 데이터베이스에 연결합니다 (이미 생성됨)')
    }

    // 실제 데이터베이스에 연결
    const pool = new Pool(dbConfig)

    // 스키마 파일 읽기 및 실행
    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    console.log('스키마 생성 중...')
    await pool.query(schema)
    console.log('✅ 스키마 생성 완료')

    // 시드 파일 읽기 및 실행
    const seedPath = join(__dirname, 'seed.sql')
    const seed = readFileSync(seedPath, 'utf-8')
    console.log('초기 데이터 삽입 중...')
    await pool.query(seed)
    console.log('✅ 초기 데이터 삽입 완료')

    await pool.end()
    console.log('✅ 데이터베이스 초기화 완료!')
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error)
    process.exit(1)
  }
}

initDatabase()

