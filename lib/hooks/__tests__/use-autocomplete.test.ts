// lib/hooks/__tests__/use-autocomplete.test.ts
// useAutocomplete Hook 테스트
// 상태 관리, Debounced API 호출, 캐싱 로직 등의 기능 테스트
// Related: lib/hooks/use-autocomplete.ts

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAutocomplete } from '../use-autocomplete'
import type { AutocompleteSuggestion } from '@/components/ui/autocomplete'

// Mock Server Actions
vi.mock('@/app/notes/autocomplete-actions', () => ({
  generateAutocompleteSuggestion: vi.fn()
}))

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

describe('useAutocomplete', () => {
  const mockSuggestions: AutocompleteSuggestion[] = [
    {
      id: '1',
      text: '테스트 제안 1',
      confidence: 0.9,
      type: 'sentence'
    },
    {
      id: '2',
      text: '테스트 제안 2',
      confidence: 0.8,
      type: 'phrase'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('초기 상태가 올바르게 설정되어야 한다', () => {
    const { result } = renderHook(() => useAutocomplete())

    expect(result.current.suggestions).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isVisible).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isEnabled).toBe(true)
  })

  it('입력값이 변경되면 debounced 호출이 실행되어야 한다', async () => {
    vi.useFakeTimers()
    
    const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')
    vi.mocked(generateAutocompleteSuggestion).mockResolvedValue({
      success: true,
      suggestions: mockSuggestions
    })

    const { result } = renderHook(() => useAutocomplete({ debounceMs: 500 }))

    act(() => {
      result.current.handleInputChange('테스트 입력', '컨텍스트')
    })

    // debounce 시간 전에는 호출되지 않아야 함
    expect(generateAutocompleteSuggestion).not.toHaveBeenCalled()

    // debounce 시간 후 호출되어야 함
    act(() => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(generateAutocompleteSuggestion).toHaveBeenCalledWith('테스트 입력', '컨텍스트')
    })

    vi.useRealTimers()
  })

  it('최소 입력 길이 미만일 때 API 호출하지 않아야 한다', async () => {
    const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')

    const { result } = renderHook(() => useAutocomplete({ minInputLength: 5 }))

    act(() => {
      result.current.handleInputChange('짧음', '컨텍스트')
    })

    await waitFor(() => {
      expect(generateAutocompleteSuggestion).not.toHaveBeenCalled()
    })
  })

  it('API 호출 성공 시 제안이 업데이트되어야 한다', async () => {
    const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')
    vi.mocked(generateAutocompleteSuggestion).mockResolvedValue({
      success: true,
      suggestions: mockSuggestions
    })

    const { result } = renderHook(() => useAutocomplete())

    act(() => {
      result.current.handleInputChange('테스트 입력', '컨텍스트')
    })

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(mockSuggestions)
      expect(result.current.isVisible).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('API 호출 실패 시 에러가 설정되어야 한다', async () => {
    const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')
    vi.mocked(generateAutocompleteSuggestion).mockResolvedValue({
      success: false,
      error: 'API 호출 실패'
    })

    const { result } = renderHook(() => useAutocomplete())

    act(() => {
      result.current.handleInputChange('테스트 입력', '컨텍스트')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('API 호출 실패')
      expect(result.current.suggestions).toEqual([])
      expect(result.current.isVisible).toBe(false)
    })
  })

  it('제안 선택 시 상태가 초기화되어야 한다', () => {
    const { result } = renderHook(() => useAutocomplete())

    act(() => {
      result.current.selectSuggestion(mockSuggestions[0])
    })

    expect(result.current.suggestions).toEqual([])
    expect(result.current.isVisible).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('제안 닫기 시 상태가 초기화되어야 한다', () => {
    const { result } = renderHook(() => useAutocomplete())

    act(() => {
      result.current.dismissSuggestions()
    })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('에러 클리어 시 에러가 null이 되어야 한다', () => {
    const { result } = renderHook(() => useAutocomplete())

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('활성화 상태 변경 시 올바르게 동작해야 한다', () => {
    const { result } = renderHook(() => useAutocomplete())

    act(() => {
      result.current.setEnabled(false)
    })

    expect(result.current.isEnabled).toBe(false)
    expect(result.current.suggestions).toEqual([])
    expect(result.current.isVisible).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('캐시가 올바르게 작동해야 한다', async () => {
    const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')
    vi.mocked(generateAutocompleteSuggestion).mockResolvedValue({
      success: true,
      suggestions: mockSuggestions
    })

    const { result } = renderHook(() => useAutocomplete())

    // 첫 번째 호출
    act(() => {
      result.current.handleInputChange('테스트 입력', '컨텍스트')
    })

    await waitFor(() => {
      expect(generateAutocompleteSuggestion).toHaveBeenCalledTimes(1)
    })

    // 같은 입력으로 두 번째 호출 (캐시에서 가져와야 함)
    act(() => {
      result.current.handleInputChange('테스트 입력', '컨텍스트')
    })

    await waitFor(() => {
      expect(generateAutocompleteSuggestion).toHaveBeenCalledTimes(1) // 여전히 1번만 호출
    })
  })

  it('이전 요청이 취소되어야 한다', async () => {
    const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')
    
    // 첫 번째 요청을 지연시킴
    let firstResolve: (value: any) => void
    const firstPromise = new Promise(resolve => {
      firstResolve = resolve
    })
    vi.mocked(generateAutocompleteSuggestion).mockReturnValueOnce(firstPromise)

    const { result } = renderHook(() => useAutocomplete())

    // 첫 번째 요청 시작
    act(() => {
      result.current.handleInputChange('첫 번째 입력', '컨텍스트')
    })

    // 두 번째 요청 시작 (첫 번째 요청 취소)
    act(() => {
      result.current.handleInputChange('두 번째 입력', '컨텍스트')
    })

    // 첫 번째 요청 완료 (취소되어야 함)
    act(() => {
      firstResolve!({
        success: true,
        suggestions: mockSuggestions
      })
    })

    await waitFor(() => {
      // 두 번째 요청만 완료되어야 함
      expect(generateAutocompleteSuggestion).toHaveBeenCalledWith('두 번째 입력', '컨텍스트')
    })
  })

  it('커스텀 옵션이 올바르게 적용되어야 한다', () => {
    const { result } = renderHook(() => useAutocomplete({
      debounceMs: 1000,
      maxSuggestions: 5,
      minInputLength: 3,
      enabled: false
    }))

    expect(result.current.isEnabled).toBe(false)
  })
})
