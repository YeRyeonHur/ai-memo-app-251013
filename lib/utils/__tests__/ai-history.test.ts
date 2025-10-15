// lib/utils/__tests__/ai-history.test.ts
// AI 히스토리 관리 유틸리티 테스트
// 세션 스토리지를 사용한 히스토리 저장/로드/삭제 기능 테스트
// Related: lib/utils/ai-history.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveSummaryHistory,
  getSummaryHistory,
  getAllSummaryHistory,
  saveTagHistory,
  getTagHistory,
  getAllTagHistory,
  clearSummaryHistory,
  clearTagHistory,
  clearAllHistory,
  clearAllHistories,
  getRelativeTime,
  type SummaryHistory,
  type TagHistory,
} from '../ai-history'

// Mock sessionStorage with actual storage simulation
const storage: Record<string, string> = {}
const mockSessionStorage = {
  getItem: vi.fn((key: string) => storage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach(key => delete storage[key])
  }),
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

describe('AI History Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear storage before each test
    Object.keys(storage).forEach(key => delete storage[key])
  })

  describe('Summary History', () => {
    it('should save and retrieve summary history', () => {
      const noteId = 'test-note-id'
      const content = 'Test summary content'
      const style = 'bullet'
      const length = 'medium'

      saveSummaryHistory(noteId, content, style, length)

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'ai-summary-history',
        expect.stringContaining(noteId)
      )

      const history = getSummaryHistory(noteId)
      expect(history).toHaveLength(1)
      expect(history[0].content).toBe(content)
      expect(history[0].style).toBe(style)
      expect(history[0].length).toBe(length)
    })

    it('should limit history to 3 items', () => {
      const noteId = 'test-note-id'

      // Save 4 items
      for (let i = 0; i < 4; i++) {
        saveSummaryHistory(noteId, `Content ${i}`, 'bullet', 'medium')
      }

      const history = getSummaryHistory(noteId)
      expect(history).toHaveLength(3)
      expect(history[0].content).toBe('Content 3') // Most recent first
    })

    it('should return empty array for non-existent note', () => {
      const history = getSummaryHistory('non-existent-note')
      expect(history).toEqual([])
    })

    it('should clear summary history for specific note', () => {
      const noteId = 'test-note-id'
      
      // Save some history
      saveSummaryHistory(noteId, 'Test content', 'bullet', 'medium')
      
      // Clear it
      clearSummaryHistory(noteId)
      
      const history = getSummaryHistory(noteId)
      expect(history).toEqual([])
    })
  })

  describe('Tag History', () => {
    it('should save and retrieve tag history', () => {
      const noteId = 'test-note-id'
      const tags = ['tag1', 'tag2', 'tag3']
      const count = 3

      saveTagHistory(noteId, tags, count)

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'ai-tag-history',
        expect.stringContaining(noteId)
      )

      const history = getTagHistory(noteId)
      expect(history).toHaveLength(1)
      expect(history[0].tags).toEqual(tags)
      expect(history[0].count).toBe(count)
    })

    it('should limit tag history to 3 items', () => {
      const noteId = 'test-note-id'

      // Save 4 items
      for (let i = 0; i < 4; i++) {
        saveTagHistory(noteId, [`tag${i}`], 1)
      }

      const history = getTagHistory(noteId)
      expect(history).toHaveLength(3)
      expect(history[0].tags[0]).toBe('tag3') // Most recent first
    })

    it('should return empty array for non-existent note', () => {
      const history = getTagHistory('non-existent-note')
      expect(history).toEqual([])
    })

    it('should clear tag history for specific note', () => {
      const noteId = 'test-note-id'
      
      // Save some history
      saveTagHistory(noteId, ['tag1', 'tag2'], 2)
      
      // Clear it
      clearTagHistory(noteId)
      
      const history = getTagHistory(noteId)
      expect(history).toEqual([])
    })
  })

  describe('All History Management', () => {
    it('should clear all history for a note', () => {
      const noteId = 'test-note-id'
      
      // Save both types of history
      saveSummaryHistory(noteId, 'Test summary', 'bullet', 'medium')
      saveTagHistory(noteId, ['tag1'], 1)
      
      // Clear all
      clearAllHistory(noteId)
      
      expect(getSummaryHistory(noteId)).toEqual([])
      expect(getTagHistory(noteId)).toEqual([])
    })

    it('should clear all histories', () => {
      // Save some history
      saveSummaryHistory('note1', 'Summary 1', 'bullet', 'medium')
      saveTagHistory('note2', ['tag1'], 1)
      
      // Clear all
      clearAllHistories()
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ai-summary-history')
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ai-tag-history')
    })
  })

  describe('getRelativeTime', () => {
    it('should return "방금 전" for recent time', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
      
      const result = getRelativeTime(recent.toISOString())
      expect(result).toBe('방금 전')
    })

    it('should return minutes for recent time', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      
      const result = getRelativeTime(recent.toISOString())
      expect(result).toBe('5분 전')
    })

    it('should return hours for older time', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
      
      const result = getRelativeTime(recent.toISOString())
      expect(result).toBe('2시간 전')
    })

    it('should return days for very old time', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      
      const result = getRelativeTime(recent.toISOString())
      expect(result).toBe('3일 전')
    })

    it('should handle invalid timestamp', () => {
      const result = getRelativeTime('invalid-timestamp')
      expect(result).toBe('알 수 없음')
    })
  })

  describe('Error Handling', () => {
    it('should handle sessionStorage errors gracefully', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const history = getSummaryHistory('test-note')
      expect(history).toEqual([])
    })

    it('should handle JSON parse errors', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json')

      const history = getSummaryHistory('test-note')
      expect(history).toEqual([])
    })
  })
})
