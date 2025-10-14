// app/notes/ai-actions.ts
// 노트 AI 관련 Server Actions
// 요약 생성, 태그 생성 등의 AI 기능 처리
// Related: lib/gemini/client.ts, lib/gemini/prompts.ts, drizzle/schema.ts

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes, summaries, type Summary } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { generateText } from '@/lib/gemini/client'
import { createSummaryPrompt } from '@/lib/gemini/prompts'
import { parseGeminiError } from '@/lib/gemini/errors'
import { truncateToTokenLimit, validatePrompt } from '@/lib/gemini/utils'

interface GenerateSummaryResult {
  success: boolean
  error?: string
  summary?: string
  cached?: boolean
}

interface GetSummaryResult {
  success: boolean
  error?: string
  summary?: Summary | null
}

/**
 * 노트 요약을 생성합니다
 * 5분 이내에 생성된 요약이 있으면 재사용하고, 없으면 새로 생성합니다
 * 
 * @param noteId - 요약할 노트 ID
 * @returns 요약 생성 결과
 */
export async function generateSummary(noteId: string): Promise<GenerateSummaryResult> {
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

    // 2. noteId 유효성 검증
    if (!noteId || noteId.trim().length === 0) {
      return {
        success: false,
        error: '노트 ID가 유효하지 않습니다.',
      }
    }

    // 3. 노트 조회 (권한 검증 포함)
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 접근 권한이 없습니다.',
      }
    }

    // 4. 기존 요약 확인 (5분 이내 생성된 요약이 있으면 재사용)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const [existingSummary] = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.noteId, noteId),
          eq(summaries.userId, user.id)
        )
      )
      .orderBy(desc(summaries.createdAt))
      .limit(1)

    if (existingSummary && existingSummary.createdAt > fiveMinutesAgo) {
      return {
        success: true,
        summary: existingSummary.summary,
        cached: true,
      }
    }

    // 5. 노트 내용 토큰 제한 체크 및 자동 잘림
    let contentToSummarize = note.content
    const validation = validatePrompt(contentToSummarize, 7000) // 프롬프트 + 응답 여유 고려
    
    if (!validation.valid) {
      // 토큰 제한 초과 시 자동 잘림
      contentToSummarize = truncateToTokenLimit(contentToSummarize, 7000)
    }

    // 6. Gemini API 호출 (요약 생성)
    const prompt = createSummaryPrompt(contentToSummarize)
    
    const response = await generateText(prompt, {
      temperature: 0.3, // 일관성 높은 요약
      maxOutputTokens: 500, // 요약은 짧게
    })

    // 7. 요약 결과 파싱 및 검증
    const summaryText = response.text.trim()
    
    if (!summaryText || summaryText.length === 0) {
      return {
        success: false,
        error: '요약을 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 8. summaries 테이블에 저장
    const [savedSummary] = await db
      .insert(summaries)
      .values({
        noteId: note.id,
        userId: user.id,
        summary: summaryText,
        model: 'gemini-2.0-flash',
      })
      .returning()

    // 9. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    // 10. 성공 결과 반환
    return {
      success: true,
      summary: savedSummary.summary,
      cached: false,
    }
  } catch (error) {
    // 에러 처리
    console.error('요약 생성 실패:', error)
    
    const geminiError = parseGeminiError(error)
    return {
      success: false,
      error: geminiError.message,
    }
  }
}

/**
 * 노트의 최신 요약을 조회합니다
 * 
 * @param noteId - 조회할 노트 ID
 * @returns 요약 조회 결과
 */
export async function getSummary(noteId: string): Promise<GetSummaryResult> {
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

    // 2. noteId 유효성 검증
    if (!noteId || noteId.trim().length === 0) {
      return {
        success: false,
        error: '노트 ID가 유효하지 않습니다.',
      }
    }

    // 3. 노트 권한 검증
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 접근 권한이 없습니다.',
      }
    }

    // 4. 최신 요약 조회
    const [summary] = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.noteId, noteId),
          eq(summaries.userId, user.id)
        )
      )
      .orderBy(desc(summaries.createdAt))
      .limit(1)

    // 5. 요약이 없으면 null 반환
    return {
      success: true,
      summary: summary || null,
    }
  } catch (error) {
    console.error('요약 조회 실패:', error)
    return {
      success: false,
      error: '요약을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

