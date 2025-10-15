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

/**
 * 스타일과 길이를 지정하여 노트 요약 생성을 위한 프롬프트를 생성합니다
 * 
 * @param content - 요약할 노트 내용
 * @param style - 요약 스타일 ('bullet' | 'numbered' | 'paragraph' | 'keywords')
 * @param length - 요약 길이 ('short' | 'medium' | 'detailed')
 * @returns 스타일별 요약 생성을 위한 프롬프트
 */
export function createSummaryWithStylePrompt(
  content: string, 
  style: 'bullet' | 'numbered' | 'paragraph' | 'keywords',
  length: 'short' | 'medium' | 'detailed'
): string {
  const styleInstructions = {
    bullet: '- 각 불릿은 한 문장으로 핵심 포인트를 표현\n- 불릿 포인트는 \'-\' 기호로 시작',
    numbered: '- 각 항목은 번호와 함께 핵심 포인트를 표현\n- 1., 2., 3. 형태로 번호 매기기',
    paragraph: '- 연속된 문단 형태로 자연스럽게 요약\n- 각 문단은 하나의 주요 주제를 다룸',
    keywords: '- 핵심 키워드와 짧은 설명으로 구성\n- 키워드: 설명 형태로 작성'
  }

  const lengthInstructions = {
    short: '2-3개의 핵심 포인트만 포함하여 간결하게',
    medium: '3-6개의 주요 포인트를 포함하여 균형있게',
    detailed: '6-10개의 상세한 포인트를 포함하여 자세하게'
  }

  return `당신은 노트 내용을 분석하여 핵심을 요약하는 AI 어시스턴트입니다.

다음 노트의 내용을 ${lengthInstructions[length]} 요약해주세요.

**요구사항:**
- ${styleInstructions[style]}
- 원문의 주요 아이디어를 정확하게 반영
- 한국어로 자연스럽게 작성
- 불필요한 설명이나 부연 설명 제외

**노트 내용:**
${content}

**요약:**`
}

/**
 * 태그 개수를 지정하여 노트 태그 생성을 위한 프롬프트를 생성합니다
 * 
 * @param content - 태그를 생성할 노트 내용
 * @param count - 생성할 태그 개수 (3 | 6 | 9)
 * @returns 개수별 태그 생성을 위한 프롬프트
 */
export function createTagsWithCountPrompt(content: string, count: 3 | 6 | 9): string {
  const countInstructions = {
    3: '정확히 3개의 핵심 태그만 생성',
    6: '정확히 6개의 관련 태그를 생성',
    9: '정확히 9개의 상세한 태그를 생성'
  }

  return `당신은 노트 내용을 분석하여 관련 태그를 생성하는 AI 어시스턴트입니다.

다음 노트의 내용을 분석하여 ${countInstructions[count]}해주세요.

**요구사항:**
- 노트의 주제, 카테고리, 키워드를 반영한 태그
- 한국어로 작성
- 각 태그는 1-3 단어로 간결하게
- 정확히 ${count}개의 태그
- 쉼표로 구분하여 나열
- 태그는 소문자로 작성

**노트 내용:**
${content}

**태그 (쉼표로 구분):**`
}

