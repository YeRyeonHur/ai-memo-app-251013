// app/notes/autocomplete-actions.ts
// AI 자동완성 관련 Server Actions
// Gemini API를 활용한 자동완성 제안 생성 및 사용자 패턴 분석
// Related: lib/gemini/client.ts, lib/gemini/prompts.ts, lib/utils/user-patterns.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { generateText } from '@/lib/gemini/client'
import { createAutocompletePrompt } from '@/lib/gemini/prompts'
import { parseGeminiError } from '@/lib/gemini/errors'
import { truncateToTokenLimit, validatePrompt } from '@/lib/gemini/utils'
// 사용자 패턴 분석 기능 제거됨
import type { AutocompleteSuggestion } from '@/components/ui/autocomplete'

interface GenerateAutocompleteSuggestionResult {
  success: boolean
  error?: string
  suggestions?: AutocompleteSuggestion[]
}


/**
 * AI 자동완성 제안을 생성합니다
 * 사용자의 입력 텍스트와 컨텍스트를 기반으로 다음 문장이나 단어를 제안합니다
 * 
 * @param inputText - 사용자가 입력한 텍스트
 * @param context - 노트의 제목이나 기존 내용 (컨텍스트)
 * @returns 자동완성 제안 결과
 */
export async function generateAutocompleteSuggestion(
  inputText: string,
  context: string = ''
): Promise<GenerateAutocompleteSuggestionResult> {
  console.log('🎯 generateAutocompleteSuggestion 호출:', { inputText, context })
  
  try {
    // 1. 인증 사용자 확인
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.',
      }
    }

    // 2. 입력값 유효성 검증
    if (!inputText || inputText.trim().length === 0) {
      return {
        success: false,
        error: '입력 텍스트가 필요합니다.',
      }
    }

    // 3. 사용자 패턴 분석 기능 제거됨
    const userPattern = null

    // 4. 입력 텍스트 토큰 제한 체크 및 자동 잘림
    let textToProcess = inputText
    const validation = validatePrompt(textToProcess, 6000) // 프롬프트 + 응답 여유 고려
    
    if (!validation.valid) {
      textToProcess = truncateToTokenLimit(textToProcess, 6000)
    }

    // 5. Gemini API 호출 (자동완성 제안 생성)
    const prompt = createAutocompletePrompt(textToProcess, context)
    console.log('📝 생성된 프롬프트:', prompt)
    
    const response = await generateText(prompt, {
      temperature: 0.7, // 창의성과 일관성의 균형
      maxOutputTokens: 300, // 자동완성 제안은 적당한 길이
    })
    
    console.log('🤖 Gemini API 응답:', response)

    // 6. 제안 결과 파싱 및 검증
    const suggestionsText = response.text.trim()
    
    if (!suggestionsText || suggestionsText.length === 0) {
      return {
        success: false,
        error: '자동완성 제안을 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 7. 제안 파싱 및 정규화
    const suggestions = parseAutocompleteSuggestions(suggestionsText)

    if (suggestions.length === 0) {
      return {
        success: false,
        error: '유효한 자동완성 제안을 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 8. 성공 결과 반환
    return {
      success: true,
      suggestions,
    }
  } catch (error) {
    // 에러 처리
    console.error('자동완성 제안 생성 실패:', error)
    
    const geminiError = parseGeminiError(error)
    return {
      success: false,
      error: geminiError.message,
    }
  }
}


/**
 * 자동완성 제안 텍스트를 파싱하여 구조화된 제안 배열로 변환합니다
 * 
 * @param suggestionsText - Gemini API에서 반환된 제안 텍스트
 * @returns 구조화된 자동완성 제안 배열
 */
function parseAutocompleteSuggestions(suggestionsText: string): AutocompleteSuggestion[] {
  const suggestions: AutocompleteSuggestion[] = []
  
  try {
    // 제안 텍스트를 줄바꿈으로 분리
    const lines = suggestionsText.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < lines.length && i < 3; i++) {
      const line = lines[i].trim()
      
      // 제안 형식 파싱: "제안텍스트 [타입] (신뢰도%)"
      const match = line.match(/^(.+?)\s*\[(word|phrase|sentence)\]\s*\((\d+)%\)$/)
      
      if (match) {
        const [, text, type, confidenceStr] = match
        const confidence = parseInt(confidenceStr, 10) / 100
        
        suggestions.push({
          id: `suggestion-${i + 1}`,
          text: text.trim(),
          confidence: Math.max(0, Math.min(1, confidence)), // 0-1 범위로 정규화
          type: type as 'word' | 'phrase' | 'sentence',
        })
      } else {
        // 형식이 맞지 않는 경우 기본값으로 처리
        suggestions.push({
          id: `suggestion-${i + 1}`,
          text: line,
          confidence: 0.7, // 기본 신뢰도
          type: 'phrase',
        })
      }
    }
  } catch (error) {
    console.error('자동완성 제안 파싱 실패:', error)
  }
  
  return suggestions
}

