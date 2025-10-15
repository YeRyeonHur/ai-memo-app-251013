// lib/gemini/types.ts
// Gemini API 관련 TypeScript 타입 정의
// API 응답, 설정, 에러 타입을 정의하여 타입 안전성 제공
// Related: lib/gemini/client.ts, lib/gemini/errors.ts

/**
 * Gemini API 응답 타입
 */
export interface GeminiResponse {
  /** 생성된 텍스트 응답 */
  text: string
  /** 사용된 모델명 */
  model?: string
  /** 입력 토큰 수 */
  inputTokens?: number
  /** 출력 토큰 수 */
  outputTokens?: number
  /** 총 토큰 수 */
  totalTokens?: number
  /** 응답 생성 시간 (ms) */
  generationTime?: number
}

/**
 * 텍스트 생성 설정
 */
export interface GenerateContentConfig {
  /** 샘플링 온도 (0.0 ~ 2.0, 높을수록 창의적) */
  temperature?: number
  /** 최대 출력 토큰 수 */
  maxOutputTokens?: number
  /** Top-K 샘플링 */
  topK?: number
  /** Top-P (nucleus) 샘플링 */
  topP?: number
  /** 타임아웃 (ms) */
  timeout?: number
}

/**
 * Gemini 에러 타입
 */
export interface GeminiError {
  /** 에러 타입 */
  type: GeminiErrorType
  /** 에러 메시지 (한국어) */
  message: string
  /** 원본 에러 (선택) */
  originalError?: unknown
  /** HTTP 상태 코드 (선택) */
  statusCode?: number
}

/**
 * Gemini 에러 타입 분류
 */
export enum GeminiErrorType {
  /** API 키 누락 */
  API_KEY_MISSING = 'API_KEY_MISSING',
  /** API 키 유효하지 않음 */
  API_KEY_INVALID = 'API_KEY_INVALID',
  /** 네트워크 에러 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 레이트 리미트 초과 */
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  /** 토큰 제한 초과 */
  TOKEN_LIMIT_ERROR = 'TOKEN_LIMIT_ERROR',
  /** 타임아웃 */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** 알 수 없는 에러 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 연결 테스트 결과
 */
export interface ConnectionTestResult {
  /** 연결 성공 여부 */
  success: boolean
  /** 에러 메시지 (실패 시) */
  error?: string
  /** 응답 시간 (ms) */
  responseTime?: number
  /** 테스트 응답 텍스트 (성공 시) */
  testResponse?: string
}

