// lib/gemini/prompts.ts
// Gemini API 프롬프트 생성 유틸리티
// 요약, 태그 생성 등의 프롬프트를 생성하는 함수 제공
// Related: lib/gemini/client.ts, app/notes/ai-actions.ts

/**
 * 노트 요약 생성을 위한 프롬프트를 생성합니다
 * 3-6개의 불릿 포인트로 구성된 요약을 요청하는 프롬프트를 반환합니다
 * 
 * @param content - 요약할 노트 내용
 * @returns 요약 생성을 위한 프롬프트
 * 
 * @example
 * ```typescript
 * const prompt = createSummaryPrompt('긴 노트 내용...')
 * const response = await generateText(prompt)
 * ```
 */
export function createSummaryPrompt(content: string): string {
  return `당신은 노트 내용을 분석하여 핵심을 요약하는 AI 어시스턴트입니다.

다음 노트의 내용을 3-6개의 불릿 포인트로 요약해주세요.

**요구사항:**
- 각 불릿은 한 문장으로 핵심 포인트를 표현
- 원문의 주요 아이디어를 정확하게 반영
- 한국어로 자연스럽게 작성
- 불필요한 설명이나 부연 설명 제외
- 불릿 포인트는 '-' 기호로 시작
- 3개 이상 6개 이하의 불릿으로 구성

**노트 내용:**
${content}

**요약:**`
}

/**
 * 노트 태그 생성을 위한 프롬프트를 생성합니다
 * 최대 6개의 관련 태그를 요청하는 프롬프트를 반환합니다
 * 
 * @param content - 태그를 생성할 노트 내용
 * @returns 태그 생성을 위한 프롬프트
 * 
 * @example
 * ```typescript
 * const prompt = createTagsPrompt('노트 내용...')
 * const response = await generateText(prompt)
 * ```
 */
export function createTagsPrompt(content: string): string {
  return `당신은 노트 내용을 분석하여 관련 태그를 생성하는 AI 어시스턴트입니다.

다음 노트의 내용을 분석하여 최대 6개의 태그를 생성해주세요.

**요구사항:**
- 노트의 주제, 카테고리, 키워드를 반영한 태그
- 한국어로 작성
- 각 태그는 1-3 단어로 간결하게
- 최소 3개, 최대 6개의 태그
- 쉼표로 구분하여 나열
- 태그는 소문자로 작성

**노트 내용:**
${content}

**태그 (쉼표로 구분):**`
}

