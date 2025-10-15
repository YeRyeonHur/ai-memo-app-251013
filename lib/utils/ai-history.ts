// lib/utils/ai-history.ts
// AI 재생성 히스토리 관리 유틸리티
// 세션 스토리지를 사용하여 재생성 결과를 저장하고 관리
// Related: app/notes/[id]/ai-section.tsx, app/notes/[id]/regenerate-menu.tsx

export interface SummaryHistory {
  id: string
  content: string
  style: string
  length: string
  timestamp: string
}

export interface TagHistory {
  id: string
  tags: string[]
  count: number
  timestamp: string
}

const SUMMARY_HISTORY_KEY = 'ai-summary-history'
const TAG_HISTORY_KEY = 'ai-tag-history'
const MAX_HISTORY_SIZE = 3

/**
 * 요약 히스토리를 저장합니다
 * 최대 3개의 히스토리만 유지하며, 새로운 항목이 추가되면 가장 오래된 항목을 제거합니다
 * 
 * @param noteId - 노트 ID
 * @param content - 요약 내용
 * @param style - 요약 스타일
 * @param length - 요약 길이
 */
export function saveSummaryHistory(
  noteId: string,
  content: string,
  style: string,
  length: string
): void {
  try {
    const history = getSummaryHistory(noteId)
    
    const newEntry: SummaryHistory = {
      id: `${noteId}-${Date.now()}`,
      content,
      style,
      length,
      timestamp: new Date().toISOString(),
    }
    
    // 새로운 항목을 맨 앞에 추가
    const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_SIZE)
    
    const allHistory = getAllSummaryHistory()
    allHistory[noteId] = updatedHistory
    
    sessionStorage.setItem(SUMMARY_HISTORY_KEY, JSON.stringify(allHistory))
  } catch (error) {
    console.error('요약 히스토리 저장 실패:', error)
  }
}

/**
 * 특정 노트의 요약 히스토리를 조회합니다
 * 
 * @param noteId - 노트 ID
 * @returns 요약 히스토리 배열
 */
export function getSummaryHistory(noteId: string): SummaryHistory[] {
  try {
    const allHistory = getAllSummaryHistory()
    return allHistory[noteId] || []
  } catch (error) {
    console.error('요약 히스토리 조회 실패:', error)
    return []
  }
}

/**
 * 모든 요약 히스토리를 조회합니다
 * 
 * @returns 노트 ID별 요약 히스토리 맵
 */
export function getAllSummaryHistory(): Record<string, SummaryHistory[]> {
  try {
    const data = sessionStorage.getItem(SUMMARY_HISTORY_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('전체 요약 히스토리 조회 실패:', error)
    return {}
  }
}

/**
 * 태그 히스토리를 저장합니다
 * 최대 3개의 히스토리만 유지하며, 새로운 항목이 추가되면 가장 오래된 항목을 제거합니다
 * 
 * @param noteId - 노트 ID
 * @param tags - 태그 배열
 * @param count - 태그 개수
 */
export function saveTagHistory(
  noteId: string,
  tags: string[],
  count: number
): void {
  try {
    const history = getTagHistory(noteId)
    
    const newEntry: TagHistory = {
      id: `${noteId}-${Date.now()}`,
      tags,
      count,
      timestamp: new Date().toISOString(),
    }
    
    // 새로운 항목을 맨 앞에 추가
    const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_SIZE)
    
    const allHistory = getAllTagHistory()
    allHistory[noteId] = updatedHistory
    
    sessionStorage.setItem(TAG_HISTORY_KEY, JSON.stringify(allHistory))
  } catch (error) {
    console.error('태그 히스토리 저장 실패:', error)
  }
}

/**
 * 특정 노트의 태그 히스토리를 조회합니다
 * 
 * @param noteId - 노트 ID
 * @returns 태그 히스토리 배열
 */
export function getTagHistory(noteId: string): TagHistory[] {
  try {
    const allHistory = getAllTagHistory()
    return allHistory[noteId] || []
  } catch (error) {
    console.error('태그 히스토리 조회 실패:', error)
    return []
  }
}

/**
 * 모든 태그 히스토리를 조회합니다
 * 
 * @returns 노트 ID별 태그 히스토리 맵
 */
export function getAllTagHistory(): Record<string, TagHistory[]> {
  try {
    const data = sessionStorage.getItem(TAG_HISTORY_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('전체 태그 히스토리 조회 실패:', error)
    return {}
  }
}

/**
 * 특정 노트의 요약 히스토리를 삭제합니다
 * 
 * @param noteId - 노트 ID
 */
export function clearSummaryHistory(noteId: string): void {
  try {
    const allHistory = getAllSummaryHistory()
    delete allHistory[noteId]
    sessionStorage.setItem(SUMMARY_HISTORY_KEY, JSON.stringify(allHistory))
  } catch (error) {
    console.error('요약 히스토리 삭제 실패:', error)
  }
}

/**
 * 특정 노트의 태그 히스토리를 삭제합니다
 * 
 * @param noteId - 노트 ID
 */
export function clearTagHistory(noteId: string): void {
  try {
    const allHistory = getAllTagHistory()
    delete allHistory[noteId]
    sessionStorage.setItem(TAG_HISTORY_KEY, JSON.stringify(allHistory))
  } catch (error) {
    console.error('태그 히스토리 삭제 실패:', error)
  }
}

/**
 * 특정 노트의 모든 히스토리를 삭제합니다
 * 
 * @param noteId - 노트 ID
 */
export function clearAllHistory(noteId: string): void {
  clearSummaryHistory(noteId)
  clearTagHistory(noteId)
}

/**
 * 모든 히스토리를 삭제합니다 (세션 전체)
 */
export function clearAllHistories(): void {
  try {
    sessionStorage.removeItem(SUMMARY_HISTORY_KEY)
    sessionStorage.removeItem(TAG_HISTORY_KEY)
  } catch (error) {
    console.error('전체 히스토리 삭제 실패:', error)
  }
}

/**
 * 히스토리 항목의 상대적 시간을 반환합니다
 * 
 * @param timestamp - ISO 8601 타임스탬프
 * @returns 상대적 시간 문자열 (예: "2분 전")
 */
export function getRelativeTime(timestamp: string): string {
  try {
    const now = new Date()
    const time = new Date(timestamp)
    
    // 유효하지 않은 날짜 체크
    if (isNaN(time.getTime())) {
      return '알 수 없음'
    }
    
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return '방금 전'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}분 전`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}시간 전`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}일 전`
    }
  } catch (error) {
    console.error('상대적 시간 계산 실패:', error)
    return '알 수 없음'
  }
}
