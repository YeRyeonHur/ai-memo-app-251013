// lib/gemini/client.ts
// Gemini API 클라이언트 초기화 및 관리
// GoogleGenAI 인스턴스 생성 및 환경변수 검증
// Related: lib/gemini/types.ts, lib/gemini/errors.ts

import { GoogleGenAI } from '@google/genai'
import { GeminiAPIKeyMissingError } from './errors'
import type { GenerateContentConfig, GeminiResponse } from './types'

/**
 * Gemini API 클라이언트 인스턴스 (싱글톤)
 */
let geminiClientInstance: GoogleGenAI | null = null

/**
 * Gemini API 클라이언트를 초기화합니다
 * 환경변수에서 API 키를 로드하고 GoogleGenAI 인스턴스를 생성합니다
 * 
 * @throws {GeminiAPIKeyMissingError} API 키가 설정되지 않은 경우
 * @returns GoogleGenAI 클라이언트 인스턴스
 * 
 * @example
 * ```typescript
 * const client = initGeminiClient()
 * const response = await client.models.generateContent({
 *   model: 'gemini-2.0-flash',
 *   contents: 'Hello, Gemini!'
 * })
 * ```
 */
export function initGeminiClient(): GoogleGenAI {
  // 이미 초기화된 인스턴스가 있으면 재사용 (싱글톤 패턴)
  if (geminiClientInstance) {
    return geminiClientInstance
  }

  // 환경변수에서 API 키 로드
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new GeminiAPIKeyMissingError(
      'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일에 API 키를 추가해주세요.'
    )
  }

  // GoogleGenAI 클라이언트 초기화
  geminiClientInstance = new GoogleGenAI({ apiKey })

  return geminiClientInstance
}

/**
 * 기존 클라이언트 인스턴스를 가져옵니다
 * 초기화되지 않았다면 새로 초기화합니다
 * 
 * @returns GoogleGenAI 클라이언트 인스턴스
 */
export function getGeminiClient(): GoogleGenAI {
  return geminiClientInstance || initGeminiClient()
}

/**
 * 클라이언트 인스턴스를 재설정합니다 (테스트용)
 * @internal
 */
export function resetGeminiClient(): void {
  geminiClientInstance = null
}

/**
 * Gemini API로 텍스트를 생성합니다
 * 
 * @param prompt - 입력 프롬프트
 * @param config - 생성 설정 (선택)
 * @returns 생성된 텍스트 응답
 * 
 * @example
 * ```typescript
 * const response = await generateText('안녕하세요', {
 *   temperature: 0.7,
 *   maxOutputTokens: 1024
 * })
 * console.log(response.text)
 * ```
 */
export async function generateText(
  prompt: string,
  config?: GenerateContentConfig
): Promise<GeminiResponse> {
  const client = getGeminiClient()
  const startTime = Date.now()

  // 기본 모델 설정
  const model = 'gemini-2.0-flash'

  // API 호출
  const result = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: config?.maxOutputTokens ?? 2048,
      topK: config?.topK,
      topP: config?.topP,
    },
  })

  const endTime = Date.now()

  // 응답 텍스트 추출
  const text = result.text || ''

  // 토큰 사용량 추출 (usageMetadata가 있는 경우)
  const usageMetadata = (result as any).usageMetadata
  const inputTokens = usageMetadata?.promptTokenCount
  const outputTokens = usageMetadata?.candidatesTokenCount
  const totalTokens = usageMetadata?.totalTokenCount

  return {
    text,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    generationTime: endTime - startTime,
  }
}

/**
 * API 키가 설정되어 있는지 확인합니다
 * @returns API 키 존재 여부
 */
export function hasApiKey(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
}

