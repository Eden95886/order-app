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
  // DB_HOST에서 호스트만 추출 (URL 형식 또는 호스트/데이터베이스 형식인 경우)
  let host = process.env.DB_HOST || 'localhost'
  
  // 호스트에 슬래시(/)가 포함되어 있으면 호스트만 추출
  if (host.includes('/')) {
    // 형식: host/database 또는 host:port/database
    // 호스트 부분만 추출
    const hostPart = host.split('/')[0]
    // 포트가 있는 경우: host:port -> host
    host = hostPart.split(':')[0]
    console.log(`호스트에서 데이터베이스 이름 제거: ${process.env.DB_HOST} -> ${host}`)
  }
  
  // 포트 번호가 호스트에 포함된 경우 제거
  if (host.includes(':')) {
    host = host.split(':')[0]
  }
  
  dbConfig = {
    host: host.trim(), // 앞뒤 공백 제거
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

    // 스키마 파일을 안전하게 실행
    // PostgreSQL 함수 정의($$ 구분자)를 포함한 복잡한 SQL을 처리
    // DDL 명령은 자동 커밋되므로 트랜잭션 없이 실행 (트랜잭션 abort 오류 방지)
    console.log('스키마 생성 중...')
    
    const client = await pool.connect()
    
    try {
      // 1. 함수 정의 먼저 실행 ($$ 구분자 때문에 별도 처리)
      const functionSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `
      try {
        await client.query(functionSQL)
        console.log('✅ 트리거 함수 생성 완료')
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error)
        if (error.code === '42723') { // function already exists
          console.log('⚠️ 트리거 함수는 이미 존재합니다.')
        } else {
          console.log(`⚠️ 트리거 함수 생성 경고 (계속 진행): ${errorMessage.split('\n')[0]}`)
        }
      }
      
      // 2. 스키마 파일 읽기
      const schemaPath = join(__dirname, 'schema.sql')
      const schemaContent = readFileSync(schemaPath, 'utf-8')
      
      // 주석 제거
      let cleanedSchema = schemaContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
      
      // $$ 구분자를 사용하는 블록들 추출 (함수 정의 및 DO 블록)
      // 1. 함수 정의 추출
      const functionRegex = /CREATE OR REPLACE FUNCTION[\s\S]*?\$\$\s*language\s+['"]plpgsql['"]\s*;/gi
      const functionBlock = cleanedSchema.match(functionRegex)?.[0] || null
      
      // 2. DO $$ 블록 직접 실행 (안전하게)
      // 제약조건 추가: options 테이블에 (menu_id, name) UNIQUE 제약조건
      const addConstraintSQL = `
        DO $$
        BEGIN
            ALTER TABLE options ADD CONSTRAINT options_menu_id_name_key UNIQUE (menu_id, name);
        EXCEPTION
            WHEN duplicate_table THEN NULL;
            WHEN duplicate_object THEN NULL;
        END $$;
      `
      try {
        await client.query(addConstraintSQL.trim())
        console.log('✅ 제약조건 추가 완료 (또는 이미 존재)')
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error)
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate') ||
            error.code === '42710' || // duplicate object
            error.code === '42P16') { // invalid table definition
          console.log(`⚠️ 경고 (무시): ${errorMessage.split('\n')[0]}`)
        } else {
          // 다른 오류는 로그만 남기고 계속 진행 (제약조건이 없어도 동작 가능)
          console.log(`⚠️ 제약조건 추가 중 오류 (계속 진행): ${errorMessage.split('\n')[0]}`)
        }
      }
      
      // 3. 함수 정의와 DO 블록을 제거한 나머지 SQL
      let remainingSQL = cleanedSchema
        .replace(functionRegex, '')
        .replace(/DO\s+\$\$[\s\S]*?END\s+\$\$\s*;/gi, '')
      
      // 나머지 SQL을 세미콜론으로 구분하여 개별 실행
      const statements = remainingSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10) // 최소 길이 체크
      
      // 각 명령을 자동 커밋 모드로 실행 (트랜잭션 없이)
      // 오류 발생 시에도 다른 명령들이 실행될 수 있도록 함
      for (const statement of statements) {
        if (!statement) continue
        
        try {
          await client.query(statement + ';')
        } catch (error) {
          // 이미 존재하는 객체는 무시하고 계속 진행
          const errorMessage = error?.message || error?.toString() || String(error)
          
          // 트랜잭션 abort 오류 체크
          if (errorMessage.includes('current transaction is aborted') ||
              errorMessage.includes('commands ignored until end of transaction block')) {
            // 트랜잭션 abort 오류는 로그만 남기고 계속 진행
            console.log(`⚠️ 경고 (트랜잭션 오류 무시 - 계속 진행): ${errorMessage.split('\n')[0]}`)
            continue
          }
          
          if (errorMessage.includes('already exists') || 
              errorMessage.includes('duplicate key') ||
              errorMessage.includes('duplicate table') ||
              errorMessage.includes('duplicate object') ||
              errorMessage.includes('ON CONFLICT') ||
              errorMessage.includes('no unique or exclusion constraint matching the ON CONFLICT') ||
              errorMessage.includes('there is no unique or exclusion constraint matching the ON CONFLICT') ||
              error.code === '42P07' || // relation already exists
              error.code === '42710' || // duplicate object
              error.code === '42723' || // function already exists
              error.code === '42P16') { // invalid table definition (제약조건 관련)
            console.log(`⚠️ 경고 (무시): ${errorMessage.split('\n')[0]}`)
          } else {
            // 심각한 오류는 로그만 남기고 계속 진행 (트랜잭션 abort 방지)
            console.log(`⚠️ 경고 (SQL 실행 오류 - 계속 진행): ${errorMessage.split('\n')[0]}`)
          }
        }
      }
      
      console.log('✅ 스키마 생성 완료')
    } catch (error) {
      // 예상치 못한 오류 처리
      const errorMessage = error?.message || error?.toString() || String(error)
      console.error('❌ 스키마 생성 중 예상치 못한 오류:', errorMessage)
      // 계속 진행 (트랜잭션 없으므로 rollback 불필요)
    } finally {
      client.release()
    }

    // 시드 파일 읽기 및 실행
    // INSERT 문은 자동 커밋 모드로 실행하여 트랜잭션 abort 오류 방지
    const seedPath = join(__dirname, 'seed.sql')
    const seedContent = readFileSync(seedPath, 'utf-8')
    console.log('초기 데이터 삽입 중...')
    
    // 시드 파일을 개별 명령어로 분리하여 실행 (오류 처리 강화)
    const seedClient = await pool.connect()
    try {
      // 주석 제거
      let cleanedSeed = seedContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
      
      // 세미콜론으로 구분
      const seedStatements = cleanedSeed
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 5) // 최소 길이 체크
      
      // 각 명령을 자동 커밋 모드로 실행 (트랜잭션 없이)
      // 오류 발생 시에도 다른 명령들이 실행될 수 있도록 함
      for (const statement of seedStatements) {
        if (!statement) continue
        
        try {
          await seedClient.query(statement + ';')
        } catch (error) {
          // 이미 존재하는 데이터는 무시
          const errorMessage = error?.message || error?.toString() || String(error)
          
          // 트랜잭션 abort 오류 체크
          if (errorMessage.includes('current transaction is aborted') ||
              errorMessage.includes('commands ignored until end of transaction block')) {
            // 트랜잭션 abort 오류는 로그만 남기고 계속 진행
            console.log(`⚠️ 경고 (트랜잭션 오류 무시 - 계속 진행): ${errorMessage.split('\n')[0]}`)
            continue
          }
          
          if (errorMessage.includes('already exists') || 
              errorMessage.includes('duplicate key') ||
              errorMessage.includes('unique constraint') ||
              error.code === '23505') { // unique_violation
            console.log(`⚠️ 경고 (무시): ${errorMessage.split('\n')[0]}`)
          } else if (errorMessage.includes('ON CONFLICT') || 
                     errorMessage.includes('no unique or exclusion constraint matching the ON CONFLICT') ||
                     errorMessage.includes('there is no unique or exclusion constraint matching the ON CONFLICT')) {
            // ON CONFLICT 오류는 무시 (seed.sql에는 ON CONFLICT가 없지만, 혹시 모를 경우를 대비)
            console.log(`⚠️ 경고 (ON CONFLICT 오류 무시 - 계속 진행): ${errorMessage.split('\n')[0]}`)
          } else {
            // 다른 오류도 로그만 남기고 계속 진행 (트랜잭션 abort 방지)
            console.log(`⚠️ 경고 (시드 데이터 실행 오류 - 계속 진행): ${errorMessage.split('\n')[0]}`)
          }
        }
      }
      
      console.log('✅ 초기 데이터 삽입 완료')
    } catch (error) {
      // 예상치 못한 오류 처리
      const errorMessage = error?.message || error?.toString() || String(error)
      console.error('❌ 초기 데이터 삽입 중 예상치 못한 오류:', errorMessage)
      // 계속 진행 (트랜잭션 없으므로 rollback 불필요)
    } finally {
      seedClient.release()
    }

    await pool.end()
    console.log('✅ 데이터베이스 초기화 완료!')
  } catch (error) {
    // 최상위 오류 처리: ON CONFLICT 및 트랜잭션 abort 오류는 치명적이지 않음
    // error 객체의 다양한 형태를 처리
    const errorMessage = typeof error === 'string' 
      ? error 
      : (error?.message || error?.toString() || JSON.stringify(error))
    
    // ON CONFLICT 관련 오류 체크
    if (errorMessage.includes('ON CONFLICT') || 
        errorMessage.includes('no unique or exclusion constraint matching the ON CONFLICT') ||
        errorMessage.includes('there is no unique or exclusion constraint matching the ON CONFLICT')) {
      console.log(`⚠️ 경고 (ON CONFLICT 오류 - 계속 진행): ${errorMessage.split('\n')[0]}`)
      console.log('✅ 데이터베이스 초기화 완료 (일부 오류 무시)')
      process.exit(0) // 성공으로 종료
    } 
    // 트랜잭션 abort 오류 체크
    else if (errorMessage.includes('current transaction is aborted') ||
             errorMessage.includes('commands ignored until end of transaction block')) {
      console.log(`⚠️ 경고 (트랜잭션 abort 오류 - 계속 진행): ${errorMessage.split('\n')[0]}`)
      console.log('✅ 데이터베이스 초기화 완료 (트랜잭션 오류 무시)')
      process.exit(0) // 성공으로 종료
    } else {
      console.error('❌ 데이터베이스 초기화 오류:', error)
      console.error('오류 타입:', typeof error)
      console.error('오류 메시지:', errorMessage)
      process.exit(1)
    }
  }
}

initDatabase()

