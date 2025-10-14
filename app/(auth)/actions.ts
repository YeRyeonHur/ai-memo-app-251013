// app/(auth)/actions.ts
// 인증 관련 Server Actions (회원가입, 로그인, 로그아웃)
// 서버 사이드에서 Supabase Auth API 호출 처리
// 관련 파일: lib/supabase/server.ts, app/(auth)/signup/page.tsx

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// 회원가입 스키마 정의
const signUpSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, {
      message: '비밀번호는 특수문자를 1개 이상 포함해야 합니다',
    }),
})

export type SignUpFormData = z.infer<typeof signUpSchema>

export async function signUpWithEmail(formData: SignUpFormData) {
  // 입력값 검증
  const validatedFields = signUpSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  // 먼저 이메일 중복 체크 (Admin 클라이언트 사용)
  try {
    const adminClient = createAdminClient()
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (!listError && users) {
      const existingUser = users.find(user => user.email === email)
      if (existingUser) {
        return {
          error: { message: '이미 사용 중인 이메일 주소입니다' },
        }
      }
    }
  } catch (adminError) {
    // Admin API 사용 불가 시 일반 signUp으로 진행 (키가 없는 경우)
    console.log('Admin check skipped:', adminError)
  }

  const supabase = await createClient()
  
  // Supabase Auth를 통한 회원가입
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        email_confirmed: true, // 개발 환경에서 이메일 자동 확인
      }
    },
  })

  if (error) {
    // 에러 메시지 한국어 변환
    let errorMessage = '회원가입에 실패했습니다'
    
    // 중복 이메일 체크 (다양한 케이스 처리)
    if (
      error.message.includes('already registered') || 
      error.message.includes('already been registered') ||
      error.message.includes('User already registered') ||
      error.status === 422
    ) {
      errorMessage = '이미 사용 중인 이메일 주소입니다'
      return {
        error: { message: errorMessage },
      }
    } 
    
    if (error.message.includes('Invalid email')) {
      errorMessage = '유효하지 않은 이메일 주소입니다'
    } else if (error.message.includes('Password')) {
      errorMessage = '비밀번호 형식이 올바르지 않습니다'
    } else if (error.message.includes('network')) {
      errorMessage = '네트워크 연결을 확인해주세요'
    }

    return {
      error: { message: `${errorMessage} (${error.message})` },
    }
  }
  
  // 세션이 없는 경우 (이메일 확인 대기 중)
  // 이미 같은 이메일의 미확인 계정이 있는지 체크
  if (!data.session && data.user) {
    // 이미 사용자가 생성되었다면 이메일 확인만 대기 중
    return { success: true, requiresEmailVerification: true }
  }

  // 회원가입 성공 (세션 존재)
  return { success: true, requiresEmailVerification: false }
}

