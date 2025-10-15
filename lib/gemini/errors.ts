// lib/gemini/errors.ts
// Gemini API 에러 처리 유틸리티
// 커스텀 에러 클래스와 에러 파싱 함수 제공
// Related: lib/gemini/types.ts, lib/gemini/client.ts

import { GeminiError, GeminiErrorType } from './types'

/**
 * Gemini API 키 누락 에러
 */
export class GeminiAPIKeyMissingError extends Error {
  constructor(message = 'Gemini API 키가 설정되지 않았습니다.') {
    super(message)
    this.name = 'GeminiAPIKeyMissingError'
  }
}

/**
 * Gemini 네트워크 에러
 */
export class GeminiNetworkError extends Error {
  constructor(message = '네트워크 연결에 실패했습니다.') {
    super(message)
    this.name = 'GeminiNetworkError'
  }
}

/**
 * Gemini 레이트 리미트 에러
 */
export class GeminiRateLimitError extends Error {
  constructor(message = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.') {
    super(message)
    this.name = 'GeminiRateLimitError'
  }
}

/**
 * Gemini 토큰 제한 초과 에러
 */
export class GeminiTokenLimitError extends Error {
  constructor(message = '토큰 제한을 초과했습니다. 입력 텍스트를 줄여주세요.') {
    super(message)
    this.name = 'GeminiTokenLimitError'
  }
}

/**
 * Gemini 타임아웃 에러
 */
export class GeminiTimeoutError extends Error {
  constructor(message = '요청 시간이 초과되었습니다. 다시 시도해주세요.') {
    super(message)
    this.name = 'GeminiTimeoutError'
  }
}

/**
 * Gemini API 에러를 파싱하여 사용자 친화적인 에러 객체로 변환
 * @param error - 원본 에러 객체
 * @returns GeminiError - 파싱된 에러 정보
 */
export function parseGeminiError(error: unknown): GeminiError {
  // API 키 누락 에러
  if (error instanceof GeminiAPIKeyMissingError) {
    return {
      type: GeminiErrorType.API_KEY_MISSING,
      message: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.',
      originalError: error,
    }
  }

  // 네트워크 에러
  if (error instanceof GeminiNetworkError) {
    return {
      type: GeminiErrorType.NETWORK_ERROR,
      message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
      originalError: error,
    }
  }

  // 레이트 리미트 에러
  if (error instanceof GeminiRateLimitError) {
    return {
      type: GeminiErrorType.RATE_LIMIT_ERROR,
      message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      originalError: error,
    }
  }

  // 토큰 제한 초과 에러
  if (error instanceof GeminiTokenLimitError) {
    return {
      type: GeminiErrorType.TOKEN_LIMIT_ERROR,
      message: '입력 텍스트가 너무 깁니다. 8,000 토큰 이하로 줄여주세요.',
      originalError: error,
    }
  }

  // 타임아웃 에러
  if (error instanceof GeminiTimeoutError) {
    return {
      type: GeminiErrorType.TIMEOUT_ERROR,
      message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
      originalError: error,
    }
  }

  // Error 객체인 경우 메시지 파싱
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // API 키 관련 에러
    if (errorMessage.includes('api key') || errorMessage.includes('apikey') || errorMessage.includes('unauthorized')) {
      return {
        type: GeminiErrorType.API_KEY_INVALID,
        message: 'API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인해주세요.',
        originalError: error,
        statusCode: 401,
      }
    }

    // 레이트 리미트 에러 (429)
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
      return {
        type: GeminiErrorType.RATE_LIMIT_ERROR,
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        originalError: error,
        statusCode: 429,
      }
    }

    // 토큰 제한 에러
    if (errorMessage.includes('token') && (errorMessage.includes('limit') || errorMessage.includes('exceed'))) {
      return {
        type: GeminiErrorType.TOKEN_LIMIT_ERROR,
        message: '입력 텍스트가 너무 깁니다. 8,000 토큰 이하로 줄여주세요.',
        originalError: error,
      }
    }

    // 타임아웃 에러
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        type: GeminiErrorType.TIMEOUT_ERROR,
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        originalError: error,
      }
    }

    // 네트워크 에러
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound')
    ) {
      return {
        type: GeminiErrorType.NETWORK_ERROR,
        message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
        originalError: error,
      }
    }

    // 일반 Error 객체
    return {
      type: GeminiErrorType.UNKNOWN_ERROR,
      message: `알 수 없는 에러가 발생했습니다: ${error.message}`,
      originalError: error,
    }
  }

  // 알 수 없는 에러 타입
  return {
    type: GeminiErrorType.UNKNOWN_ERROR,
    message: '알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도해주세요.',
    originalError: error,
  }
}

/**
 * 에러 로깅 헬퍼 함수
 * @param error - 에러 객체
 * @param context - 에러 발생 컨텍스트
 */
export function logGeminiError(error: GeminiError, context?: string): void {
  const prefix = context ? `[Gemini API - ${context}]` : '[Gemini API]'
  console.error(`${prefix} ${error.type}:`, error.message)
  if (error.originalError) {
    console.error('Original error:', error.originalError)
  }
}

