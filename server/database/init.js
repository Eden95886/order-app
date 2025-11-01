import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 데이터베이스 연결 (postgres 데이터베이스에 연결하여 새 DB 생성)
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // 초기 연결은 postgres DB 사용
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

const dbName = process.env.DB_NAME || 'coffee_order_db'

async function initDatabase() {
  try {
    console.log('데이터베이스 초기화 시작...')

    // 데이터베이스 존재 여부 확인 및 생성
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

    // 새로 생성된 데이터베이스에 연결
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    })

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

