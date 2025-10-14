// lib/gemini/utils.ts
// Gemini API 유틸리티 함수
// 프롬프트 검증 및 기타 헬퍼 함수
// Related: lib/gemini/client.ts, lib/gemini/types.ts

/**
 * 프롬프트가 비어있는지 확인합니다
 * @param prompt - 검증할 프롬프트
 * @returns 비어있으면 true
 */
export function isEmptyPrompt(prompt: string): boolean {
  return !prompt || prompt.trim().length === 0
}

/**
 * 프롬프트의 대략적인 토큰 수를 추정합니다
 * 영어: 1 토큰 ≈ 4자
 * 한국어/중국어/일본어: 1 토큰 ≈ 2자
 * 
 * @param text - 토큰 수를 추정할 텍스트
 * @returns 추정 토큰 수
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0

  // 한글, 한자, 일본어 문자 개수 확인
  const asianChars = (text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
  
  // 나머지 문자 개수
  const otherChars = text.length - asianChars

  // 추정 토큰 계산
  // 아시아 문자: 2자당 1토큰
  // 영어/기타: 4자당 1토큰
  const asianTokens = Math.ceil(asianChars / 2)
  const otherTokens = Math.ceil(otherChars / 4)

  return asianTokens + otherTokens
}

/**
 * 텍스트가 토큰 제한을 초과하는지 확인합니다
 * @param text - 확인할 텍스트
 * @param maxTokens - 최대 토큰 수 (기본값: 8000)
 * @returns 제한 초과 여부
 */
export function exceedsTokenLimit(text: string, maxTokens: number = 8000): boolean {
  const estimatedTokens = estimateTokenCount(text)
  return estimatedTokens > maxTokens
}

/**
 * 프롬프트를 검증합니다
 * @param prompt - 검증할 프롬프트
 * @param maxTokens - 최대 토큰 수 (기본값: 8000)
 * @returns 검증 결과 { valid: boolean, error?: string }
 */
export function validatePrompt(
  prompt: string,
  maxTokens: number = 8000
): { valid: boolean; error?: string } {
  // 빈 프롬프트 체크
  if (isEmptyPrompt(prompt)) {
    return {
      valid: false,
      error: '프롬프트가 비어있습니다.',
    }
  }

  // 토큰 제한 체크
  if (exceedsTokenLimit(prompt, maxTokens)) {
    const estimated = estimateTokenCount(prompt)
    return {
      valid: false,
      error: `프롬프트가 너무 깁니다. (추정: ${estimated} 토큰, 최대: ${maxTokens} 토큰)`,
    }
  }

  return { valid: true }
}

/**
 * 텍스트를 특정 토큰 수 이하로 자릅니다
 * @param text - 자를 텍스트
 * @param maxTokens - 최대 토큰 수
 * @returns 잘린 텍스트
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (!exceedsTokenLimit(text, maxTokens)) {
    return text
  }

  // 대략적으로 문자 수 계산
  const asianChars = (text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length
  const asianRatio = asianChars / text.length

  // 추정 문자 수 계산
  const estimatedChars = Math.floor(maxTokens * (2 * asianRatio + 4 * (1 - asianRatio)))

  // 텍스트 자르기
  return text.slice(0, estimatedChars) + '...'
}

/**
 * 환경변수에서 타임아웃 값을 가져옵니다
 * @returns 타임아웃 (ms)
 */
export function getTimeout(): number {
  const timeoutStr = process.env.GEMINI_TIMEOUT_MS
  if (timeoutStr) {
    const timeout = parseInt(timeoutStr, 10)
    if (!isNaN(timeout) && timeout > 0) {
      return timeout
    }
  }
  return 10000 // 기본값: 10초
}

/**
 * Gemini API 응답에서 태그를 파싱합니다
 * 쉼표로 구분된 문자열을 배열로 변환하고 정규화합니다
 * 
 * @param text - 파싱할 텍스트 (예: "태그1, 태그2, 태그3")
 * @returns 정규화된 태그 배열 (최대 6개)
 * 
 * @example
 * ```typescript
 * const tags = parseTagsFromText('개발, JavaScript, React')
 * // ['개발', 'javascript', 'react']
 * ```
 */
export function parseTagsFromText(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  return text
    .split(',')
    .map((tag) => tag.trim().toLowerCase()) // 공백 제거 및 소문자 변환
    .filter((tag) => tag.length > 0) // 빈 태그 제거
    .filter((tag, index, self) => self.indexOf(tag) === index) // 중복 제거
    .slice(0, 6) // 최대 6개
}

