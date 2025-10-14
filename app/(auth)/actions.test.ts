// app/(auth)/actions.test.ts
// Server Actions 단위 테스트
// 로그인/회원가입 액션 검증 테스트
// 관련 파일: app/(auth)/actions.ts

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// 테스트를 위한 스키마 (actions.ts와 동일)
const signInSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' }),
})

const signUpSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, {
      message: '비밀번호는 특수문자를 1개 이상 포함해야 합니다',
    }),
})

describe('Server Action 스키마 검증', () => {
  describe('로그인 스키마', () => {
    it('유효한 로그인 데이터를 허용해야 한다', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
    })

    it('유효하지 않은 이메일을 거부해야 한다', () => {
      const result = signInSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      })

      expect(result.success).toBe(false)
    })

    it('짧은 비밀번호를 거부해야 한다', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('회원가입 스키마', () => {
    it('유효한 회원가입 데이터를 허용해야 한다', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'password123!',
      })

      expect(result.success).toBe(true)
    })

    it('특수문자가 없는 비밀번호를 거부해야 한다', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '비밀번호는 특수문자를 1개 이상 포함해야 합니다'
        )
      }
    })

    it('짧고 특수문자가 없는 비밀번호를 거부해야 한다', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'pass',
      })

      expect(result.success).toBe(false)
    })
  })
})

