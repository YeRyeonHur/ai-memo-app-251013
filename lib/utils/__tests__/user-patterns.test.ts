// lib/utils/__tests__/user-patterns.test.ts
// 사용자 패턴 분석 유틸리티 테스트
// 패턴 분석, 캐싱, 로컬 스토리지 관리 등의 기능 테스트
// Related: lib/utils/user-patterns.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  analyzeUserWritingPattern,
  saveUserPattern,
  getUserPattern,
  deleteUserPattern,
  clearAllUserPatterns,
  updateUserPattern
} from '../user-patterns'
import type { UserWritingPattern } from '../user-patterns'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('user-patterns', () => {
  const mockNotes = [
    {
      title: '회의록',
      content: '오늘 회의에서 프로젝트 진행 상황을 논의했습니다. 다음 주까지 완료해야 할 작업들이 있습니다.',
      createdAt: new Date('2024-01-01')
    },
    {
      title: '학습 노트',
      content: 'React Hook에 대해 공부했습니다. useState와 useEffect를 사용하는 방법을 배웠습니다.',
      createdAt: new Date('2024-01-02')
    },
    {
      title: '일기',
      content: '오늘은 정말 좋은 하루였습니다. 친구들과 맛있는 음식을 먹고 즐거운 시간을 보냈습니다.',
      createdAt: new Date('2024-01-03')
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('analyzeUserWritingPattern', () => {
    it('빈 노트 배열일 때 기본 패턴을 반환해야 한다', () => {
      const result = analyzeUserWritingPattern('user-123', [])

      expect(result).toEqual({
        commonPhrases: [],
        writingStyle: 'casual',
        averageLength: 0,
        confidence: 0
      })
    })

    it('노트를 분석하여 패턴을 반환해야 한다', () => {
      const result = analyzeUserWritingPattern('user-123', mockNotes)

      expect(result.commonPhrases).toBeDefined()
      expect(result.writingStyle).toBeDefined()
      expect(result.averageLength).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('자주 사용하는 표현을 추출해야 한다', () => {
      const result = analyzeUserWritingPattern('user-123', mockNotes)

      expect(Array.isArray(result.commonPhrases)).toBe(true)
      expect(result.commonPhrases.length).toBeLessThanOrEqual(10)
    })

    it('문체를 올바르게 분석해야 한다', () => {
      const result = analyzeUserWritingPattern('user-123', mockNotes)

      expect(['formal', 'casual', 'academic']).toContain(result.writingStyle)
    })

    it('평균 문장 길이를 계산해야 한다', () => {
      const result = analyzeUserWritingPattern('user-123', mockNotes)

      expect(typeof result.averageLength).toBe('number')
      expect(result.averageLength).toBeGreaterThan(0)
    })

    it('신뢰도를 올바르게 계산해야 한다', () => {
      const result = analyzeUserWritingPattern('user-123', mockNotes)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('saveUserPattern', () => {
    it('사용자 패턴을 로컬 스토리지에 저장해야 한다', () => {
      const pattern: UserWritingPattern = {
        userId: 'user-123',
        commonPhrases: ['테스트', '예시'],
        writingStyle: 'casual',
        averageLength: 20,
        lastUpdated: new Date(),
        noteCount: 5
      }

      saveUserPattern(pattern)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user_writing_patterns',
        expect.stringContaining('user-123')
      )
    })

    it('저장 실패 시 에러를 로그에 기록해야 한다', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const pattern: UserWritingPattern = {
        userId: 'user-123',
        commonPhrases: [],
        writingStyle: 'casual',
        averageLength: 0,
        lastUpdated: new Date(),
        noteCount: 0
      }

      saveUserPattern(pattern)

      expect(consoleSpy).toHaveBeenCalledWith(
        '사용자 패턴 저장 실패:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getUserPattern', () => {
    it('저장된 패턴을 조회해야 한다', () => {
      const pattern: UserWritingPattern = {
        userId: 'user-123',
        commonPhrases: ['테스트'],
        writingStyle: 'casual',
        averageLength: 15,
        lastUpdated: new Date(),
        noteCount: 3
      }

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ 'user-123': pattern })
      )

      const result = getUserPattern('user-123')

      expect(result).toEqual(pattern)
    })

    it('패턴이 없을 때 null을 반환해야 한다', () => {
      const result = getUserPattern('nonexistent-user')

      expect(result).toBeNull()
    })

    it('만료된 패턴을 삭제하고 null을 반환해야 한다', () => {
      const expiredPattern: UserWritingPattern = {
        userId: 'user-123',
        commonPhrases: [],
        writingStyle: 'casual',
        averageLength: 0,
        lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25시간 전
        noteCount: 0
      }

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ 'user-123': expiredPattern })
      )

      const result = getUserPattern('user-123')

      expect(result).toBeNull()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user_writing_patterns',
        '{}'
      )
    })

    it('조회 실패 시 에러를 로그에 기록해야 한다', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = getUserPattern('user-123')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '사용자 패턴 조회 실패:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('deleteUserPattern', () => {
    it('사용자 패턴을 삭제해야 한다', () => {
      const patterns = {
        'user-123': {
          userId: 'user-123',
          commonPhrases: [],
          writingStyle: 'casual',
          averageLength: 0,
          lastUpdated: new Date(),
          noteCount: 0
        },
        'user-456': {
          userId: 'user-456',
          commonPhrases: [],
          writingStyle: 'formal',
          averageLength: 0,
          lastUpdated: new Date(),
          noteCount: 0
        }
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(patterns))

      deleteUserPattern('user-123')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user_writing_patterns',
        JSON.stringify({ 'user-456': patterns['user-456'] })
      )
    })
  })

  describe('clearAllUserPatterns', () => {
    it('모든 사용자 패턴을 삭제해야 한다', () => {
      clearAllUserPatterns()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_writing_patterns')
    })
  })

  describe('updateUserPattern', () => {
    it('새로운 패턴을 생성해야 한다', () => {
      const result = updateUserPattern('user-123', mockNotes)

      expect(result).toBeDefined()
      expect(result?.userId).toBe('user-123')
      expect(result?.noteCount).toBe(mockNotes.length)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('기존 패턴을 업데이트해야 한다', () => {
      const existingPattern: UserWritingPattern = {
        userId: 'user-123',
        commonPhrases: ['기존'],
        writingStyle: 'casual',
        averageLength: 10,
        lastUpdated: new Date(),
        noteCount: 2
      }

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ 'user-123': existingPattern })
      )

      const newNotes = [
        {
          title: '새 노트',
          content: '새로운 내용입니다.',
          createdAt: new Date()
        }
      ]

      const result = updateUserPattern('user-123', newNotes)

      expect(result).toBeDefined()
      expect(result?.noteCount).toBeGreaterThan(existingPattern.noteCount)
    })

    it('업데이트 실패 시 null을 반환해야 한다', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = updateUserPattern('user-123', mockNotes)

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '사용자 패턴 업데이트 실패:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
