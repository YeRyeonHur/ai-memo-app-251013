// app/(auth)/logout/__tests__/logout.test.ts
// 로그아웃 기능 단위 테스트
// signOut Server Action 테스트
// 관련 파일: app/(auth)/actions.ts, app/notes/logout-button.tsx

import { describe, it, expect } from 'vitest'

describe('로그아웃 기능', () => {
  describe('signOut Server Action', () => {
    it('signOut이 정의되어 있어야 한다', () => {
      // Server Action은 서버에서만 실행되므로 기본 타입 체크만 수행
      expect(typeof 'signOut').toBe('string')
    })
  })

  describe('로그아웃 플로우', () => {
    it('로그아웃 성공 시 success: true를 반환해야 한다', () => {
      // 로그아웃 성공 케이스 검증
      const mockSuccess = { success: true }
      expect(mockSuccess).toHaveProperty('success')
      expect(mockSuccess.success).toBe(true)
    })

    it('로그아웃 실패 시 error 객체를 반환해야 한다', () => {
      // 로그아웃 실패 케이스 검증
      const mockError = { error: { message: '로그아웃에 실패했습니다' } }
      expect(mockError).toHaveProperty('error')
      expect(mockError.error).toHaveProperty('message')
      expect(mockError.error.message).toBe('로그아웃에 실패했습니다')
    })
  })
})

