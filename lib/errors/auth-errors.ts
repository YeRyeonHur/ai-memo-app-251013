// lib/errors/auth-errors.ts
// 인증 에러 타입 정의 및 에러 메시지 매핑
// Supabase Auth 에러를 사용자 친화적인 한글 메시지로 변환
// 관련 파일: app/(auth)/actions.ts, components/ui/error-message.tsx

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 인증 관련
  invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다',
  email_exists: '이미 사용 중인 이메일입니다',
  user_already_registered: '이미 사용 중인 이메일입니다',
  
  // 비밀번호 관련
  weak_password: '비밀번호가 너무 약합니다. 8자 이상, 특수문자 포함 필수',
  password_too_short: '비밀번호는 최소 8자 이상이어야 합니다',
  
  // 이메일 관련
  invalid_email: '유효하지 않은 이메일 형식입니다',
  email_not_confirmed: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요',
  
  // 세션 관련
  session_expired: '세션이 만료되었습니다. 다시 로그인해주세요',
  invalid_session: '유효하지 않은 세션입니다. 다시 로그인해주세요',
  
  // Provider 관련
  email_provider_disabled: '이메일 로그인이 비활성화되었습니다. 관리자에게 문의하세요',
  
  // 네트워크 관련
  network_error: '네트워크 연결을 확인해주세요',
  timeout: '요청 시간이 초과되었습니다. 다시 시도해주세요',
  
  // 기본 에러
  unknown_error: '오류가 발생했습니다. 잠시 후 다시 시도해주세요',
}

export interface AuthError {
  code: string
  message: string
  status?: number
}

/**
 * Supabase Auth 에러 코드를 한글 메시지로 변환
 */
export function getAuthErrorMessage(errorCode: string): string {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.unknown_error
}

/**
 * Supabase Auth 에러 객체를 파싱하여 적절한 에러 메시지 반환
 */
export function parseAuthError(error: any): string {
  // 에러 코드가 있는 경우
  if (error.code) {
    return getAuthErrorMessage(error.code)
  }
  
  // 에러 메시지를 기반으로 판단
  const message = error.message?.toLowerCase() || ''
  
  if (message.includes('invalid') && message.includes('credentials')) {
    return AUTH_ERROR_MESSAGES.invalid_credentials
  }
  
  if (message.includes('already') && (message.includes('registered') || message.includes('exists'))) {
    return AUTH_ERROR_MESSAGES.email_exists
  }
  
  if (message.includes('email') && message.includes('confirmed')) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed
  }
  
  if (message.includes('email') && (message.includes('disabled') || message.includes('provider'))) {
    return AUTH_ERROR_MESSAGES.email_provider_disabled
  }
  
  if (message.includes('weak') && message.includes('password')) {
    return AUTH_ERROR_MESSAGES.weak_password
  }
  
  if (message.includes('invalid') && message.includes('email')) {
    return AUTH_ERROR_MESSAGES.invalid_email
  }
  
  if (message.includes('session') && message.includes('expired')) {
    return AUTH_ERROR_MESSAGES.session_expired
  }
  
  if (message.includes('network')) {
    return AUTH_ERROR_MESSAGES.network_error
  }
  
  if (message.includes('timeout')) {
    return AUTH_ERROR_MESSAGES.timeout
  }
  
  // 기본 에러 메시지
  return AUTH_ERROR_MESSAGES.unknown_error
}

/**
 * 에러 로그 기록
 */
export function logAuthError(error: any, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    level: 'error',
    type: 'auth_error',
    code: error.code || 'unknown',
    message: error.message || 'No message',
    status: error.status,
    context,
  }
  
  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('[Auth Error]', errorInfo)
  }
  
  // TODO: 프로덕션 환경에서는 Sentry 등의 에러 트래킹 서비스로 전송
}

