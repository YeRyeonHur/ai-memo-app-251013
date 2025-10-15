// app/(auth)/actions.ts
// 인증 관련 Server Actions (회원가입, 로그인, 로그아웃)
// 서버 사이드에서 Supabase Auth API 호출 처리
// 관련 파일: lib/supabase/server.ts, app/(auth)/signup/page.tsx, lib/errors/auth-errors.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { parseAuthError, logAuthError } from '@/lib/errors/auth-errors'

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
    // 에러 로그 기록
    logAuthError(error, { email, action: 'signup' })
    
    // 에러 메시지 파싱
    const errorMessage = parseAuthError(error)
    
    return {
      error: { 
        message: process.env.NODE_ENV === 'development' 
          ? `${errorMessage} (${error.message})` 
          : errorMessage 
      },
    }
  }
  
  // 세션이 없는 경우 (이메일 확인 대기 중)
  // 이미 같은 이메일의 미확인 계정이 있는지 체크
  if (!data.session && data.user) {
    // 이미 사용자가 생성되었다면 이메일 확인만 대기 중
    return { success: true, requiresEmailVerification: true }
  }

  // 회원가입 성공 (세션 존재) - user_profiles 레코드 생성
  if (data.user) {
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          onboarding_completed: false,
        })

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
        // 프로필 생성 실패는 회원가입을 막지 않음 (나중에 생성 가능)
      }
    } catch (profileInsertError) {
      console.error('Error creating user profile:', profileInsertError)
    }
  }

  return { success: true, requiresEmailVerification: false }
}

// 로그인 스키마 정의
const signInSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' }),
})

export type SignInFormData = z.infer<typeof signInSchema>

export async function signInWithEmail(formData: SignInFormData) {
  // 입력값 검증
  const validatedFields = signInSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  const supabase = await createClient()

  // Supabase Auth를 통한 로그인
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // 에러 로그 기록
    logAuthError(error, { email, action: 'login' })
    
    // 에러 메시지 파싱
    const errorMessage = parseAuthError(error)
    
    return {
      error: { 
        message: process.env.NODE_ENV === 'development' 
          ? `${errorMessage} (${error.message})` 
          : errorMessage 
      },
    }
  }

  // 로그인 성공 - 세션 확인
  if (!data.session) {
    return {
      error: { message: '로그인에 실패했습니다. 다시 시도해주세요.' },
    }
  }

  // 로그인 성공
  return { success: true }
}

// 로그아웃
export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    // 에러 로그 기록
    logAuthError(error, { action: 'signout' })
    
    return {
      error: { message: '로그아웃에 실패했습니다' },
    }
  }

  return { success: true }
}

// 비밀번호 재설정 요청 스키마
const passwordResetRequestSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
})

export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>

export async function requestPasswordReset(formData: PasswordResetRequestData) {
  // 입력값 검증
  const validatedFields = passwordResetRequestSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  const supabase = await createClient()

  // Supabase Auth를 통한 비밀번호 재설정 이메일 발송
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    // 에러 로그 기록 (보안상 이메일은 기록하지 않음)
    logAuthError(error, { action: 'password_reset_request' })

    // 보안상 이메일 존재 여부를 노출하지 않음
    // 모든 경우에 성공 메시지 반환
  }

  // 보안을 위해 이메일 존재 여부와 관계없이 동일한 성공 메시지 반환
  return { success: true }
}

// 비밀번호 업데이트 스키마
const passwordUpdateSchema = z
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

export type PasswordUpdateData = z.infer<typeof passwordUpdateSchema>

export async function updatePassword(formData: PasswordUpdateData) {
  // 입력값 검증
  const validatedFields = passwordUpdateSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { password } = validatedFields.data

  const supabase = await createClient()

  // Supabase Auth를 통한 비밀번호 업데이트
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    // 에러 로그 기록
    logAuthError(error, { action: 'password_update' })
    
    // 에러 메시지 파싱
    const errorMessage = parseAuthError(error)
    
    return {
      error: { 
        message: process.env.NODE_ENV === 'development' 
          ? `${errorMessage} (${error.message})` 
          : errorMessage 
      },
    }
  }

  // 비밀번호 변경 성공
  return { success: true }
}

// 온보딩 완료 처리
export async function completeOnboarding() {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: { message: '인증이 필요합니다' },
    }
  }

  // user_profiles 업데이트
  const { error } = await supabase
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    // 에러 로그 기록
    logAuthError(error, { user_id: user.id, action: 'complete_onboarding' })
    
    return {
      error: { message: '온보딩 완료 처리에 실패했습니다' },
    }
  }

  return { success: true }
}

