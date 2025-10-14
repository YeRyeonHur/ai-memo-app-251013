// app/(auth)/reset-password/__tests__/reset-password.test.tsx
// 새 비밀번호 입력 페이지 단위 테스트
// 폼 검증 로직 테스트
// 관련 파일: app/(auth)/reset-password/page.tsx

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// 테스트를 위한 스키마 (페이지와 동일)
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
      .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, {
        message: '비밀번호는 특수문자를 1개 이상 포함해야 합니다',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

describe('새 비밀번호 입력 폼 검증', () => {
  describe('비밀번호 검증', () => {
    it('유효한 비밀번호를 허용해야 한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'password123!',
        confirmPassword: 'password123!',
      })

      expect(result.success).toBe(true)
    })

    it('8자 미만의 비밀번호를 거부해야 한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'pass12!',
        confirmPassword: 'pass12!',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '비밀번호는 최소 8자 이상이어야 합니다'
        )
      }
    })

    it('특수문자가 없는 비밀번호를 거부해야 한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'password123',
        confirmPassword: 'password123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '비밀번호는 특수문자를 1개 이상 포함해야 합니다'
        )
      }
    })
  })

  describe('비밀번호 일치 검증', () => {
    it('일치하는 비밀번호를 허용해야 한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'password123!',
        confirmPassword: 'password123!',
      })

      expect(result.success).toBe(true)
    })

    it('일치하지 않는 비밀번호를 거부해야 한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'password123!',
        confirmPassword: 'password456!',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '비밀번호가 일치하지 않습니다'
        )
      }
    })
  })
})

