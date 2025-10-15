// app/notes/ai-actions.ts
// 노트 AI 관련 Server Actions
// 요약 생성, 태그 생성 등의 AI 기능 처리
// Related: lib/gemini/client.ts, lib/gemini/prompts.ts, drizzle/schema.ts

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes, summaries, tags, type Summary, type Tag } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { generateText } from '@/lib/gemini/client'
import { createSummaryPrompt, createTagsPrompt, createSummaryWithStylePrompt, createTagsWithCountPrompt } from '@/lib/gemini/prompts'
import { parseGeminiError } from '@/lib/gemini/errors'
import { truncateToTokenLimit, validatePrompt, parseTagsFromText } from '@/lib/gemini/utils'

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

interface GenerateTagsResult {
  success: boolean
  error?: string
  tags?: string[]
}

interface GetTagsResult {
  success: boolean
  error?: string
  tags?: Tag[]
}

interface UpdateTagsResult {
  success: boolean
  error?: string
}

interface GenerateSummaryWithStyleResult {
  success: boolean
  error?: string
  summary?: string
  style?: string
  length?: string
}

interface GenerateTagsWithCountResult {
  success: boolean
  error?: string
  tags?: string[]
  count?: number
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

/**
 * 노트 태그를 생성합니다
 * Gemini API를 사용하여 노트 내용을 분석하고 3-6개의 태그를 자동 생성합니다
 * 
 * @param noteId - 태그를 생성할 노트 ID
 * @returns 태그 생성 결과
 */
export async function generateTags(noteId: string): Promise<GenerateTagsResult> {
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

    // 4. 노트 내용 토큰 제한 체크 및 자동 잘림
    let contentToTag = note.content
    const validation = validatePrompt(contentToTag, 7000)
    
    if (!validation.valid) {
      contentToTag = truncateToTokenLimit(contentToTag, 7000)
    }

    // 5. Gemini API 호출 (태그 생성)
    const prompt = createTagsPrompt(contentToTag)
    
    const response = await generateText(prompt, {
      temperature: 0.5, // 창의성과 일관성의 균형
      maxOutputTokens: 100, // 태그는 매우 짧게
    })

    // 6. 태그 결과 파싱 및 검증
    const tagsText = response.text.trim()
    
    if (!tagsText || tagsText.length === 0) {
      return {
        success: false,
        error: '태그를 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 7. 태그 파싱 및 정규화
    const parsedTags = parseTagsFromText(tagsText)

    if (parsedTags.length === 0) {
      return {
        success: false,
        error: '유효한 태그를 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 8. 기존 태그 삭제 후 새 태그 삽입 (배치)
    await db.delete(tags).where(and(eq(tags.noteId, noteId), eq(tags.userId, user.id)))

    const tagsToInsert = parsedTags.map((tag) => ({
      noteId: note.id,
      userId: user.id,
      tag,
      model: 'gemini-2.0-flash' as const,
    }))

    await db.insert(tags).values(tagsToInsert)

    // 9. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    // 10. 성공 결과 반환
    return {
      success: true,
      tags: parsedTags,
    }
  } catch (error) {
    // 에러 처리
    console.error('태그 생성 실패:', error)
    
    const geminiError = parseGeminiError(error)
    return {
      success: false,
      error: geminiError.message,
    }
  }
}

/**
 * 노트의 모든 태그를 조회합니다
 * 
 * @param noteId - 조회할 노트 ID
 * @returns 태그 조회 결과
 */
export async function getTags(noteId: string): Promise<GetTagsResult> {
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

    // 4. 모든 태그 조회
    const noteTags = await db
      .select()
      .from(tags)
      .where(and(eq(tags.noteId, noteId), eq(tags.userId, user.id)))
      .orderBy(desc(tags.createdAt))

    // 5. 태그 반환 (없으면 빈 배열)
    return {
      success: true,
      tags: noteTags,
    }
  } catch (error) {
    console.error('태그 조회 실패:', error)
    return {
      success: false,
      error: '태그를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

/**
 * 노트의 태그를 업데이트합니다
 * 기존 태그를 삭제하고 새로운 태그로 교체합니다
 * 
 * @param noteId - 업데이트할 노트 ID
 * @param newTags - 새로운 태그 배열
 * @returns 업데이트 결과
 */
export async function updateTags(noteId: string, newTags: string[]): Promise<UpdateTagsResult> {
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

    // 4. 태그 정규화 및 중복 제거
    const normalizedTags = newTags
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .slice(0, 6)

    // 5. 기존 태그 삭제
    await db.delete(tags).where(and(eq(tags.noteId, noteId), eq(tags.userId, user.id)))

    // 6. 새 태그가 있으면 삽입
    if (normalizedTags.length > 0) {
      const tagsToInsert = normalizedTags.map((tag) => ({
        noteId: note.id,
        userId: user.id,
        tag,
        model: 'gemini-2.0-flash' as const,
      }))

      await db.insert(tags).values(tagsToInsert)
    }

    // 7. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    // 8. 성공 결과 반환
    return {
      success: true,
    }
  } catch (error) {
    console.error('태그 업데이트 실패:', error)
    return {
      success: false,
      error: '태그를 업데이트하는데 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

/**
 * 스타일과 길이를 지정하여 노트 요약을 생성합니다
 * 
 * @param noteId - 요약할 노트 ID
 * @param style - 요약 스타일 ('bullet' | 'numbered' | 'paragraph' | 'keywords')
 * @param length - 요약 길이 ('short' | 'medium' | 'detailed')
 * @returns 스타일별 요약 생성 결과
 */
export async function generateSummaryWithStyle(
  noteId: string,
  style: 'bullet' | 'numbered' | 'paragraph' | 'keywords',
  length: 'short' | 'medium' | 'detailed'
): Promise<GenerateSummaryWithStyleResult> {
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

    // 4. 노트 내용 토큰 제한 체크 및 자동 잘림
    let contentToSummarize = note.content
    const validation = validatePrompt(contentToSummarize, 7000)
    
    if (!validation.valid) {
      contentToSummarize = truncateToTokenLimit(contentToSummarize, 7000)
    }

    // 5. Gemini API 호출 (스타일별 요약 생성)
    const prompt = createSummaryWithStylePrompt(contentToSummarize, style, length)
    
    const response = await generateText(prompt, {
      temperature: 0.3,
      maxOutputTokens: 800, // 스타일별 요약은 더 길 수 있음
    })

    // 6. 요약 결과 파싱 및 검증
    const summaryText = response.text.trim()
    
    if (!summaryText || summaryText.length === 0) {
      return {
        success: false,
        error: '요약을 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 7. summaries 테이블에 저장
    const [savedSummary] = await db
      .insert(summaries)
      .values({
        noteId: note.id,
        userId: user.id,
        summary: summaryText,
        model: 'gemini-2.0-flash',
      })
      .returning()

    // 8. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    // 9. 성공 결과 반환
    return {
      success: true,
      summary: savedSummary.summary,
      style,
      length,
    }
  } catch (error) {
    console.error('스타일별 요약 생성 실패:', error)
    
    const geminiError = parseGeminiError(error)
    return {
      success: false,
      error: geminiError.message,
    }
  }
}

/**
 * 태그 개수를 지정하여 노트 태그를 생성합니다
 * 
 * @param noteId - 태그를 생성할 노트 ID
 * @param count - 생성할 태그 개수 (3 | 6 | 9)
 * @returns 개수별 태그 생성 결과
 */
export async function generateTagsWithCount(
  noteId: string,
  count: 3 | 6 | 9
): Promise<GenerateTagsWithCountResult> {
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

    // 4. 노트 내용 토큰 제한 체크 및 자동 잘림
    let contentToTag = note.content
    const validation = validatePrompt(contentToTag, 7000)
    
    if (!validation.valid) {
      contentToTag = truncateToTokenLimit(contentToTag, 7000)
    }

    // 5. Gemini API 호출 (개수별 태그 생성)
    const prompt = createTagsWithCountPrompt(contentToTag, count)
    
    const response = await generateText(prompt, {
      temperature: 0.5,
      maxOutputTokens: 150, // 태그 개수가 많을 수 있음
    })

    // 6. 태그 결과 파싱 및 검증
    const tagsText = response.text.trim()
    
    if (!tagsText || tagsText.length === 0) {
      return {
        success: false,
        error: '태그를 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 7. 태그 파싱 및 정규화
    const parsedTags = parseTagsFromText(tagsText, count)

    if (parsedTags.length === 0) {
      return {
        success: false,
        error: '유효한 태그를 생성할 수 없습니다. 다시 시도해주세요.',
      }
    }

    // 8. 기존 태그 삭제 후 새 태그 삽입
    await db.delete(tags).where(and(eq(tags.noteId, noteId), eq(tags.userId, user.id)))

    const tagsToInsert = parsedTags.map((tag) => ({
      noteId: note.id,
      userId: user.id,
      tag,
      model: 'gemini-2.0-flash' as const,
    }))

    await db.insert(tags).values(tagsToInsert)

    // 9. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    // 10. 성공 결과 반환
    return {
      success: true,
      tags: parsedTags,
      count,
    }
  } catch (error) {
    console.error('개수별 태그 생성 실패:', error)
    
    const geminiError = parseGeminiError(error)
    return {
      success: false,
      error: geminiError.message,
    }
  }
}

