// c:\Users\20302\Desktop\ai-memo-hands-on\drizzle\schema.ts
// Drizzle ORM 데이터베이스 스키마 정의
// notes 테이블과 관련 타입을 정의하여 타입 안전한 데이터베이스 쿼리 제공
// Related: lib/db/index.ts, drizzle.config.ts, app/notes/actions.ts
import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
  })
);

// TypeScript 타입 추론
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

