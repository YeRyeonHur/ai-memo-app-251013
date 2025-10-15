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

# Google Gemini API Configuration
# AI 기반 노트 요약 및 태그 생성 기능에 사용
GEMINI_API_KEY=your-gemini-api-key
```

3. Gemini API 키 발급

AI 요약 및 태깅 기능을 사용하려면 Google Gemini API 키가 필요합니다:

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. "Create API key" 클릭
3. 프로젝트 선택 또는 새 프로젝트 생성
4. 생성된 API 키를 `.env.local`의 `GEMINI_API_KEY`에 입력

> **참고**: Gemini API 키는 서버 사이드에서만 사용되며, 클라이언트에 노출되지 않습니다.

4. 데이터베이스 마이그레이션 적용

```bash
pnpm db:push
```

5. 개발 서버 실행

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
│   ├── gemini/          # Gemini API 클라이언트 및 유틸리티
│   │   ├── client.ts    # API 클라이언트 초기화
│   │   ├── prompts.ts   # 요약/태그 프롬프트 생성
│   │   ├── types.ts     # TypeScript 타입 정의
│   │   ├── errors.ts    # 에러 핸들링
│   │   ├── utils.ts     # 유틸리티 함수
│   │   └── __tests__/   # 단위 테스트
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

## 🤖 Gemini API 설정

### API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. Google 계정으로 로그인
3. "Create API key" 버튼 클릭
4. 기존 Google Cloud 프로젝트 선택 또는 새 프로젝트 생성
5. 생성된 API 키 복사

### 환경변수 설정

`.env.local` 파일에 다음 항목을 추가하세요:

```bash
# Google Gemini API
GEMINI_API_KEY=your-api-key-here
```

### 사용 예시

#### 기본 텍스트 생성

```typescript
import { generateText } from '@/lib/gemini/client'

// 텍스트 생성
const response = await generateText('안녕하세요', {
  temperature: 0.7,
  maxOutputTokens: 1024,
})

console.log(response.text)
```

#### 노트 요약 생성

```typescript
import { generateSummary, getSummary } from '@/app/notes/ai-actions'

// 노트 요약 생성 (Server Action)
const result = await generateSummary(noteId)

if (result.success) {
  console.log('요약:', result.summary)
  console.log('캐시됨:', result.cached) // 5분 이내 생성된 요약은 재사용
} else {
  console.error('에러:', result.error)
}

// 요약 조회
const summaryResult = await getSummary(noteId)

if (summaryResult.success && summaryResult.summary) {
  console.log('요약:', summaryResult.summary.summary)
  console.log('생성일:', summaryResult.summary.createdAt)
}
```

### API 연결 테스트

터미널에서 다음 명령어로 Gemini API 연결을 테스트할 수 있습니다:

```bash
pnpm test lib/gemini
```

### 주요 기능

- **텍스트 생성**: `generateText()` - 프롬프트 기반 텍스트 생성
- **연결 테스트**: `testGeminiConnection()` - API 키 검증 및 연결 테스트
- **프롬프트 검증**: `validatePrompt()` - 입력 프롬프트 유효성 검사
- **토큰 추정**: `estimateTokenCount()` - 텍스트의 대략적인 토큰 수 계산
- **노트 요약 생성**: `generateSummary()` - 노트 내용을 3-6개 불릿 포인트로 자동 요약
- **요약 조회**: `getSummary()` - 노트의 최신 요약 조회

### 에러 핸들링

Gemini API는 다음 에러 타입을 지원합니다:

- `API_KEY_MISSING`: API 키 누락
- `API_KEY_INVALID`: API 키 유효하지 않음
- `NETWORK_ERROR`: 네트워크 연결 실패
- `RATE_LIMIT_ERROR`: 요청 한도 초과
- `TOKEN_LIMIT_ERROR`: 토큰 제한 초과 (8,000 토큰)
- `TIMEOUT_ERROR`: 요청 시간 초과

모든 에러는 `parseGeminiError()` 함수를 통해 사용자 친화적인 한국어 메시지로 변환됩니다.

### 제한사항

- **토큰 제한**: 입력 + 출력 합계 8,000 토큰
- **모델**: `gemini-2.0-flash` (빠른 응답 속도)
- **타임아웃**: 기본 10초 (환경변수로 설정 가능)

자세한 내용은 [lib/gemini](./lib/gemini) 디렉토리의 코드와 테스트를 참조하세요.

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

- [x] **Epic 4: AI 요약 및 태깅 (진행 중)**
  - [x] Story 4.1: Gemini API 설정 및 연동
  - [x] Story 4.2: 노트 내용 기반 자동 요약 생성

### 진행 예정

- [ ] Epic 2: 노트 관리
  - [ ] Story 2.1: 노트 생성
  - [ ] Story 2.2: 노트 목록 조회
  - [ ] 기타...
- [ ] Epic 3: 음성 메모
- [ ] Epic 4: AI 요약 및 태깅
  - [ ] Story 4.3: 노트 자동 태그 생성
  - [ ] Story 4.4: AI 처리 상태 표시
  - [ ] 기타...
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
