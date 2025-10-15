// lib/utils/user-patterns.ts
// 사용자 작성 패턴 분석 및 학습 유틸리티
// 사용자별 작성 스타일, 자주 사용하는 표현, 문체 등을 분석하고 저장
// Related: app/notes/autocomplete-actions.ts, lib/gemini/prompts.ts

export interface UserWritingPattern {
  userId: string
  commonPhrases: string[]
  writingStyle: 'formal' | 'casual' | 'academic'
  averageLength: number
  lastUpdated: Date
  noteCount: number
}

export interface PatternAnalysisResult {
  commonPhrases: string[]
  writingStyle: 'formal' | 'casual' | 'academic'
  averageLength: number
  confidence: number
}

// 로컬 스토리지 키
const PATTERN_STORAGE_KEY = 'user_writing_patterns'
const PATTERN_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간

/**
 * 사용자의 작성 패턴을 분석합니다
 * 과거 노트들을 기반으로 사용자의 작성 스타일을 파악합니다
 * 
 * @param userId - 분석할 사용자 ID
 * @param notes - 분석할 노트 배열
 * @returns 패턴 분석 결과
 */
export function analyzeUserWritingPattern(
  userId: string,
  notes: Array<{ title: string; content: string; createdAt: Date }>
): PatternAnalysisResult {
  if (notes.length === 0) {
    return {
      commonPhrases: [],
      writingStyle: 'casual',
      averageLength: 0,
      confidence: 0,
    }
  }

  // 모든 텍스트를 하나로 결합
  const allText = notes
    .map(note => `${note.title} ${note.content}`)
    .join(' ')
    .toLowerCase()

  // 자주 사용하는 표현 분석
  const commonPhrases = extractCommonPhrases(allText)

  // 문체 분석
  const writingStyle = analyzeWritingStyle(allText)

  // 평균 문장 길이 분석
  const averageLength = calculateAverageSentenceLength(allText)

  // 신뢰도 계산 (노트 수와 텍스트 길이 기반)
  const confidence = calculateConfidence(notes.length, allText.length)

  return {
    commonPhrases,
    writingStyle,
    averageLength,
    confidence,
  }
}

/**
 * 자주 사용하는 표현을 추출합니다
 * 
 * @param text - 분석할 텍스트
 * @returns 자주 사용하는 표현 배열
 */
function extractCommonPhrases(text: string): string[] {
  // 문장 부호 제거 및 단어 분리
  const words = text
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)

  // 2-3단어 구문 추출
  const phrases: string[] = []
  
  // 2단어 구문
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`
    phrases.push(phrase)
  }

  // 3단어 구문
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
    phrases.push(phrase)
  }

  // 빈도 계산
  const phraseCount = new Map<string, number>()
  phrases.forEach(phrase => {
    phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1)
  })

  // 빈도순으로 정렬하고 상위 10개 반환
  return Array.from(phraseCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase)
}

/**
 * 문체를 분석합니다
 * 
 * @param text - 분석할 텍스트
 * @returns 문체 ('formal' | 'casual' | 'academic')
 */
function analyzeWritingStyle(text: string): 'formal' | 'casual' | 'academic' {
  // 격식체 지표
  const formalIndicators = [
    '입니다', '습니다', '하였습니다', '되었습니다', '입니다', '입니다',
    '따라서', '그러므로', '또한', '또한', '또한', '또한',
    '검토', '분석', '검토', '분석', '검토', '분석'
  ]

  // 반말체 지표
  const casualIndicators = [
    '야', '어', '지', '네', '구나', '다',
    '그냥', '진짜', '완전', '엄청', '너무', '정말',
    'ㅋㅋ', 'ㅎㅎ', 'ㅠㅠ', 'ㅜㅜ', 'ㅇㅇ', 'ㄴㄴ'
  ]

  // 학술체 지표
  const academicIndicators = [
    '연구', '분석', '결과', '데이터', '실험', '가설',
    '이론', '모델', '방법론', '프레임워크', '알고리즘', '시스템',
    '따르면', '에 따르면', '연구에 따르면', '분석 결과', '실험 결과'
  ]

  const formalScore = countIndicators(text, formalIndicators)
  const casualScore = countIndicators(text, casualIndicators)
  const academicScore = countIndicators(text, academicIndicators)

  // 가장 높은 점수의 문체 반환
  if (academicScore > formalScore && academicScore > casualScore) {
    return 'academic'
  } else if (formalScore > casualScore) {
    return 'formal'
  } else {
    return 'casual'
  }
}

/**
 * 텍스트에서 지표들의 출현 횟수를 계산합니다
 * 
 * @param text - 분석할 텍스트
 * @param indicators - 찾을 지표 배열
 * @returns 출현 횟수
 */
function countIndicators(text: string, indicators: string[]): number {
  return indicators.reduce((count, indicator) => {
    const regex = new RegExp(indicator, 'gi')
    const matches = text.match(regex)
    return count + (matches ? matches.length : 0)
  }, 0)
}

/**
 * 평균 문장 길이를 계산합니다
 * 
 * @param text - 분석할 텍스트
 * @returns 평균 문장 길이 (단어 수)
 */
function calculateAverageSentenceLength(text: string): number {
  // 문장 분리 (마침표, 느낌표, 물음표 기준)
  const sentences = text
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0)

  if (sentences.length === 0) return 0

  // 각 문장의 단어 수 계산
  const sentenceLengths = sentences.map(sentence => {
    return sentence.trim().split(/\s+/).length
  })

  // 평균 계산
  const totalLength = sentenceLengths.reduce((sum, length) => sum + length, 0)
  return Math.round(totalLength / sentences.length)
}

/**
 * 패턴 분석의 신뢰도를 계산합니다
 * 
 * @param noteCount - 분석한 노트 수
 * @param textLength - 분석한 텍스트 길이
 * @returns 신뢰도 (0-1)
 */
function calculateConfidence(noteCount: number, textLength: number): number {
  // 노트 수 기반 신뢰도 (최대 0.5)
  const noteConfidence = Math.min(noteCount / 20, 1) * 0.5

  // 텍스트 길이 기반 신뢰도 (최대 0.5)
  const textConfidence = Math.min(textLength / 10000, 1) * 0.5

  return noteConfidence + textConfidence
}

/**
 * 사용자 패턴을 로컬 스토리지에 저장합니다
 * 
 * @param pattern - 저장할 사용자 패턴
 */
export function saveUserPattern(pattern: UserWritingPattern): void {
  try {
    const patterns = getUserPatterns()
    patterns[pattern.userId] = pattern
    localStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(patterns))
  } catch (error) {
    console.error('사용자 패턴 저장 실패:', error)
  }
}

/**
 * 사용자 패턴을 로컬 스토리지에서 조회합니다
 * 
 * @param userId - 조회할 사용자 ID
 * @returns 사용자 패턴 또는 null
 */
export function getUserPattern(userId: string): UserWritingPattern | null {
  try {
    const patterns = getUserPatterns()
    const pattern = patterns[userId]

    if (!pattern) return null

    // 캐시 만료 확인
    const now = new Date()
    const lastUpdated = new Date(pattern.lastUpdated)
    if (now.getTime() - lastUpdated.getTime() > PATTERN_CACHE_DURATION) {
      // 만료된 패턴 삭제
      delete patterns[userId]
      localStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(patterns))
      return null
    }

    return pattern
  } catch (error) {
    console.error('사용자 패턴 조회 실패:', error)
    return null
  }
}

/**
 * 모든 사용자 패턴을 조회합니다
 * 
 * @returns 사용자 패턴 맵
 */
function getUserPatterns(): Record<string, UserWritingPattern> {
  try {
    const stored = localStorage.getItem(PATTERN_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('사용자 패턴 조회 실패:', error)
    return {}
  }
}

/**
 * 사용자 패턴을 삭제합니다
 * 
 * @param userId - 삭제할 사용자 ID
 */
export function deleteUserPattern(userId: string): void {
  try {
    const patterns = getUserPatterns()
    delete patterns[userId]
    localStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(patterns))
  } catch (error) {
    console.error('사용자 패턴 삭제 실패:', error)
  }
}

/**
 * 모든 사용자 패턴을 삭제합니다
 */
export function clearAllUserPatterns(): void {
  try {
    localStorage.removeItem(PATTERN_STORAGE_KEY)
  } catch (error) {
    console.error('사용자 패턴 전체 삭제 실패:', error)
  }
}

/**
 * 사용자 패턴을 업데이트합니다
 * 새로운 노트 데이터를 기반으로 기존 패턴을 업데이트합니다
 * 
 * @param userId - 사용자 ID
 * @param newNotes - 새로운 노트 데이터
 * @returns 업데이트된 패턴
 */
export function updateUserPattern(
  userId: string,
  newNotes: Array<{ title: string; content: string; createdAt: Date }>
): UserWritingPattern | null {
  try {
    const existingPattern = getUserPattern(userId)
    
    if (existingPattern) {
      // 기존 패턴과 새 데이터를 결합하여 분석
      const allNotes = [
        ...newNotes,
        // 기존 패턴에서 노트 정보 복원 (정확한 데이터는 없으므로 가상 데이터 생성)
        ...Array.from({ length: existingPattern.noteCount }, (_, i) => ({
          title: `기존 노트 ${i + 1}`,
          content: existingPattern.commonPhrases.join(' '),
          createdAt: new Date(existingPattern.lastUpdated.getTime() - (i + 1) * 24 * 60 * 60 * 1000)
        }))
      ]

      const analysis = analyzeUserWritingPattern(userId, allNotes)
      
      const updatedPattern: UserWritingPattern = {
        userId,
        commonPhrases: analysis.commonPhrases,
        writingStyle: analysis.writingStyle,
        averageLength: analysis.averageLength,
        lastUpdated: new Date(),
        noteCount: allNotes.length,
      }

      saveUserPattern(updatedPattern)
      return updatedPattern
    } else {
      // 새로운 패턴 생성
      const analysis = analyzeUserWritingPattern(userId, newNotes)
      
      const newPattern: UserWritingPattern = {
        userId,
        commonPhrases: analysis.commonPhrases,
        writingStyle: analysis.writingStyle,
        averageLength: analysis.averageLength,
        lastUpdated: new Date(),
        noteCount: newNotes.length,
      }

      saveUserPattern(newPattern)
      return newPattern
    }
  } catch (error) {
    console.error('사용자 패턴 업데이트 실패:', error)
    return null
  }
}
