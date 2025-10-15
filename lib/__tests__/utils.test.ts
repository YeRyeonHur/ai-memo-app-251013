// lib/__tests__/utils.test.ts
// 유틸리티 함수 테스트
// truncateText 함수의 텍스트 트렁케이션 동작 검증
// Related: lib/utils.ts, app/notes/note-card.tsx

import { describe, it, expect } from 'vitest'
import { truncateText } from '../utils'

describe('truncateText', () => {
  it('빈 문자열을 처리한다', () => {
    expect(truncateText('')).toBe('')
  })

  it('150자 이하 텍스트는 그대로 반환한다', () => {
    const text = '짧은 텍스트'
    expect(truncateText(text)).toBe(text)
  })

  it('150자 초과 텍스트는 말줄임표를 추가한다', () => {
    const text = 'a'.repeat(200)
    const result = truncateText(text)
    
    expect(result.length).toBe(153) // 150 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('줄바꿈을 공백으로 변환한다', () => {
    const text = '첫 번째 줄\n두 번째 줄\n세 번째 줄'
    const result = truncateText(text)
    
    expect(result).toBe('첫 번째 줄 두 번째 줄 세 번째 줄')
    expect(result).not.toContain('\n')
  })

  it('연속된 공백을 하나의 공백으로 변환한다', () => {
    const text = '여러   개의    공백'
    const result = truncateText(text)
    
    expect(result).toBe('여러 개의 공백')
  })

  it('정확히 150자인 텍스트는 말줄임표를 추가하지 않는다', () => {
    const text = 'a'.repeat(150)
    const result = truncateText(text)
    
    expect(result.length).toBe(150)
    expect(result.endsWith('...')).toBe(false)
  })

  it('커스텀 길이로 자를 수 있다', () => {
    const text = 'a'.repeat(100)
    const result = truncateText(text, 50)
    
    expect(result.length).toBe(53) // 50 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('앞뒤 공백을 제거한다', () => {
    const text = '   앞뒤 공백   '
    const result = truncateText(text)
    
    expect(result).toBe('앞뒤 공백')
  })
})

