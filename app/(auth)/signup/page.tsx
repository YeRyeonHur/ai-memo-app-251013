// app/(auth)/signup/page.tsx
// 회원가입 페이지 - 이메일/비밀번호 입력 폼
// 폼 검증 및 Server Action 호출을 통한 회원가입 처리
// 관련 파일: app/(auth)/actions.ts, lib/supabase/client.ts

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUpWithEmail } from '../actions'
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

// 클라이언트 사이드 폼 검증 스키마
const signUpFormSchema = z
  .object({
    email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
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

type SignUpFormValues = z.infer<typeof signUpFormSchema>

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error(decodeURIComponent(error))
    }
  }, [searchParams])

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true)

    try {
      const result = await signUpWithEmail({
        email: values.email,
        password: values.password,
      })

      if (result?.error) {
        if ('message' in result.error) {
          toast.error(result.error.message)
        } else {
          // 필드별 에러 처리
          if (result.error.email) {
            form.setError('email', { message: result.error.email[0] })
          }
          if (result.error.password) {
            form.setError('password', { message: result.error.password[0] })
          }
        }
      } else if (result?.success) {
        // 회원가입 성공
        if (result.requiresEmailVerification) {
          toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.', {
            duration: 5000,
          })
          // 폼 리셋
          form.reset()
        } else {
          toast.success('회원가입이 완료되었습니다')
          router.push('/notes')
        }
      }
    } catch (error) {
      toast.error('회원가입 중 오류가 발생했습니다')
      console.error('Sign up error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            이메일과 비밀번호로 계정을 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="최소 8자, 특수문자 1개 이상"
                        disabled={isLoading}
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '회원가입 중...' : '회원가입'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium underline">
              로그인
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

