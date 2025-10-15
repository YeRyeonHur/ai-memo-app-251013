// lib/utils/__tests__/draft-storage.test.ts
// draft-storage.ts 유틸리티 함수 테스트
// saveDraft, loadDraft, clearDraft 함수의 동작 검증
// Related: lib/utils/draft-storage.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveDraft, loadDraft, clearDraft } from '../draft-storage'

// LocalStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('draft-storage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('saveDraft', () => {
    it('LocalStorage에 초안을 성공적으로 저장한다', () => {
      const userId = 'test-user-id'
      const title = '테스트 제목'
      const content = '테스트 내용'

      const result = saveDraft(userId, title, content)

      expect(result).toBe(true)
      const savedData = localStorage.getItem(`draft-note-${userId}`)
      expect(savedData).toBeTruthy()
      
      const parsed = JSON.parse(savedData!)
      expect(parsed.title).toBe(title)
      expect(parsed.content).toBe(content)
      expect(parsed.savedAt).toBeTruthy()
    })

    it('빈 제목과 내용도 저장할 수 있다', () => {
      const userId = 'test-user-id'
      const result = saveDraft(userId, '', '')

      expect(result).toBe(true)
      const savedData = localStorage.getItem(`draft-note-${userId}`)
      expect(savedData).toBeTruthy()
    })

    it('LocalStorage 에러 시 false를 반환한다', () => {
      const userId = 'test-user-id'
      
      // setItem 에러 시뮬레이션
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('LocalStorage Error')
      })

      const result = saveDraft(userId, 'title', 'content')

      expect(result).toBe(false)
      
      // 복원
      localStorage.setItem = originalSetItem
    })
  })

  describe('loadDraft', () => {
    it('저장된 초안을 성공적으로 불러온다', () => {
      const userId = 'test-user-id'
      const title = '테스트 제목'
      const content = '테스트 내용'
      
      saveDraft(userId, title, content)
      const draft = loadDraft(userId)

      expect(draft).toBeTruthy()
      expect(draft?.title).toBe(title)
      expect(draft?.content).toBe(content)
      expect(draft?.savedAt).toBeTruthy()
    })

    it('저장된 초안이 없으면 null을 반환한다', () => {
      const userId = 'non-existent-user'
      const draft = loadDraft(userId)

      expect(draft).toBeNull()
    })

    it('잘못된 JSON 데이터가 있으면 null을 반환한다', () => {
      const userId = 'test-user-id'
      localStorage.setItem(`draft-note-${userId}`, 'invalid-json')

      const draft = loadDraft(userId)

      expect(draft).toBeNull()
    })

    it('LocalStorage 에러 시 null을 반환한다', () => {
      const userId = 'test-user-id'
      
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn(() => {
        throw new Error('LocalStorage Error')
      })

      const draft = loadDraft(userId)

      expect(draft).toBeNull()
      
      // 복원
      localStorage.getItem = originalGetItem
    })
  })

  describe('clearDraft', () => {
    it('초안을 성공적으로 삭제한다', () => {
      const userId = 'test-user-id'
      saveDraft(userId, '제목', '내용')

      const result = clearDraft(userId)

      expect(result).toBe(true)
      const draft = loadDraft(userId)
      expect(draft).toBeNull()
    })

    it('초안이 없어도 true를 반환한다', () => {
      const userId = 'non-existent-user'
      const result = clearDraft(userId)

      expect(result).toBe(true)
    })

    it('LocalStorage 에러 시 false를 반환한다', () => {
      const userId = 'test-user-id'
      
      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = vi.fn(() => {
        throw new Error('LocalStorage Error')
      })

      const result = clearDraft(userId)

      expect(result).toBe(false)
      
      // 복원
      localStorage.removeItem = originalRemoveItem
    })
  })

  describe('사용자별 격리', () => {
    it('다른 사용자의 초안과 충돌하지 않는다', () => {
      const user1 = 'user-1'
      const user2 = 'user-2'

      saveDraft(user1, '사용자1 제목', '사용자1 내용')
      saveDraft(user2, '사용자2 제목', '사용자2 내용')

      const draft1 = loadDraft(user1)
      const draft2 = loadDraft(user2)

      expect(draft1?.title).toBe('사용자1 제목')
      expect(draft2?.title).toBe('사용자2 제목')

      clearDraft(user1)

      expect(loadDraft(user1)).toBeNull()
      expect(loadDraft(user2)).toBeTruthy()
    })
  })
})

