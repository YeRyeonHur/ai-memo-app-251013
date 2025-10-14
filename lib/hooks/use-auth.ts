// lib/hooks/use-auth.ts
// 클라이언트 컴포넌트에서 사용할 인증 상태 관리 커스텀 훅
// Supabase Auth 세션을 실시간으로 감지하고 전역 상태로 관리
// 관련 파일: lib/supabase/client.ts, app/(auth)/actions.ts, providers/auth-provider.tsx

'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 초기 세션 로드
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // 세션 변경 리스너 등록
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      // 세션 변경 시 라우터 새로고침 (서버 컴포넌트 업데이트)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return {
    user,
    session,
    isLoading,
    signOut,
  }
}

