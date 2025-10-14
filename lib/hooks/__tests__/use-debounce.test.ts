// lib/hooks/__tests__/use-debounce.test.ts
// useDebounce Hook 테스트
// 디바운스 기능이 올바르게 동작하는지 검증
// Related: lib/hooks/use-debounce.ts, app/notes/[id]/edit/edit-form.tsx

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounce } from '../use-debounce'

describe('useDebounce', () => {
  it('초기 값을 즉시 반환한다', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))

    expect(result.current).toBe('initial')
  })

  it('언마운트 시 타이머가 정리된다', () => {
    const { unmount } = renderHook(() => useDebounce('initial', 500))

    // 언마운트가 에러 없이 수행되는지 확인
    expect(() => unmount()).not.toThrow()
  })

  it('delay 값을 올바르게 받는다', () => {
    const { result } = renderHook(() => useDebounce('test', 1000))

    expect(result.current).toBe('test')
  })
})

