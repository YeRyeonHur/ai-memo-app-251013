// app/logout-all/page.tsx
// 강제 로그아웃 및 쿠키 삭제 유틸리티 페이지
// 개발/디버깅 용도
// 관련 파일: app/(auth)/actions.ts

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LogoutAllPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const handleLogoutAll = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Supabase 로그아웃
      await supabase.auth.signOut()
      
      // 모든 쿠키 삭제
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      
      // 로컬 스토리지 삭제
      localStorage.clear()
      sessionStorage.clear()
      
      setDone(true)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 페이지 로드 시 자동 실행
    handleLogoutAll()
  }, [])

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>✅ 로그아웃 완료 🌸</CardTitle>
            <CardDescription>
              모든 세션과 쿠키가 삭제되었습니다 💛
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              🌸 로그인 페이지로 이동
            </Button>
            <Button 
              onClick={() => router.push('/')} 
              variant="outline"
              className="w-full"
            >
              🏠 홈으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">로그아웃 중... 🌸</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

