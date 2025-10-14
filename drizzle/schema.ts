// c:\Users\20302\Desktop\ai-memo-hands-on\drizzle\schema.ts
// Drizzle ORM 데이터베이스 스키마 정의
// notes, summaries 테이블과 관련 타입을 정의하여 타입 안전한 데이터베이스 쿼리 제공
// Related: lib/db/index.ts, drizzle.config.ts, app/notes/actions.ts, app/notes/ai-actions.ts
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
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
    deletedAtIdx: index('notes_deleted_at_idx').on(table.deletedAt),
  })
);

export const summaries = pgTable(
  'summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    summary: text('summary').notNull(),
    model: text('model').notNull().default('gemini-2.0-flash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    noteIdIdx: index('summaries_note_id_idx').on(table.noteId),
    userIdIdx: index('summaries_user_id_idx').on(table.userId),
  })
);

// TypeScript 타입 추론
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;

