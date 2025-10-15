// lib/gemini/__tests__/client.test.ts
// Gemini 클라이언트 단위 테스트
// 클라이언트 초기화 및 API 키 검증 테스트
// Related: lib/gemini/client.ts, lib/gemini/errors.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initGeminiClient, getGeminiClient, resetGeminiClient, hasApiKey } from '../client'
import { GeminiAPIKeyMissingError } from '../errors'

// GoogleGenAI 클래스 모킹
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function (this: any, options: any) {
    this.apiKey = options.apiKey
    this.models = {
      generateContent: vi.fn().mockResolvedValue({
        text: 'Mocked response',
      }),
    }
    return this
  }),
}))

describe('Gemini Client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // 환경변수 초기화
    process.env = { ...originalEnv }
    // 클라이언트 인스턴스 리셋
    resetGeminiClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initGeminiClient', () => {
    it('API 키가 GEMINI_API_KEY로 설정되어 있으면 클라이언트를 초기화한다', () => {
      process.env.GEMINI_API_KEY = 'test-api-key-123'

      const client = initGeminiClient()

      expect(client).toBeDefined()
      expect((client as any).apiKey).toBe('test-api-key-123')
    })

    it('API 키가 GOOGLE_API_KEY로 설정되어 있으면 클라이언트를 초기화한다', () => {
      process.env.GOOGLE_API_KEY = 'test-google-key-456'

      const client = initGeminiClient()

      expect(client).toBeDefined()
      expect((client as any).apiKey).toBe('test-google-key-456')
    })

    it('GEMINI_API_KEY가 GOOGLE_API_KEY보다 우선순위가 높다', () => {
      process.env.GEMINI_API_KEY = 'gemini-key'
      process.env.GOOGLE_API_KEY = 'google-key'

      const client = initGeminiClient()

      expect((client as any).apiKey).toBe('gemini-key')
    })

    it('API 키가 없으면 GeminiAPIKeyMissingError를 발생시킨다', () => {
      delete process.env.GEMINI_API_KEY
      delete process.env.GOOGLE_API_KEY

      expect(() => initGeminiClient()).toThrow(GeminiAPIKeyMissingError)
      expect(() => initGeminiClient()).toThrow('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
    })

    it('클라이언트는 싱글톤 패턴을 사용한다', () => {
      process.env.GEMINI_API_KEY = 'test-key'

      const client1 = initGeminiClient()
      const client2 = initGeminiClient()

      expect(client1).toBe(client2)
    })
  })

  describe('getGeminiClient', () => {
    it('초기화된 클라이언트가 없으면 새로 초기화한다', () => {
      process.env.GEMINI_API_KEY = 'test-key'

      const client = getGeminiClient()

      expect(client).toBeDefined()
    })

    it('이미 초기화된 클라이언트가 있으면 재사용한다', () => {
      process.env.GEMINI_API_KEY = 'test-key'

      const client1 = initGeminiClient()
      const client2 = getGeminiClient()

      expect(client1).toBe(client2)
    })
  })

  describe('resetGeminiClient', () => {
    it('클라이언트 인스턴스를 초기화한다', () => {
      process.env.GEMINI_API_KEY = 'test-key'

      const client1 = initGeminiClient()
      resetGeminiClient()
      const client2 = initGeminiClient()

      expect(client1).not.toBe(client2)
    })
  })

  describe('hasApiKey', () => {
    it('GEMINI_API_KEY가 설정되어 있으면 true를 반환한다', () => {
      process.env.GEMINI_API_KEY = 'test-key'

      expect(hasApiKey()).toBe(true)
    })

    it('GOOGLE_API_KEY가 설정되어 있으면 true를 반환한다', () => {
      process.env.GOOGLE_API_KEY = 'test-key'

      expect(hasApiKey()).toBe(true)
    })

    it('API 키가 없으면 false를 반환한다', () => {
      delete process.env.GEMINI_API_KEY
      delete process.env.GOOGLE_API_KEY

      expect(hasApiKey()).toBe(false)
    })
  })
})

