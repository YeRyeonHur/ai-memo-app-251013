// app/(auth)/layout.tsx
// 인증 관련 페이지들의 레이아웃
// 회원가입, 로그인 페이지 등에 적용되는 공통 레이아웃
// 관련 파일: app/(auth)/signup/page.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-background">{children}</div>
}


