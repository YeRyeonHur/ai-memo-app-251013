// lib/hooks/use-debounce.ts
// 디바운스 커스텀 Hook
// 사용자 입력을 지연시켜 불필요한 서버 요청을 줄임
// Related: app/notes/[id]/edit/edit-form.tsx, app/notes/actions.ts

'use client'

import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 지정된 delay 후에 값 업데이트
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 클린업: 컴포넌트 언마운트 또는 value/delay 변경 시 타이머 정리
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

