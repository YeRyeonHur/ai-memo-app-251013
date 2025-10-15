// components/ui/autocomplete-textarea.tsx
// 자동완성 기능이 통합된 Textarea 컴포넌트
// 노트 작성 시 AI 자동완성 제안을 표시하고 선택할 수 있는 기능 제공
// Related: components/ui/autocomplete.tsx, lib/hooks/use-autocomplete.ts

'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Autocomplete } from '@/components/ui/autocomplete'
import { AutocompleteToggle } from '@/components/ui/autocomplete-toggle'
import { useAutocomplete } from '@/lib/hooks/use-autocomplete'
import { cn } from '@/lib/utils'
import type { AutocompleteSuggestion } from '@/components/ui/autocomplete'

export interface AutocompleteTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSuggestionSelect?: (suggestion: AutocompleteSuggestion) => void
  context?: string
  showToggle?: boolean
  autocompleteEnabled?: boolean
  onAutocompleteToggle?: (enabled: boolean) => void
  onAutocompleteChange?: (value: string, isFromSuggestion: boolean) => void
}

export const AutocompleteTextarea = forwardRef<
  HTMLTextAreaElement,
  AutocompleteTextareaProps
>(
  (
    {
      value,
      onChange,
      onSuggestionSelect,
      context = '',
      showToggle = true,
      autocompleteEnabled = true,
      onAutocompleteToggle,
      onAutocompleteChange,
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // 자동완성 Hook 사용
    const {
      suggestions,
      isLoading,
      isVisible,
      error,
      selectedIndex,
      handleInputChange,
      handleKeyboardNavigation,
      selectSuggestion,
      dismissSuggestions,
      setEnabled,
      isEnabled,
    } = useAutocomplete({
      enabled: autocompleteEnabled,
      debounceMs: 500,
      maxSuggestions: 3,
      minInputLength: 2,
    })

    // ref 연결
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(textareaRef.current)
      } else if (ref) {
        ref.current = textareaRef.current
      }
    }, [ref])

    // 입력값 변경 핸들러
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      const newCursorPosition = e.target.selectionStart

      console.log('📝 Textarea 변경:', { newValue, context, isEnabled })

      // 자동완성 Hook에 입력값 전달
      handleInputChange(newValue, context)

      // 커서 위치 업데이트
      setCursorPosition(newCursorPosition)

      // 부모 컴포넌트에 변경사항 전달 (일반 타이핑으로 표시)
      if (onChange) {
        onChange(e)
      }
      
      // 자동완성 변경 알림 (일반 타이핑)
      if (onAutocompleteChange) {
        onAutocompleteChange(newValue, false)
      }
    }

    // 포커스 핸들러
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      setCursorPosition(e.target.selectionStart)
      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    // 블러 핸들러
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      // 자동완성 제안이 클릭되는 경우를 고려하여 약간의 지연
      setTimeout(() => {
        setIsFocused(false)
        dismissSuggestions()
      }, 150)
      
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 자동완성 관련 키 처리
      if (isVisible && suggestions.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowUp':
            e.preventDefault()
            handleKeyboardNavigation(e.key)
            return // 이벤트 전파 중단
          case 'Enter':
          case 'Tab':
            e.preventDefault()
            // 현재 선택된 제안을 텍스트에 삽입
            if (suggestions[selectedIndex]) {
              handleSuggestionSelect(suggestions[selectedIndex])
            }
            return // 이벤트 전파 중단
          case 'Escape':
            e.preventDefault()
            dismissSuggestions()
            return // 이벤트 전파 중단
        }
      }

      // 커서 위치 업데이트
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setTimeout(() => {
          if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart)
          }
        }, 0)
      }

      if (props.onKeyDown) {
        props.onKeyDown(e)
      }
    }

    // 제안 선택 핸들러
    const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const currentValue = textarea.value
      const beforeCursor = currentValue.substring(0, cursorPosition)
      const afterCursor = currentValue.substring(cursorPosition)

      // 제안 텍스트를 커서 위치에 삽입
      const newValue = beforeCursor + suggestion.text + afterCursor
      const newCursorPosition = cursorPosition + suggestion.text.length

      // React의 onChange 이벤트를 통해 상태 업데이트
      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: newCursorPosition,
          selectionEnd: newCursorPosition
        }
      } as React.ChangeEvent<HTMLTextAreaElement>

      // onChange 핸들러 호출
      if (onChange) {
        onChange(syntheticEvent)
      }

      // 커서 위치 업데이트
      setCursorPosition(newCursorPosition)

      // 자동완성 Hook에 제안 선택 알림
      selectSuggestion(suggestion)

      // 부모 컴포넌트에 제안 선택 알림
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion)
      }
      
      // 자동완성 변경 알림 (제안 선택)
      if (onAutocompleteChange) {
        onAutocompleteChange(newValue, true)
      }

      // 포커스 유지 및 커서 위치 설정
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      }, 0)
    }

    // 자동완성 토글 핸들러
    const handleAutocompleteToggle = (enabled: boolean) => {
      setEnabled(enabled)
      if (onAutocompleteToggle) {
        onAutocompleteToggle(enabled)
      }
    }

    // 자동완성 위치 계산
    const getAutocompletePosition = () => {
      if (!textareaRef.current) return 'bottom'

      const textarea = textareaRef.current
      const rect = textarea.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()

      if (!containerRect) return 'bottom'

      // textarea 하단에 공간이 충분한지 확인
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      return spaceBelow > 200 || spaceBelow > spaceAbove ? 'bottom' : 'top'
    }

    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'pr-10', // 토글 버튼 공간 확보
              className
            )}
            {...props}
          />
          
          {/* 자동완성 토글 버튼 */}
          {showToggle && (
            <div className="absolute top-2 right-2">
              <AutocompleteToggle
                isEnabled={isEnabled}
                onToggle={handleAutocompleteToggle}
                size="sm"
                variant="ghost"
              />
            </div>
          )}
        </div>

        {/* 자동완성 제안 */}
        {isFocused && isEnabled && (
          <Autocomplete
            suggestions={suggestions}
            isLoading={isLoading}
            isVisible={isVisible}
            selectedIndex={selectedIndex}
            onSelect={handleSuggestionSelect}
            onDismiss={dismissSuggestions}
            position={getAutocompletePosition()}
            className="w-full"
          />
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    )
  }
)

AutocompleteTextarea.displayName = 'AutocompleteTextarea'
