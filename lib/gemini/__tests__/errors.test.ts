// lib/gemini/__tests__/errors.test.ts
// Gemini 에러 핸들링 단위 테스트
// 에러 클래스 및 파싱 함수 테스트
// Related: lib/gemini/errors.ts, lib/gemini/types.ts

import { describe, it, expect } from 'vitest'
import {
  GeminiAPIKeyMissingError,
  GeminiNetworkError,
  GeminiRateLimitError,
  GeminiTokenLimitError,
  GeminiTimeoutError,
  parseGeminiError,
} from '../errors'
import { GeminiErrorType } from '../types'

describe('Gemini Errors', () => {
  describe('커스텀 에러 클래스', () => {
    it('GeminiAPIKeyMissingError가 올바른 이름과 메시지를 가진다', () => {
      const error = new GeminiAPIKeyMissingError()

      expect(error.name).toBe('GeminiAPIKeyMissingError')
      expect(error.message).toContain('API 키가 설정되지 않았습니다')
    })

    it('GeminiNetworkError가 올바른 이름과 메시지를 가진다', () => {
      const error = new GeminiNetworkError()

      expect(error.name).toBe('GeminiNetworkError')
      expect(error.message).toContain('네트워크 연결에 실패')
    })

    it('GeminiRateLimitError가 올바른 이름과 메시지를 가진다', () => {
      const error = new GeminiRateLimitError()

      expect(error.name).toBe('GeminiRateLimitError')
      expect(error.message).toContain('요청 한도를 초과')
    })

    it('GeminiTokenLimitError가 올바른 이름과 메시지를 가진다', () => {
      const error = new GeminiTokenLimitError()

      expect(error.name).toBe('GeminiTokenLimitError')
      expect(error.message).toContain('토큰 제한을 초과')
    })

    it('GeminiTimeoutError가 올바른 이름과 메시지를 가진다', () => {
      const error = new GeminiTimeoutError()

      expect(error.name).toBe('GeminiTimeoutError')
      expect(error.message).toContain('요청 시간이 초과')
    })

    it('커스텀 메시지를 설정할 수 있다', () => {
      const customMessage = '커스텀 에러 메시지'
      const error = new GeminiAPIKeyMissingError(customMessage)

      expect(error.message).toBe(customMessage)
    })
  })

  describe('parseGeminiError', () => {
    it('GeminiAPIKeyMissingError를 올바르게 파싱한다', () => {
      const error = new GeminiAPIKeyMissingError()
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.API_KEY_MISSING)
      expect(parsed.message).toContain('GEMINI_API_KEY')
      expect(parsed.originalError).toBe(error)
    })

    it('GeminiNetworkError를 올바르게 파싱한다', () => {
      const error = new GeminiNetworkError()
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.NETWORK_ERROR)
      expect(parsed.message).toContain('네트워크 연결')
    })

    it('GeminiRateLimitError를 올바르게 파싱한다', () => {
      const error = new GeminiRateLimitError()
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.RATE_LIMIT_ERROR)
      expect(parsed.message).toContain('요청 한도')
    })

    it('GeminiTokenLimitError를 올바르게 파싱한다', () => {
      const error = new GeminiTokenLimitError()
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.TOKEN_LIMIT_ERROR)
      expect(parsed.message).toContain('토큰')
    })

    it('GeminiTimeoutError를 올바르게 파싱한다', () => {
      const error = new GeminiTimeoutError()
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.TIMEOUT_ERROR)
      expect(parsed.message).toContain('시간이 초과')
    })

    it('API 키 관련 Error 메시지를 API_KEY_INVALID로 파싱한다', () => {
      const error = new Error('Invalid API key provided')
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.API_KEY_INVALID)
      expect(parsed.statusCode).toBe(401)
    })

    it('레이트 리미트 Error 메시지를 RATE_LIMIT_ERROR로 파싱한다', () => {
      const error = new Error('Rate limit exceeded (429)')
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.RATE_LIMIT_ERROR)
      expect(parsed.statusCode).toBe(429)
    })

    it('토큰 제한 Error 메시지를 TOKEN_LIMIT_ERROR로 파싱한다', () => {
      const error = new Error('Token limit exceeded')
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.TOKEN_LIMIT_ERROR)
    })

    it('타임아웃 Error 메시지를 TIMEOUT_ERROR로 파싱한다', () => {
      const error = new Error('Request timeout')
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.TIMEOUT_ERROR)
    })

    it('네트워크 Error 메시지를 NETWORK_ERROR로 파싱한다', () => {
      const error = new Error('Network error: ECONNREFUSED')
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.NETWORK_ERROR)
    })

    it('일반 Error를 UNKNOWN_ERROR로 파싱한다', () => {
      const error = new Error('Something went wrong')
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.UNKNOWN_ERROR)
      expect(parsed.message).toContain('Something went wrong')
    })

    it('Error가 아닌 객체를 UNKNOWN_ERROR로 파싱한다', () => {
      const error = { message: 'Not an Error object' }
      const parsed = parseGeminiError(error)

      expect(parsed.type).toBe(GeminiErrorType.UNKNOWN_ERROR)
      expect(parsed.message).toContain('알 수 없는 에러')
    })

    it('null/undefined를 UNKNOWN_ERROR로 파싱한다', () => {
      const parsed1 = parseGeminiError(null)
      const parsed2 = parseGeminiError(undefined)

      expect(parsed1.type).toBe(GeminiErrorType.UNKNOWN_ERROR)
      expect(parsed2.type).toBe(GeminiErrorType.UNKNOWN_ERROR)
    })
  })
})

