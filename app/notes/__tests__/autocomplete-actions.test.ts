// app/notes/__tests__/autocomplete-actions.test.ts
// AI 자동완성 Server Actions 테스트
// 제안 생성, 사용자 패턴 분석, 에러 처리 등의 기능 테스트
// Related: app/notes/autocomplete-actions.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAutocompleteSuggestion, analyzeUserWritingPattern } from '../autocomplete-actions'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  }
}))

vi.mock('@/lib/gemini/client', () => ({
  generateText: vi.fn()
}))

vi.mock('@/lib/gemini/prompts', () => ({
  createAutocompletePrompt: vi.fn()
}))

vi.mock('@/lib/gemini/errors', () => ({
  parseGeminiError: vi.fn()
}))

vi.mock('@/lib/gemini/utils', () => ({
  validatePrompt: vi.fn(),
  truncateToTokenLimit: vi.fn()
}))

vi.mock('@/lib/utils/user-patterns', () => ({
  analyzeUserWritingPattern: vi.fn(),
  getUserWritingPattern: vi.fn()
}))

describe('autocomplete-actions', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock setup
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('generateAutocompleteSuggestion', () => {
    it('인증되지 않은 사용자일 때 에러를 반환해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const result = await generateAutocompleteSuggestion('테스트 입력')

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증되지 않은 사용자입니다. 다시 로그인해주세요.')
    })

    it('입력값이 비어있을 때 에러를 반환해야 한다', async () => {
      const result = await generateAutocompleteSuggestion('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('입력 텍스트가 필요합니다.')
    })

    it('성공적으로 제안을 생성해야 한다', async () => {
      const { generateText } = require('@/lib/gemini/client')
      const { createAutocompletePrompt } = require('@/lib/gemini/prompts')
      const { validatePrompt, truncateToTokenLimit } = require('@/lib/gemini/utils')
      const { analyzeUserWritingPattern } = require('@/lib/utils/user-patterns')

      // Mock setup
      validatePrompt.mockReturnValue({ valid: true })
      createAutocompletePrompt.mockReturnValue('mock prompt')
      generateText.mockResolvedValue({
        text: '제안 1 [sentence] (90%)\n제안 2 [phrase] (80%)\n제안 3 [word] (70%)'
      })
      analyzeUserWritingPattern.mockResolvedValue({
        success: true,
        pattern: {
          commonPhrases: ['테스트', '예시'],
          writingStyle: 'casual',
          averageLength: 20
        }
      })

      const result = await generateAutocompleteSuggestion('테스트 입력', '컨텍스트')

      expect(result.success).toBe(true)
      expect(result.suggestions).toHaveLength(3)
      expect(result.suggestions![0]).toEqual({
        id: 'suggestion-1',
        text: '제안 1',
        confidence: 0.9,
        type: 'sentence'
      })
    })

    it('사용자 패턴 분석 실패 시에도 제안을 생성해야 한다', async () => {
      const { generateText } = require('@/lib/gemini/client')
      const { createAutocompletePrompt } = require('@/lib/gemini/prompts')
      const { validatePrompt } = require('@/lib/gemini/utils')
      const { analyzeUserWritingPattern } = require('@/lib/utils/user-patterns')

      // Mock setup
      validatePrompt.mockReturnValue({ valid: true })
      createAutocompletePrompt.mockReturnValue('mock prompt')
      generateText.mockResolvedValue({
        text: '제안 1 [sentence] (90%)'
      })
      analyzeUserWritingPattern.mockRejectedValue(new Error('Pattern analysis failed'))

      const result = await generateAutocompleteSuggestion('테스트 입력')

      expect(result.success).toBe(true)
      expect(result.suggestions).toHaveLength(1)
    })

    it('토큰 제한 초과 시 텍스트를 잘라야 한다', async () => {
      const { generateText } = require('@/lib/gemini/client')
      const { createAutocompletePrompt } = require('@/lib/gemini/prompts')
      const { validatePrompt, truncateToTokenLimit } = require('@/lib/gemini/utils')

      // Mock setup
      validatePrompt.mockReturnValue({ valid: false })
      truncateToTokenLimit.mockReturnValue('잘린 텍스트')
      createAutocompletePrompt.mockReturnValue('mock prompt')
      generateText.mockResolvedValue({
        text: '제안 1 [sentence] (90%)'
      })

      const result = await generateAutocompleteSuggestion('매우 긴 텍스트...')

      expect(truncateToTokenLimit).toHaveBeenCalledWith('매우 긴 텍스트...', 6000)
      expect(result.success).toBe(true)
    })

    it('API 호출 실패 시 에러를 반환해야 한다', async () => {
      const { generateText } = require('@/lib/gemini/client')
      const { createAutocompletePrompt } = require('@/lib/gemini/prompts')
      const { validatePrompt } = require('@/lib/gemini/utils')
      const { parseGeminiError } = require('@/lib/gemini/errors')

      // Mock setup
      validatePrompt.mockReturnValue({ valid: true })
      createAutocompletePrompt.mockReturnValue('mock prompt')
      generateText.mockRejectedValue(new Error('API Error'))
      parseGeminiError.mockReturnValue({ message: 'API 호출 실패' })

      const result = await generateAutocompleteSuggestion('테스트 입력')

      expect(result.success).toBe(false)
      expect(result.error).toBe('API 호출 실패')
    })

    it('빈 응답일 때 에러를 반환해야 한다', async () => {
      const { generateText } = require('@/lib/gemini/client')
      const { createAutocompletePrompt } = require('@/lib/gemini/prompts')
      const { validatePrompt } = require('@/lib/gemini/utils')

      // Mock setup
      validatePrompt.mockReturnValue({ valid: true })
      createAutocompletePrompt.mockReturnValue('mock prompt')
      generateText.mockResolvedValue({ text: '' })

      const result = await generateAutocompleteSuggestion('테스트 입력')

      expect(result.success).toBe(false)
      expect(result.error).toBe('자동완성 제안을 생성할 수 없습니다. 다시 시도해주세요.')
    })
  })

  describe('analyzeUserWritingPattern', () => {
    it('사용자 노트가 없을 때 기본 패턴을 반환해야 한다', async () => {
      const { db } = require('@/lib/db')
      db.limit.mockResolvedValue([])

      const result = await analyzeUserWritingPattern('user-123')

      expect(result.success).toBe(true)
      expect(result.pattern).toEqual({
        commonPhrases: [],
        writingStyle: 'casual',
        averageLength: 0
      })
    })

    it('사용자 노트를 분석하여 패턴을 반환해야 한다', async () => {
      const { db } = require('@/lib/db')
      const { generateText } = require('@/lib/gemini/client')
      const { validatePrompt, truncateToTokenLimit } = require('@/lib/gemini/utils')

      // Mock setup
      const mockNotes = [
        { title: '노트 1', content: '내용 1', createdAt: new Date() },
        { title: '노트 2', content: '내용 2', createdAt: new Date() }
      ]
      db.limit.mockResolvedValue(mockNotes)
      validatePrompt.mockReturnValue({ valid: true })
      generateText.mockResolvedValue({
        text: '자주 사용하는 표현: 테스트, 예시\n문체: casual\n평균 길이: 20'
      })

      const result = await analyzeUserWritingPattern('user-123')

      expect(result.success).toBe(true)
      expect(result.pattern).toEqual({
        commonPhrases: ['테스트', '예시'],
        writingStyle: 'casual',
        averageLength: 20
      })
    })

    it('토큰 제한 초과 시 텍스트를 잘라야 한다', async () => {
      const { db } = require('@/lib/db')
      const { generateText } = require('@/lib/gemini/client')
      const { validatePrompt, truncateToTokenLimit } = require('@/lib/gemini/utils')

      // Mock setup
      const mockNotes = [
        { title: '긴 노트', content: '매우 긴 내용...', createdAt: new Date() }
      ]
      db.limit.mockResolvedValue(mockNotes)
      validatePrompt.mockReturnValue({ valid: false })
      truncateToTokenLimit.mockReturnValue('잘린 텍스트')
      generateText.mockResolvedValue({
        text: '자주 사용하는 표현: 테스트\n문체: casual\n평균 길이: 15'
      })

      const result = await analyzeUserWritingPattern('user-123')

      expect(truncateToTokenLimit).toHaveBeenCalledWith(expect.any(String), 7000)
      expect(result.success).toBe(true)
    })

    it('API 호출 실패 시 에러를 반환해야 한다', async () => {
      const { db } = require('@/lib/db')
      const { generateText } = require('@/lib/gemini/client')
      const { validatePrompt } = require('@/lib/gemini/utils')

      // Mock setup
      const mockNotes = [
        { title: '노트 1', content: '내용 1', createdAt: new Date() }
      ]
      db.limit.mockResolvedValue(mockNotes)
      validatePrompt.mockReturnValue({ valid: true })
      generateText.mockRejectedValue(new Error('API Error'))

      const result = await analyzeUserWritingPattern('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('사용자 패턴을 분석할 수 없습니다.')
    })
  })
})
