// app/(auth)/forgot-password/page.tsx
// 비밀번호 재설정 요청 페이지 - 이메일 입력
// 폼 검증 및 Server Action을 통한 재설정 이메일 발송
// 관련 파일: app/(auth)/actions.ts, app/(auth)/login/page.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { requestPasswordReset } from '../actions'
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
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요' }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true)

    try {
      const result = await requestPasswordReset({ email: values.email })

      if (result?.error) {
        toast.error(result.error.message)
      } else if (result?.success) {
        setEmailSent(true)
        toast.success('비밀번호 재설정 이메일이 발송되었습니다')
        form.reset()
      }
    } catch (error) {
      toast.error('비밀번호 재설정 요청 중 오류가 발생했습니다')
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">비밀번호 재설정</CardTitle>
          <CardDescription>
            {emailSent
              ? '이메일을 확인해주세요'
              : '가입하신 이메일 주소를 입력해주세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                비밀번호 재설정 링크가 이메일로 발송되었습니다.
                <br />
                이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
              </p>
              <p className="text-xs text-muted-foreground">
                이메일이 도착하지 않았나요? 스팸 폴더를 확인해보세요.
              </p>
            </div>
          ) : (
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
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '전송 중...' : '재설정 링크 보내기'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium underline">
              로그인 페이지로 돌아가기
            </Link>
          </div>
          {emailSent && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              다시 보내기
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

