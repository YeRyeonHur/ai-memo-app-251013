// lib/gemini/test-connection.ts
// Gemini API 연결 테스트 유틸리티
// API 키 검증 및 기본 연결 테스트
// Related: lib/gemini/client.ts, lib/gemini/errors.ts, lib/gemini/types.ts

import { generateText, hasApiKey } from './client'
import { parseGeminiError, logGeminiError } from './errors'
import type { ConnectionTestResult } from './types'

/**
 * Gemini API 연결을 테스트합니다
 * 간단한 프롬프트로 API 호출을 시도하고 성공 여부를 반환합니다
 * 
 * @param timeout - 타임아웃 시간 (ms), 기본값: 10000 (10초)
 * @returns 연결 테스트 결과
 * 
 * @example
 * ```typescript
 * const result = await testGeminiConnection()
 * if (result.success) {
 *   console.log('연결 성공:', result.testResponse)
 * } else {
 *   console.error('연결 실패:', result.error)
 * }
 * ```
 */
export async function testGeminiConnection(
  timeout: number = 10000
): Promise<ConnectionTestResult> {
  const startTime = Date.now()

  try {
    // 1. API 키 확인
    if (!hasApiKey()) {
      return {
        success: false,
        error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.',
        responseTime: Date.now() - startTime,
      }
    }

    // 2. 타임아웃 설정
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, timeout)
    })

    // 3. 간단한 텍스트 생성 테스트
    const testPromise = generateText('Hello', {
      temperature: 0.7,
      maxOutputTokens: 50,
    })

    // 4. 타임아웃과 함께 실행
    const response = await Promise.race([testPromise, timeoutPromise])

    const responseTime = Date.now() - startTime

    // 5. 성공
    return {
      success: true,
      responseTime,
      testResponse: response.text,
    }
  } catch (error) {
    // 6. 에러 처리
    const geminiError = parseGeminiError(error)
    logGeminiError(geminiError, 'Connection Test')

    return {
      success: false,
      error: geminiError.message,
      responseTime: Date.now() - startTime,
    }
  }
}

/**
 * API 키가 유효한지 검증합니다 (간단한 테스트 호출)
 * @returns API 키 유효성 여부
 */
export async function validateApiKey(): Promise<boolean> {
  const result = await testGeminiConnection()
  return result.success
}

