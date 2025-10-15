// app/page.tsx
// 홈페이지 - AI 메모장 랜딩 페이지
// 인증 상태에 따라 다른 UI 표시 (로그인 시 노트 보기, 미로그인 시 회원가입/로그인)
// 관련 파일: app/(auth)/signup/page.tsx, app/notes/page.tsx, lib/hooks/use-auth.ts, components/ui/dynamic-gradient-background.tsx

'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicGradientBackground } from "@/components/ui/dynamic-gradient-background";

export default function Home() {
  const { user, isLoading } = useAuth();

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading) {
    return (
      <DynamicGradientBackground>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-2xl">
            <div className="text-6xl mb-4">
              🌸💛✨
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              AI 메모장 🌼
            </h1>
            <p className="text-xl text-muted-foreground">
              AI 기반 스마트 메모 관리 서비스 🎀
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
            <div className="text-4xl mt-8 opacity-50">
              💖 🌺 🦋 🍯
            </div>
          </div>
        </div>
      </DynamicGradientBackground>
    );
  }

  // 로그인된 사용자에게는 노트 보기 버튼 표시
  if (user) {
    return (
      <DynamicGradientBackground>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-2xl">
            <div className="text-6xl mb-4">
              🌸💛✨
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              AI 메모장 🌼
            </h1>
            <p className="text-xl text-muted-foreground">
              안녕하세요! {user.email}님 🎀
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/notes">
                  📝 내 노트 보기
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/notes/new">
                  ✨ 새 노트 작성
                </Link>
              </Button>
            </div>
            <div className="text-4xl mt-8 opacity-50">
              💖 🌺 🦋 🍯
            </div>
          </div>
        </div>
      </DynamicGradientBackground>
    );
  }

  // 로그인되지 않은 사용자에게는 회원가입/로그인 버튼 표시
  return (
    <DynamicGradientBackground>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="text-6xl mb-4">
            🌸💛✨
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AI 메모장 🌼
          </h1>
          <p className="text-xl text-muted-foreground">
            AI 기반 스마트 메모 관리 서비스 🎀
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href="/signup">
                🌻 회원가입
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">
                🌸 로그인
              </Link>
            </Button>
          </div>
          <div className="text-4xl mt-8 opacity-50">
            💖 🌺 🦋 🍯
          </div>
        </div>
      </div>
    </DynamicGradientBackground>
  );
}
