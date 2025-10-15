// components/ui/__tests__/autocomplete.test.tsx
// 자동완성 UI 컴포넌트 테스트
// 렌더링, 키보드 네비게이션, 제안 선택 등의 기능 테스트
// Related: components/ui/autocomplete.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Autocomplete } from '../autocomplete'
import type { AutocompleteSuggestion } from '../autocomplete'

// Mock 데이터
const mockSuggestions: AutocompleteSuggestion[] = [
  {
    id: '1',
    text: '첫 번째 제안',
    confidence: 0.9,
    type: 'sentence'
  },
  {
    id: '2',
    text: '두 번째 제안',
    confidence: 0.8,
    type: 'phrase'
  },
  {
    id: '3',
    text: '세 번째 제안',
    confidence: 0.7,
    type: 'word'
  }
]

describe('Autocomplete', () => {
  const defaultProps = {
    suggestions: mockSuggestions,
    isLoading: false,
    isVisible: true,
    onSelect: vi.fn(),
    onDismiss: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('제안이 없을 때 렌더링되지 않아야 한다', () => {
    render(
      <Autocomplete
        {...defaultProps}
        isVisible={false}
      />
    )

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('로딩 상태일 때 로딩 메시지를 표시해야 한다', () => {
    render(
      <Autocomplete
        {...defaultProps}
        isLoading={true}
        suggestions={[]}
      />
    )

    expect(screen.getByText('AI가 제안을 생성하고 있습니다...')).toBeInTheDocument()
  })

  it('제안이 없을 때 적절한 메시지를 표시해야 한다', () => {
    render(
      <Autocomplete
        {...defaultProps}
        suggestions={[]}
      />
    )

    expect(screen.getByText('제안할 내용이 없습니다')).toBeInTheDocument()
  })

  it('제안 목록을 올바르게 렌더링해야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('첫 번째 제안')).toBeInTheDocument()
    expect(screen.getByText('두 번째 제안')).toBeInTheDocument()
    expect(screen.getByText('세 번째 제안')).toBeInTheDocument()
  })

  it('제안의 타입과 신뢰도를 표시해야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    expect(screen.getByText('문장')).toBeInTheDocument()
    expect(screen.getByText('구문')).toBeInTheDocument()
    expect(screen.getByText('단어')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('제안을 클릭하면 onSelect가 호출되어야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    const firstSuggestion = screen.getByText('첫 번째 제안')
    fireEvent.click(firstSuggestion)

    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[0])
  })

  it('키보드 네비게이션이 올바르게 작동해야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    const listbox = screen.getByRole('listbox')
    
    // ArrowDown 키 테스트
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    expect(screen.getByText('두 번째 제안').closest('li')).toHaveClass('bg-accent')

    // ArrowUp 키 테스트
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })
    expect(screen.getByText('첫 번째 제안').closest('li')).toHaveClass('bg-accent')

    // Enter 키 테스트
    fireEvent.keyDown(listbox, { key: 'Enter' })
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSuggestions[0])

    // Escape 키 테스트
    fireEvent.keyDown(listbox, { key: 'Escape' })
    expect(defaultProps.onDismiss).toHaveBeenCalled()
  })

  it('마우스 호버 시 선택 상태가 변경되어야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    const secondSuggestion = screen.getByText('두 번째 제안')
    fireEvent.mouseEnter(secondSuggestion)

    expect(secondSuggestion.closest('li')).toHaveClass('bg-accent')
  })

  it('position prop에 따라 올바른 위치에 렌더링되어야 한다', () => {
    const { rerender } = render(
      <Autocomplete {...defaultProps} position="top" />
    )

    const container = screen.getByRole('listbox').closest('div')
    expect(container).toHaveClass('bottom-full', 'mb-1')

    rerender(<Autocomplete {...defaultProps} position="bottom" />)
    expect(container).toHaveClass('top-full', 'mt-1')
  })

  it('접근성 속성이 올바르게 설정되어야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-label', '자동완성 제안')

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('신뢰도 바가 올바르게 표시되어야 한다', () => {
    render(<Autocomplete {...defaultProps} />)

    const confidenceBars = screen.getAllByRole('progressbar')
    expect(confidenceBars).toHaveLength(3)

    // 첫 번째 제안의 신뢰도 바 (90%)
    const firstBar = confidenceBars[0]
    expect(firstBar).toHaveStyle({ width: '90%' })
  })
})
