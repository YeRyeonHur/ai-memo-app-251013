// app/(auth)/forgot-password/__tests__/forgot-password.test.tsx
// 비밀번호 재설정 요청 페이지 단위 테스트
// 폼 검증 로직 테스트
// 관련 파일: app/(auth)/forgot-password/page.tsx

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// 테스트를 위한 스키마 (페이지와 동일)
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
})

describe('비밀번호 재설정 요청 폼 검증', () => {
  describe('이메일 검증', () => {
    it('유효한 이메일 형식을 허용해야 한다', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
    })

    it('유효하지 않은 이메일 형식을 거부해야 한다', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '유효한 이메일 주소를 입력해주세요'
        )
      }
    })

    it('빈 이메일을 거부해야 한다', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '',
      })

      expect(result.success).toBe(false)
    })
  })
})

