// app/api-test/actions.ts
// Gemini API 테스트를 위한 Server Actions
// 클라이언트에서 호출하여 Gemini API 테스트 실행
// Related: app/api-test/page.tsx, lib/gemini/client.ts

'use server'

import { generateText, hasApiKey } from '@/lib/gemini/client'
import type { GenerateContentConfig } from '@/lib/gemini/types'

export interface TestResult {
  success: boolean
  text?: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  generationTime?: number
  error?: string
}

/**
 * Gemini API를 테스트합니다
 */
export async function testGeminiAPI(
  prompt: string,
  config?: GenerateContentConfig
): Promise<TestResult> {
  try {
    // API 키 확인
    if (!hasApiKey()) {
      return {
        success: false,
        error: 'API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요.',
      }
    }

    // 프롬프트 검증
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: '프롬프트를 입력해주세요.',
      }
    }

    // API 호출
    const response = await generateText(prompt, config)

    return {
      success: true,
      text: response.text,
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      generationTime: response.generationTime,
    }
  } catch (error) {
    console.error('Gemini API 테스트 오류:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 오류가 발생했습니다.'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * API 키 설정 상태를 확인합니다
 */
export async function checkApiKeyStatus(): Promise<{
  hasKey: boolean
  message: string
}> {
  const hasKey = hasApiKey()
  
  return {
    hasKey,
    message: hasKey
      ? 'API 키가 정상적으로 설정되어 있습니다.'
      : 'API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요.',
  }
}

