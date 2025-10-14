// app/notes/actions.ts
// 노트 관련 Server Actions
// 노트 생성, 수정, 삭제 등의 서버 사이드 비즈니스 로직 처리
// Related: drizzle/schema.ts, lib/db/index.ts, app/notes/new/note-form.tsx

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { notes, type Note } from '@/drizzle/schema'
import { eq, desc, asc, count, and } from 'drizzle-orm'

interface CreateNoteResult {
  success: boolean
  error?: string
  noteId?: string
}

interface GetNotesResult {
  success: boolean
  error?: string
  notes?: Note[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalNotes: number
    pageSize: number
  }
}

interface GetNoteByIdResult {
  success: boolean
  error?: string
  note?: Note | null
}

interface UpdateNoteResult {
  success: boolean
  error?: string
  note?: Note
}

interface DeleteNoteResult {
  success: boolean
  error?: string
}

interface DeleteAllNotesResult {
  success: boolean
  error?: string
  deletedCount?: number
}

interface CreateSampleNotesResult {
  success: boolean
  error?: string
  count?: number
}

export type SortOption = 'newest' | 'oldest' | 'title' | 'updated'

export async function createNote(
  title: string,
  content: string
): Promise<CreateNoteResult> {
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

    // 2. 입력 데이터 유효성 검증
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: '제목을 입력해주세요.',
      }
    }

    if (title.length > 200) {
      return {
        success: false,
        error: '제목은 200자 이하로 입력해주세요.',
      }
    }

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: '본문을 입력해주세요.',
      }
    }

    // 3. Drizzle ORM을 사용하여 notes 테이블에 삽입
    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: title.trim(),
        content: content.trim(),
        // createdAt, updatedAt은 defaultNow()로 자동 설정
      })
      .returning({ id: notes.id })

    // 4. 캐시 무효화 및 리다이렉트
    revalidatePath('/notes')
    
    return {
      success: true,
      noteId: newNote.id,
    }
  } catch (error) {
    console.error('노트 생성 실패:', error)
    return {
      success: false,
      error: '노트 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

export async function getNotes(
  page: number = 1,
  sortBy: SortOption = 'newest'
): Promise<GetNotesResult> {
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

    // 2. 페이지 번호 유효성 검증
    const pageNumber = Math.max(1, Math.floor(page))
    const pageSize = 20
    const offset = (pageNumber - 1) * pageSize

    // 3. 정렬 옵션에 따른 orderBy 절 결정
    let orderByClause
    switch (sortBy) {
      case 'oldest':
        orderByClause = asc(notes.createdAt)
        break
      case 'title':
        orderByClause = asc(notes.title)
        break
      case 'updated':
        orderByClause = desc(notes.updatedAt)
        break
      case 'newest':
      default:
        orderByClause = desc(notes.createdAt)
        break
    }

    // 4. 전체 노트 개수 조회
    const [{ value: totalNotes }] = await db
      .select({ value: count() })
      .from(notes)
      .where(eq(notes.userId, user.id))

    // 5. 노트 목록 조회 (페이지네이션 + 정렬)
    const notesList = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset)

    // 6. 페이지네이션 메타데이터 계산
    const totalPages = Math.ceil(totalNotes / pageSize)

    return {
      success: true,
      notes: notesList,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalNotes,
        pageSize,
      },
    }
  } catch (error) {
    console.error('노트 목록 조회 실패:', error)
    return {
      success: false,
      error: '노트 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

export async function getNoteById(noteId: string): Promise<GetNoteByIdResult> {
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

    // 2. 노트 단건 조회 (id와 user_id로 필터링)
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    // 3. 노트가 없으면 null 반환
    if (!note) {
      return {
        success: true,
        note: null,
      }
    }

    return {
      success: true,
      note,
    }
  } catch (error) {
    console.error('노트 조회 실패:', error)
    return {
      success: false,
      error: '노트를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

export async function updateNote(
  noteId: string,
  title: string,
  content: string
): Promise<UpdateNoteResult> {
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

    // 2. 입력 데이터 유효성 검증
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: '제목을 입력해주세요.',
      }
    }

    if (title.length > 200) {
      return {
        success: false,
        error: '제목은 200자 이하로 입력해주세요.',
      }
    }

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: '본문을 입력해주세요.',
      }
    }

    // 3. Drizzle ORM으로 노트 업데이트 (id와 user_id로 필터링)
    const [updatedNote] = await db
      .update(notes)
      .set({
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .returning()

    // 4. 노트가 없거나 권한이 없으면 에러 반환
    if (!updatedNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 수정 권한이 없습니다.',
      }
    }

    // 5. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    return {
      success: true,
      note: updatedNote,
    }
  } catch (error) {
    console.error('노트 수정 실패:', error)
    return {
      success: false,
      error: '노트 수정에 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

export async function deleteNote(noteId: string): Promise<DeleteNoteResult> {
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

    // 2. Drizzle ORM으로 노트 삭제 (id와 user_id로 필터링)
    const [deletedNote] = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .returning()

    // 3. 노트가 없거나 권한이 없으면 에러 반환
    if (!deletedNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 삭제 권한이 없습니다.',
      }
    }

    // 4. 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('노트 삭제 실패:', error)
    return {
      success: false,
      error: '노트 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

/**
 * 모든 노트 삭제 (현재 사용자의 노트만)
 * @returns DeleteAllNotesResult - 성공 여부와 삭제된 노트 개수
 */
export async function deleteAllNotes(): Promise<DeleteAllNotesResult> {
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

    // 2. 현재 사용자의 모든 노트 삭제
    const deletedNotes = await db
      .delete(notes)
      .where(eq(notes.userId, user.id))
      .returning()

    // 3. 캐시 무효화
    revalidatePath('/notes')

    return {
      success: true,
      deletedCount: deletedNotes.length,
    }
  } catch (error) {
    console.error('노트 전체 삭제 실패:', error)
    return { success: false, error: '노트 삭제에 실패했습니다.' }
  }
}

const SAMPLE_NOTES = [
  {
    title: '🌟 AI 메모장 사용 가이드',
    content: `AI 메모장에 오신 것을 환영합니다!

이 메모장은 여러분의 생각과 아이디어를 쉽고 빠르게 기록하고, AI가 자동으로 정리해주는 스마트한 도구입니다.

주요 기능:
- 📝 텍스트 메모: 언제 어디서나 빠르게 생각을 기록하세요
- 🎙️ 음성 메모: 말로 하면 자동으로 텍스트로 변환됩니다 (향후 제공)
- 🤖 AI 요약: 긴 메모도 핵심만 간추려 정리해드립니다 (향후 제공)
- 🏷️ 자동 태깅: AI가 관련 태그를 자동으로 추천합니다 (향후 제공)
- 🔍 스마트 검색: 태그와 내용으로 빠르게 검색하세요 (향후 제공)
- 📤 데이터 내보내기: 언제든 내 데이터를 다운로드할 수 있습니다 (향후 제공)

이 샘플 노트들은 언제든 삭제하실 수 있습니다!`,
  },
  {
    title: '📝 텍스트 메모 작성하기',
    content: `텍스트 메모는 AI 메모장의 가장 기본적인 기능입니다.

작성 방법:
1. 우측 상단의 "새 노트 작성" 버튼을 클릭하세요
2. 제목과 본문을 입력하세요
3. 저장 버튼을 누르면 완료!

수정 방법:
1. 노트를 클릭하여 상세 페이지로 이동
2. "수정" 버튼 클릭
3. 내용을 수정하면 자동으로 저장됩니다

팁:
- 제목은 간결하게, 본문은 자유롭게 작성하세요
- 긴 메모도 걱정 없어요. 나중에 AI가 요약해드립니다!
- 자주 쓰는 단어는 나중에 태그로 자동 추천됩니다`,
  },
  {
    title: '🎙️ 음성 메모 활용법 (향후 제공 예정)',
    content: `음성 메모 기능은 곧 제공될 예정입니다!

음성 메모를 사용하면:
- 타이핑 없이 말로 빠르게 메모할 수 있어요
- 회의나 강의 중에도 손쉽게 기록 가능
- 음성이 자동으로 텍스트로 변환됩니다

사용 시나리오:
- 운전 중 떠오른 아이디어를 안전하게 기록
- 회의록을 빠르게 작성
- 학습 내용을 복습하면서 요약

기대해주세요! 🌟`,
  },
]

export async function createSampleNotes(): Promise<CreateSampleNotesResult> {
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

    // 2. 샘플 노트 데이터 준비
    const sampleNotesData = SAMPLE_NOTES.map((note) => ({
      userId: user.id,
      title: note.title,
      content: note.content,
    }))

    // 3. Drizzle ORM으로 3개 노트 일괄 삽입
    const insertedNotes = await db.insert(notes).values(sampleNotesData).returning()

    // 4. 캐시 무효화
    revalidatePath('/notes')

    return {
      success: true,
      count: insertedNotes.length,
    }
  } catch (error) {
    console.error('샘플 노트 생성 실패:', error)
    return {
      success: false,
      error: '샘플 노트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

