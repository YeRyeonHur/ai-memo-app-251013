// c:\Users\20302\Desktop\ai-memo-hands-on\lib\db\index.ts
// Drizzle ORM 클라이언트 초기화 및 export
// 서버 컴포넌트와 Server Actions에서 타입 안전한 데이터베이스 쿼리를 위해 사용
// Related: drizzle/schema.ts, app/notes/actions.ts, drizzle.config.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/drizzle/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.'
  );
}

// Postgres.js 클라이언트 생성
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  prepare: false, // PgBouncer 호환성을 위해 prepared statements 비활성화
});

// Drizzle 클라이언트 생성 (스키마 포함)
export const db = drizzle(client, { schema });

// 타입 export
export type { Note, NewNote } from '@/drizzle/schema';

