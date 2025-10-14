# AI 메모장 (AI Memo Hands-on)

AI 기반 스마트 메모 관리 서비스

## 📋 프로젝트 소개

AI 메모장은 Google Gemini API를 활용하여 음성 메모를 텍스트로 변환하고, 자동으로 요약 및 태그를 생성하는 스마트 노트 관리 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- pnpm (권장 패키지 매니저)
- Supabase 계정

### 환경 설정

1. 저장소 클론 및 의존성 설치

```bash
pnpm install
```

2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값을 입력하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Database Configuration (Drizzle ORM)
# Supabase 대시보드 > Project Settings > Database > Connection string (Transaction)에서 복사
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

3. 데이터베이스 마이그레이션 적용

```bash
pnpm db:push
```

4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 🛠️ 기술 스택

- **프레임워크**: Next.js 15 (App Router, Server Actions)
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **DB/인증**: Supabase (Postgres, Auth, Storage)
- **ORM**: Drizzle ORM
- **AI 모델**: Google Gemini API
- **호스팅**: Vercel

## 📁 프로젝트 구조

```
ai-memo-hands-on/
├── app/
│   ├── (auth)/          # 인증 관련 페이지 (회원가입, 로그인)
│   ├── notes/           # 노트 관리 페이지
│   ├── layout.tsx       # 루트 레이아웃
│   └── page.tsx         # 홈페이지
├── components/
│   └── ui/              # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase/        # Supabase 클라이언트
│   └── utils.ts         # 유틸리티 함수
├── docs/                # 프로젝트 문서
└── drizzle/             # 데이터베이스 스키마 및 마이그레이션
```

## 🔧 주요 명령어

### 개발

```bash
pnpm dev          # 개발 서버 실행
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 실행
pnpm lint         # ESLint 실행
```

### 테스트

```bash
pnpm test        # 테스트 실행
pnpm test:ui     # 테스트 UI 실행
pnpm test:run    # CI 모드 테스트 실행
```

### 데이터베이스 (Drizzle ORM)

```bash
pnpm db:generate    # 마이그레이션 파일 생성
pnpm db:push        # 스키마 DB에 직접 반영 (개발용)
pnpm db:migrate     # 마이그레이션 적용 (프로덕션용)
pnpm db:studio      # Drizzle Studio 실행 (DB GUI)
pnpm db:check       # 마이그레이션 충돌 검사
```

**스키마 변경 워크플로우:**

1. `drizzle/schema.ts` 파일에서 스키마 수정
2. `pnpm db:generate` - 마이그레이션 파일 생성
3. `pnpm db:push` - 개발 DB에 적용
4. `pnpm db:studio` - Drizzle Studio로 확인

## ✅ 개발 진행 상황

### 완료된 기능

- [x] **Epic 1: 사용자 인증 (100%)**
  - [x] Story 1.1: 이메일/비밀번호 회원가입
  - [x] Story 1.2: 이메일/비밀번호 로그인
  - [x] Story 1.3: 로그아웃
  - [x] Story 1.4: 이메일 인증
  - [x] Story 1.5: 비밀번호 재설정
  - [x] Story 1.6: 보호된 라우트 미들웨어
  - [x] Story 1.7: 인증 에러 핸들링

- [x] **Epic 2: 노트 관리**
  - [x] Story 2.0: Drizzle ORM 환경 세팅 및 스키마 정의

### 진행 예정

- [ ] Epic 2: 노트 관리
  - [ ] Story 2.1: 노트 생성
  - [ ] Story 2.2: 노트 목록 조회
  - [ ] 기타...
- [ ] Epic 3: 음성 메모
- [ ] Epic 4: AI 요약 및 태깅
- [ ] Epic 5: 검색 및 필터링
- [ ] Epic 6: 데이터 내보내기

## 📚 문서

자세한 내용은 [docs](./docs) 디렉토리를 참조하세요:

- [PRD (제품 요구사항 문서)](./docs/prd.md)
- [아키텍처 문서](./docs/architecture.md)
- [Epics](./docs/epics/)
- [Stories](./docs/stories/)

## 🤝 기여 가이드

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.
