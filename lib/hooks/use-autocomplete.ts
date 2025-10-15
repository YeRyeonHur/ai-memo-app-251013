// lib/hooks/use-autocomplete.ts
// 자동완성 기능을 위한 React Hook
// Debounced API 호출, 상태 관리, 키보드 이벤트 핸들링, 캐싱 로직 포함
// Related: components/ui/autocomplete.tsx, app/notes/autocomplete-actions.ts

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDebounce } from './use-debounce'
import type { AutocompleteSuggestion } from '@/components/ui/autocomplete'

export interface UseAutocompleteOptions {
  debounceMs?: number
  maxSuggestions?: number
  minInputLength?: number
  enabled?: boolean
}

export interface UseAutocompleteReturn {
  // 상태
  suggestions: AutocompleteSuggestion[]
  isLoading: boolean
  isVisible: boolean
  error: string | null
  
  // 액션
  handleInputChange: (value: string, context?: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  selectSuggestion: (suggestion: AutocompleteSuggestion) => void
  dismissSuggestions: () => void
  clearError: () => void
  
  // 설정
  setEnabled: (enabled: boolean) => void
  isEnabled: boolean
}

// 캐시 인터페이스
interface CacheEntry {
  suggestions: AutocompleteSuggestion[]
  timestamp: number
  context: string
}

// 전역 캐시 (세션 동안 유지)
const suggestionCache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export function useAutocomplete(options: UseAutocompleteOptions = {}): UseAutocompleteReturn {
  const {
    debounceMs = 500,
    maxSuggestions = 3,
    minInputLength = 2,
    enabled = true
  } = options

  // 상태
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEnabled, setIsEnabled] = useState(enabled)
  
  // 입력값과 컨텍스트
  const [inputValue, setInputValue] = useState('')
  const [context, setContext] = useState('')
  
  // Debounced 입력값
  const debouncedInput = useDebounce(inputValue, debounceMs)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastRequestIdRef = useRef(0)

  // 캐시 키 생성
  const generateCacheKey = useCallback((input: string, ctx: string) => {
    return `${input.toLowerCase().trim()}_${ctx.toLowerCase().trim()}`
  }, [])

  // 캐시에서 제안 조회
  const getCachedSuggestions = useCallback((input: string, ctx: string): AutocompleteSuggestion[] | null => {
    const cacheKey = generateCacheKey(input, ctx)
    const cached = suggestionCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.suggestions
    }
    
    // 만료된 캐시 삭제
    if (cached) {
      suggestionCache.delete(cacheKey)
    }
    
    return null
  }, [generateCacheKey])

  // 캐시에 제안 저장
  const setCachedSuggestions = useCallback((input: string, ctx: string, suggestions: AutocompleteSuggestion[]) => {
    const cacheKey = generateCacheKey(input, ctx)
    suggestionCache.set(cacheKey, {
      suggestions,
      timestamp: Date.now(),
      context: ctx
    })
  }, [generateCacheKey])

  // AI 제안 생성 (Server Action 호출)
  const generateSuggestions = useCallback(async (input: string, ctx: string) => {
    console.log('🔍 generateSuggestions 호출:', { input, ctx, isEnabled, minInputLength })
    
    if (!isEnabled || input.length < minInputLength) {
      console.log('❌ 조건 불만족:', { isEnabled, inputLength: input.length, minInputLength })
      setSuggestions([])
      setIsVisible(false)
      return
    }

    // 캐시 확인
    const cached = getCachedSuggestions(input, ctx)
    if (cached) {
      setSuggestions(cached.slice(0, maxSuggestions))
      setIsVisible(true)
      return
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 요청 ID 생성
    const requestId = ++lastRequestIdRef.current
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Server Action 호출 시작:', { input, ctx })
      
      // Server Action 호출
      const { generateAutocompleteSuggestion } = await import('@/app/notes/autocomplete-actions')
      
      const result = await generateAutocompleteSuggestion(input, ctx)
      
      console.log('✅ Server Action 응답:', result)
      
      // 요청이 취소되었거나 다른 요청이 시작된 경우 무시
      if (abortController.signal.aborted || requestId !== lastRequestIdRef.current) {
        return
      }

      if (result.success && result.suggestions) {
        const newSuggestions = result.suggestions.slice(0, maxSuggestions)
        setSuggestions(newSuggestions)
        setIsVisible(newSuggestions.length > 0)
        
        // 캐시에 저장
        setCachedSuggestions(input, ctx, newSuggestions)
      } else {
        setError(result.error || '제안을 생성할 수 없습니다.')
        setSuggestions([])
        setIsVisible(false)
      }
    } catch (err) {
      // 요청이 취소된 경우는 에러로 처리하지 않음
      if (abortController.signal.aborted || requestId !== lastRequestIdRef.current) {
        return
      }

      console.error('자동완성 제안 생성 실패:', err)
      setError('제안을 불러오는 중 오류가 발생했습니다.')
      setSuggestions([])
      setIsVisible(false)
    } finally {
      setIsLoading(false)
    }
  }, [isEnabled, minInputLength, maxSuggestions, getCachedSuggestions, setCachedSuggestions])

  // Debounced 입력값이 변경될 때 제안 생성
  useEffect(() => {
    // 입력이 진행 중이면 제안 생성하지 않음
    if (inputValue !== debouncedInput) {
      setSuggestions([])
      setIsVisible(false)
      setIsLoading(false)
      return
    }
    
    if (debouncedInput) {
      generateSuggestions(debouncedInput, context)
    } else {
      setSuggestions([])
      setIsVisible(false)
      setIsLoading(false)
    }
  }, [debouncedInput, context, generateSuggestions, inputValue])

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((value: string, ctx: string = '') => {
    setInputValue(value)
    setContext(ctx)
    setError(null)
  }, [])

  // 선택된 제안 인덱스 상태 추가
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 제안 선택 핸들러
  const selectSuggestion = useCallback((suggestion: AutocompleteSuggestion) => {
    setSuggestions([])
    setIsVisible(false)
    setError(null)
  }, [])

  // 제안 닫기 핸들러
  const dismissSuggestions = useCallback(() => {
    setIsVisible(false)
    setError(null)
  }, [])

  // 키보드 네비게이션 핸들러 (화살표 키만 처리)
  const handleKeyboardNavigation = useCallback((key: string) => {
    if (!isVisible || suggestions.length === 0) return

    switch (key) {
      case 'ArrowDown':
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
    }
  }, [isVisible, suggestions.length])

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case 'Tab':
      case 'Escape':
        e.preventDefault()
        // 실제 키보드 네비게이션은 Autocomplete 컴포넌트에서 처리
        break
    }
  }, [isVisible, suggestions.length])

  // 에러 클리어 핸들러
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 활성화 상태 변경 핸들러
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
    if (!enabled) {
      setSuggestions([])
      setIsVisible(false)
      setIsLoading(false)
      setError(null)
    }
  }, [])

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // 상태
    suggestions,
    isLoading,
    isVisible,
    error,
    selectedIndex,
    
    // 액션
    handleInputChange,
    handleKeyDown,
    handleKeyboardNavigation,
    selectSuggestion,
    dismissSuggestions,
    clearError,
    
    // 설정
    setEnabled,
    isEnabled
  }
}
