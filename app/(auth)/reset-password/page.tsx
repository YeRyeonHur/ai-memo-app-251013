// app/(auth)/reset-password/page.tsx
// 새 비밀번호 입력 페이지
// 비밀번호 재설정 이메일 링크를 통해 접근
// 관련 파일: app/(auth)/actions.ts, app/auth/reset-password/route.ts

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { updatePassword } from '../actions'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// 클라이언트 사이드 폼 검증 스키마
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

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // 세션 확인 (재설정 링크를 통해 접근했는지 확인)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // 세션이 없으면 로그인 페이지로 리디렉션
          toast.error('유효한 재설정 링크를 사용해주세요')
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Session check error:', error)
        router.push('/login')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkSession()
  }, [router])

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true)

    try {
      const result = await updatePassword({
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      if (result?.error) {
        if ('message' in result.error) {
          toast.error(result.error.message)
        } else {
          // 필드별 에러 처리
          if (result.error.password) {
            form.setError('password', { message: result.error.password[0] })
          }
          if (result.error.confirmPassword) {
            form.setError('confirmPassword', {
              message: result.error.confirmPassword[0],
            })
          }
        }
      } else if (result?.success) {
        toast.success('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.')
        // 비밀번호 변경 후 로그아웃 및 로그인 페이지로 리디렉션
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
      }
    } catch (error) {
      toast.error('비밀번호 변경 중 오류가 발생했습니다')
      console.error('Password update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 세션 확인 중에는 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">확인 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">새 비밀번호 설정</CardTitle>
          <CardDescription>
            새로운 비밀번호를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="최소 8자, 특수문자 1개 이상"
                        disabled={isLoading}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        disabled={isLoading}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

