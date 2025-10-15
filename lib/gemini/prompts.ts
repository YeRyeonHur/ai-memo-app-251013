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

/**
 * 자동완성 제안 생성을 위한 프롬프트를 생성합니다
 * 사용자의 입력 텍스트와 컨텍스트를 기반으로 다음 문장이나 단어를 제안합니다
 * 
 * @param inputText - 사용자가 입력한 텍스트
 * @param context - 노트의 제목이나 기존 내용 (컨텍스트)
 * @param userPattern - 사용자의 작성 패턴 (선택사항)
 * @returns 자동완성 제안 생성을 위한 프롬프트
 */
export function createAutocompletePrompt(
  inputText: string,
  context: string = '',
  userPattern?: {
    commonPhrases: string[]
    writingStyle: 'formal' | 'casual' | 'academic'
    averageLength: number
  }
): string {
  const contextInfo = context ? `\n**노트 컨텍스트:**\n${context}` : ''
  
  const userStyleInfo = userPattern ? `
**사용자 작성 스타일:**
- 문체: ${userPattern.writingStyle === 'formal' ? '격식체' : userPattern.writingStyle === 'academic' ? '학술체' : '반말체'}
- 자주 사용하는 표현: ${userPattern.commonPhrases.slice(0, 5).join(', ')}
- 평균 문장 길이: ${userPattern.averageLength}자` : ''

  return `당신은 사용자의 노트 작성을 도와주는 AI 자동완성 어시스턴트입니다.

사용자가 입력한 텍스트를 분석하여 자연스럽고 유용한 자동완성 제안을 생성해주세요.

**중요한 요구사항:**
- 사용자의 입력 텍스트를 자연스럽게 완성하는 제안 생성
- 문맥에 맞는 적절한 다음 문장이나 단어 제안
- 최대 3개의 다양한 제안 옵션 제공
- 각 제안은 [타입] (신뢰도%) 형식으로 표시
- 타입: word(단어), phrase(구문), sentence(문장)
- 신뢰도: 0-100% 범위의 정확도 점수
- 한국어로 자연스럽게 작성

**문체 일관성 (매우 중요):**
- 사용자의 기존 문체를 정확히 분석하고 동일한 문체로 제안 생성
- 격식체 사용자: "입니다", "습니다", "하였습니다" 등 존댓말 사용
- 반말체 사용자: "야", "어", "지", "네" 등 반말 사용
- 학술체 사용자: "따르면", "분석 결과", "연구에 따르면" 등 학술적 표현 사용
- 사용자의 자주 사용하는 표현을 제안에 반영
- 절대로 사용자의 문체와 다른 문체로 제안하지 마세요

**사용자 입력 텍스트:**
${inputText}${contextInfo}${userStyleInfo}

**자동완성 제안 (각 줄마다 하나의 제안, 사용자 문체와 일치해야 함):**
제안텍스트 [타입] (신뢰도%)`
}

/**
 * 사용자 패턴 분석을 위한 프롬프트를 생성합니다
 * 사용자의 과거 노트들을 분석하여 작성 패턴을 파악합니다
 * 
 * @param userText - 사용자의 과거 노트 텍스트
 * @returns 사용자 패턴 분석 프롬프트
 */
export function createUserPatternAnalysisPrompt(userText: string): string {
  return `당신은 사용자의 작성 패턴을 분석하는 AI 어시스턴트입니다.

다음은 사용자가 작성한 노트들의 내용입니다. 이를 분석하여 사용자의 작성 패턴을 파악해주세요.

**분석 요구사항:**
- 자주 사용하는 표현이나 구문을 찾아주세요 (최대 10개)
- 문체가 격식체(formal), 반말체(casual), 학술체(academic) 중 어디에 해당하는지 정확히 판단해주세요
- 평균적인 문장 길이를 추정해주세요 (단어 수 기준)
- 사용자의 개인적인 표현 습관을 파악해주세요

**문체 판단 기준:**
- 격식체(formal): "입니다", "습니다", "하였습니다", "따라서", "그러므로" 등 존댓말 사용
- 반말체(casual): "야", "어", "지", "네", "구나", "그냥", "진짜", "완전" 등 반말 사용
- 학술체(academic): "연구", "분석", "결과", "데이터", "실험", "가설", "이론", "모델" 등 학술적 표현 사용

**사용자 노트 내용:**
${userText}

**분석 결과:**
자주 사용하는 표현: [자주 사용되는 표현들을 쉼표로 구분하여 나열]
문체: [formal/casual/academic 중 하나]
평균 길이: [평균 문장 길이 숫자]`
}

