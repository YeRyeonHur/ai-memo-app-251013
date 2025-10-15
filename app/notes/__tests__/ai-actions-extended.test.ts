// app/notes/__tests__/ai-actions-extended.test.ts
// AI 액션 확장 기능 테스트
// 새로운 Server Actions (generateSummaryWithStyle, generateTagsWithCount) 테스트
// Related: app/notes/ai-actions.ts, lib/gemini/prompts.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSummaryWithStyle, generateTagsWithCount } from '../ai-actions'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  })),
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [{
            id: 'test-note-id',
            userId: 'test-user-id',
            title: 'Test Note',
            content: 'This is a test note content for AI processing.',
            createdAt: new Date(),
            updatedAt: new Date(),
          }])
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{
          id: 'test-summary-id',
          noteId: 'test-note-id',
          userId: 'test-user-id',
          summary: 'Test summary content',
          model: 'gemini-2.0-flash',
          createdAt: new Date(),
          updatedAt: new Date(),
        }])
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve())
    }))
  }
}))

vi.mock('@/lib/gemini/client', () => ({
  generateText: vi.fn(() => Promise.resolve({
    text: 'Test AI generated content',
  })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('AI Actions Extended', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSummaryWithStyle', () => {
    it('should generate summary with bullet style and medium length', async () => {
      const result = await generateSummaryWithStyle(
        'test-note-id',
        'bullet',
        'medium'
      )

      expect(result.success).toBe(true)
      expect(result.summary).toBe('Test summary content')
      expect(result.style).toBe('bullet')
      expect(result.length).toBe('medium')
    })

    it('should generate summary with numbered style and short length', async () => {
      const result = await generateSummaryWithStyle(
        'test-note-id',
        'numbered',
        'short'
      )

      expect(result.success).toBe(true)
      expect(result.style).toBe('numbered')
      expect(result.length).toBe('short')
    })

    it('should generate summary with paragraph style and detailed length', async () => {
      const result = await generateSummaryWithStyle(
        'test-note-id',
        'paragraph',
        'detailed'
      )

      expect(result.success).toBe(true)
      expect(result.style).toBe('paragraph')
      expect(result.length).toBe('detailed')
    })

    it('should generate summary with keywords style', async () => {
      const result = await generateSummaryWithStyle(
        'test-note-id',
        'keywords',
        'medium'
      )

      expect(result.success).toBe(true)
      expect(result.style).toBe('keywords')
    })

    it('should handle invalid note ID', async () => {
      const result = await generateSummaryWithStyle(
        '',
        'bullet',
        'medium'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 ID가 유효하지 않습니다.')
    })

    it('should handle authentication error', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValueOnce({
        auth: {
          getUser: vi.fn(() => ({
            data: { user: null },
            error: new Error('Auth error'),
          })),
        },
      } as any)

      const result = await generateSummaryWithStyle(
        'test-note-id',
        'bullet',
        'medium'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증되지 않은 사용자입니다. 다시 로그인해주세요.')
    })
  })

  describe('generateTagsWithCount', () => {
    it('should generate 3 tags', async () => {
      const { generateText } = await import('@/lib/gemini/client')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'tag1, tag2, tag3',
      })

      const result = await generateTagsWithCount('test-note-id', 3)

      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3'])
      expect(result.count).toBe(3)
    })

    it('should generate 6 tags', async () => {
      const { generateText } = await import('@/lib/gemini/client')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'tag1, tag2, tag3, tag4, tag5, tag6',
      })

      const result = await generateTagsWithCount('test-note-id', 6)

      expect(result.success).toBe(true)
      expect(result.tags).toHaveLength(6)
      expect(result.count).toBe(6)
    })

    it('should generate 9 tags', async () => {
      const { generateText } = await import('@/lib/gemini/client')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9',
      })

      const result = await generateTagsWithCount('test-note-id', 9)

      expect(result.success).toBe(true)
      expect(result.tags).toHaveLength(9)
      expect(result.count).toBe(9)
    })

    it('should handle empty AI response', async () => {
      const { generateText } = await import('@/lib/gemini/client')
      vi.mocked(generateText).mockResolvedValueOnce({
        text: '',
      })

      const result = await generateTagsWithCount('test-note-id', 3)

      expect(result.success).toBe(false)
      expect(result.error).toBe('태그를 생성할 수 없습니다. 다시 시도해주세요.')
    })

    it('should handle invalid note ID', async () => {
      const result = await generateTagsWithCount('', 3)

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 ID가 유효하지 않습니다.')
    })
  })
})
