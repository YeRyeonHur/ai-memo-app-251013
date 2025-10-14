// app/page.tsx
// 홈페이지 - AI 메모장 랜딩 페이지
// 회원가입 페이지로의 링크 제공
// 관련 파일: app/(auth)/signup/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">
          AI 메모장
        </h1>
        <p className="text-xl text-muted-foreground">
          AI 기반 스마트 메모 관리 서비스
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/signup">
              회원가입
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              로그인
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
