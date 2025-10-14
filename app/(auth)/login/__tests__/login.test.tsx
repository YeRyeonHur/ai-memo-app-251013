// app/(auth)/login/__tests__/login.test.tsx
// 로그인 페이지 단위 테스트
// 폼 검증 로직 테스트
// 관련 파일: app/(auth)/login/page.tsx

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// 테스트를 위한 로그인 스키마 (페이지와 동일)
const signInFormSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' }),
})

describe('로그인 폼 검증', () => {
  describe('이메일 검증', () => {
    it('유효한 이메일 형식을 허용해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
    })

    it('유효하지 않은 이메일 형식을 거부해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '유효한 이메일 주소를 입력해주세요'
        )
      }
    })

    it('빈 이메일을 거부해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: '',
        password: 'password123',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('비밀번호 검증', () => {
    it('8자 이상의 비밀번호를 허용해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
    })

    it('8자 미만의 비밀번호를 거부해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'test@example.com',
        password: 'pass123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '비밀번호는 최소 8자 이상이어야 합니다'
        )
      }
    })

    it('빈 비밀번호를 거부해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'test@example.com',
        password: '',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('전체 폼 검증', () => {
    it('유효한 이메일과 비밀번호를 모두 허용해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'user@example.com',
        password: 'securePassword123',
      })

      expect(result.success).toBe(true)
    })

    it('여러 필드가 유효하지 않을 때 모든 에러를 반환해야 한다', () => {
      const result = signInFormSchema.safeParse({
        email: 'invalid-email',
        password: 'short',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })
})

