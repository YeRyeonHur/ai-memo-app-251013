// components/ui/autocomplete.tsx
// 자동완성 UI 컴포넌트
// 드롭다운 형태의 제안 표시와 키보드 네비게이션 지원
// Related: lib/hooks/use-autocomplete.ts, app/notes/new/note-form.tsx

'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface AutocompleteSuggestion {
  id: string
  text: string
  confidence: number
  type: 'word' | 'phrase' | 'sentence'
}

export interface AutocompleteProps {
  suggestions: AutocompleteSuggestion[]
  isLoading: boolean
  isVisible: boolean
  selectedIndex?: number
  onSelect: (suggestion: AutocompleteSuggestion) => void
  onDismiss: () => void
  className?: string
  position?: 'top' | 'bottom'
}

export const Autocomplete = forwardRef<HTMLDivElement, AutocompleteProps>(
  ({ suggestions, isLoading, isVisible, selectedIndex: externalSelectedIndex, onSelect, onDismiss, className, position = 'bottom' }, ref) => {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(0)
    const listRef = useRef<HTMLUListElement>(null)
    
    // 외부에서 전달받은 selectedIndex 사용, 없으면 내부 상태 사용
    const selectedIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex

    // 제안이 변경될 때마다 선택 인덱스 초기화
    useEffect(() => {
      setInternalSelectedIndex(0)
    }, [suggestions])

    // 선택된 항목이 보이도록 스크롤
    useEffect(() => {
      if (listRef.current && selectedIndex >= 0) {
        const selectedItem = listRef.current.children[selectedIndex] as HTMLElement
        if (selectedItem) {
          selectedItem.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          })
        }
      }
    }, [selectedIndex])

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onDismiss()
          break
      }
    }

    // 마우스 호버 시 선택 인덱스 업데이트
    const handleMouseEnter = (index: number) => {
      setInternalSelectedIndex(index)
    }

    // 제안 클릭 핸들러
    const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
      onSelect(suggestion)
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 w-full bg-background border border-border rounded-md shadow-lg',
          position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
          className
        )}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {isLoading ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              AI가 제안을 생성하고 있습니다...
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1"
            role="listbox"
            aria-label="자동완성 제안"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-sm cursor-pointer transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  index === selectedIndex && 'bg-accent text-accent-foreground'
                )}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => handleMouseEnter(index)}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {suggestion.text}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {suggestion.type === 'word' && '단어'}
                      {suggestion.type === 'phrase' && '구문'}
                      {suggestion.type === 'sentence' && '문장'}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tab으로 선택
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-3 text-center text-sm text-muted-foreground">
            제안할 내용이 없습니다
          </div>
        )}
      </div>
    )
  }
)

Autocomplete.displayName = 'Autocomplete'
