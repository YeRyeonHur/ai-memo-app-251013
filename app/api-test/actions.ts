// app/api-test/actions.ts
// Gemini API 테스트용 Server Actions
// 개발 중 Gemini API 기능을 수동으로 테스트할 수 있는 기능 제공
// Related: lib/gemini/client.ts, lib/gemini/prompts.ts

'use server'

import { generateText } from '@/lib/gemini/client'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

interface TestGeminiAPIResult {
  success: boolean
  text?: string
  error?: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  generationTime?: number
}

interface CheckApiKeyResult {
  hasKey: boolean
  message: string
}

export async function testGeminiAPI(
  prompt: string,
  config?: {
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<TestGeminiAPIResult> {
  try {
    const startTime = Date.now()
    
    const response = await generateText(prompt, {
      temperature: config?.temperature || 0.7,
      maxOutputTokens: config?.maxOutputTokens || 2048,
    })

    const generationTime = Date.now() - startTime

    return {
      success: true,
      text: response.text,
      model: response.model,
      inputTokens: response.usage?.promptTokenCount,
      outputTokens: response.usage?.candidatesTokenCount,
      totalTokens: response.usage?.totalTokenCount,
      generationTime,
    }
  } catch (error) {
    console.error('Gemini API 테스트 실패:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}

export async function checkApiKeyStatus(): Promise<CheckApiKeyResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return {
        hasKey: false,
        message: '❌ API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.',
      }
    }

    if (apiKey.length < 20) {
      return {
        hasKey: false,
        message: '❌ API 키가 너무 짧습니다. 올바른 API 키인지 확인하세요.',
      }
    }

    return {
      hasKey: true,
      message: '✅ API 키가 정상적으로 설정되어 있습니다.',
    }
  } catch (error) {
    return {
      hasKey: false,
      message: `❌ API 키 확인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}

// 데이터베이스 연결 테스트 (추가 기능)
export async function testDatabaseConnection() {
  try {
    console.log('🔍 데이터베이스 연결 테스트 시작...')
    
    // 간단한 쿼리로 연결 테스트
    const result = await db.execute(sql`SELECT 1 as test`)
    
    console.log('✅ 데이터베이스 연결 성공:', result)
    
    return {
      success: true,
      message: '데이터베이스 연결 성공',
      result: result
    }
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error)
    
    return {
      success: false,
      message: '데이터베이스 연결 실패',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function testNotesTable() {
  try {
    console.log('🔍 notes 테이블 테스트 시작...')
    
    // notes 테이블 존재 확인
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notes'
    `)
    
    console.log('✅ notes 테이블 확인 결과:', result)
    
    return {
      success: true,
      message: 'notes 테이블 확인 성공',
      result: result
    }
  } catch (error) {
    console.error('❌ notes 테이블 확인 실패:', error)
    
    return {
      success: false,
      message: 'notes 테이블 확인 실패',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}