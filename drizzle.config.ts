// c:\Users\20302\Desktop\ai-memo-hands-on\drizzle.config.ts
// Drizzle Kit 설정 파일
// Drizzle Kit CLI가 스키마와 마이그레이션을 관리하기 위해 사용
// Related: drizzle/schema.ts, lib/db/index.ts, .env.local
import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// .env.local 파일 명시적으로 로드
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL이 설정되지 않았습니다. .env.local 파일을 확인하세요.');
}

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;

