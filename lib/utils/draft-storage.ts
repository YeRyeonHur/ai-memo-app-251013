// lib/utils/draft-storage.ts
// LocalStorage를 사용한 노트 임시 저장 유틸리티 함수
// 사용자별로 작성 중인 노트를 임시 저장하고 복원하는 기능 제공
// Related: app/notes/new/note-form.tsx

export interface DraftNote {
  title: string
  content: string
  savedAt: string // ISO 8601 timestamp
}

const DRAFT_KEY_PREFIX = 'draft-note-'

function getDraftKey(userId: string): string {
  return `${DRAFT_KEY_PREFIX}${userId}`
}

/**
 * 노트 초안을 LocalStorage에 저장
 * @param userId - 현재 사용자 ID
 * @param title - 노트 제목
 * @param content - 노트 내용
 * @returns 저장 성공 여부
 */
export function saveDraft(
  userId: string,
  title: string,
  content: string
): boolean {
  try {
    const draft: DraftNote = {
      title,
      content,
      savedAt: new Date().toISOString(),
    }
    const key = getDraftKey(userId)
    localStorage.setItem(key, JSON.stringify(draft))
    return true
  } catch (error) {
    console.error('임시 저장 실패:', error)
    return false
  }
}

/**
 * LocalStorage에서 노트 초안 불러오기
 * @param userId - 현재 사용자 ID
 * @returns 저장된 초안 또는 null
 */
export function loadDraft(userId: string): DraftNote | null {
  try {
    const key = getDraftKey(userId)
    const data = localStorage.getItem(key)
    if (!data) {
      return null
    }
    const draft = JSON.parse(data) as DraftNote
    return draft
  } catch (error) {
    console.error('임시 저장 불러오기 실패:', error)
    return null
  }
}

/**
 * LocalStorage에서 노트 초안 삭제
 * @param userId - 현재 사용자 ID
 * @returns 삭제 성공 여부
 */
export function clearDraft(userId: string): boolean {
  try {
    const key = getDraftKey(userId)
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('임시 저장 삭제 실패:', error)
    return false
  }
}

