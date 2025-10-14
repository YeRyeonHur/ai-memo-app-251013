// lib/gemini/__tests__/test-connection.test.ts
// Gemini API 연결 테스트 함수 단위 테스트
// 연결 테스트 및 API 키 검증 테스트
// Related: lib/gemini/test-connection.ts, lib/gemini/client.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { testGeminiConnection, validateApiKey } from '../test-connection'

// 클라이언트 모킹
vi.mock('../client', () => ({
  hasApiKey: vi.fn(),
  generateText: vi.fn(),
}))

import { hasApiKey, generateText } from '../client'

describe('Test Connection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('testGeminiConnection', () => {
    it('API 키가 없으면 실패 결과를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(false)

      const result = await testGeminiConnection()

      expect(result.success).toBe(false)
      expect(result.error).toContain('GEMINI_API_KEY')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('연결 성공 시 success: true를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      vi.mocked(generateText).mockResolvedValue({
        text: 'Test response',
        generationTime: 100,
      })

      const result = await testGeminiConnection()

      expect(result.success).toBe(true)
      expect(result.testResponse).toBe('Test response')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBeUndefined()
    })

    it('API 호출 실패 시 에러 메시지를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      vi.mocked(generateText).mockRejectedValue(new Error('API Error'))

      const result = await testGeminiConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('타임아웃이 발생하면 실패 결과를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      // generateText가 타임아웃보다 오래 걸리도록 설정
      vi.mocked(generateText).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ text: 'Late response' }), 1000)
          })
      )

      const result = await testGeminiConnection(100) // 100ms 타임아웃

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('커스텀 타임아웃을 설정할 수 있다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      vi.mocked(generateText).mockResolvedValue({
        text: 'Test response',
        generationTime: 50,
      })

      const result = await testGeminiConnection(5000)

      expect(result.success).toBe(true)
    })

    it('응답 시간을 측정한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      vi.mocked(generateText).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ text: 'Response', generationTime: 50 }), 50)
          })
      )

      const result = await testGeminiConnection()

      expect(result.responseTime).toBeGreaterThanOrEqual(50)
    })
  })

  describe('validateApiKey', () => {
    it('연결 성공 시 true를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      vi.mocked(generateText).mockResolvedValue({
        text: 'Test response',
        generationTime: 100,
      })

      const result = await validateApiKey()

      expect(result).toBe(true)
    })

    it('연결 실패 시 false를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(false)

      const result = await validateApiKey()

      expect(result).toBe(false)
    })

    it('API 에러 발생 시 false를 반환한다', async () => {
      vi.mocked(hasApiKey).mockReturnValue(true)
      vi.mocked(generateText).mockRejectedValue(new Error('API Error'))

      const result = await validateApiKey()

      expect(result).toBe(false)
    })
  })
})

