// lib/errors/__tests__/auth-errors.test.ts
// 인증 에러 핸들러 단위 테스트
// 에러 메시지 매핑 및 파싱 로직 테스트
// 관련 파일: lib/errors/auth-errors.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAuthErrorMessage, parseAuthError, logAuthError, AUTH_ERROR_MESSAGES } from '../auth-errors'

describe('getAuthErrorMessage', () => {
  it('알려진 에러 코드에 대한 메시지를 반환해야 한다', () => {
    expect(getAuthErrorMessage('invalid_credentials')).toBe('이메일 또는 비밀번호가 올바르지 않습니다')
    expect(getAuthErrorMessage('email_exists')).toBe('이미 사용 중인 이메일입니다')
    expect(getAuthErrorMessage('weak_password')).toBe('비밀번호가 너무 약합니다. 8자 이상, 특수문자 포함 필수')
  })

  it('알 수 없는 에러 코드에 대해 기본 메시지를 반환해야 한다', () => {
    expect(getAuthErrorMessage('unknown_code')).toBe(AUTH_ERROR_MESSAGES.unknown_error)
    expect(getAuthErrorMessage('')).toBe(AUTH_ERROR_MESSAGES.unknown_error)
  })
})

describe('parseAuthError', () => {
  it('에러 코드가 있으면 해당 메시지를 반환해야 한다', () => {
    const error = { code: 'invalid_credentials', message: 'Invalid credentials' }
    expect(parseAuthError(error)).toBe('이메일 또는 비밀번호가 올바르지 않습니다')
  })

  it('invalid credentials 메시지를 인식해야 한다', () => {
    const error = { message: 'Invalid login credentials' }
    expect(parseAuthError(error)).toBe('이메일 또는 비밀번호가 올바르지 않습니다')
  })

  it('already registered 메시지를 인식해야 한다', () => {
    const error1 = { message: 'User already registered' }
    const error2 = { message: 'Email already exists' }
    
    expect(parseAuthError(error1)).toBe('이미 사용 중인 이메일입니다')
    expect(parseAuthError(error2)).toBe('이미 사용 중인 이메일입니다')
  })

  it('email not confirmed 메시지를 인식해야 한다', () => {
    const error = { message: 'Email not confirmed' }
    expect(parseAuthError(error)).toBe('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요')
  })

  it('email provider disabled 메시지를 인식해야 한다', () => {
    const error = { message: 'Email logins are disabled' }
    expect(parseAuthError(error)).toBe('이메일 로그인이 비활성화되었습니다. 관리자에게 문의하세요')
  })

  it('weak password 메시지를 인식해야 한다', () => {
    const error = { message: 'Password is too weak' }
    expect(parseAuthError(error)).toBe('비밀번호가 너무 약합니다. 8자 이상, 특수문자 포함 필수')
  })

  it('invalid email 메시지를 인식해야 한다', () => {
    const error = { message: 'Invalid email format' }
    expect(parseAuthError(error)).toBe('유효하지 않은 이메일 형식입니다')
  })

  it('session expired 메시지를 인식해야 한다', () => {
    const error = { message: 'Session has expired' }
    expect(parseAuthError(error)).toBe('세션이 만료되었습니다. 다시 로그인해주세요')
  })

  it('network error 메시지를 인식해야 한다', () => {
    const error = { message: 'Network connection failed' }
    expect(parseAuthError(error)).toBe('네트워크 연결을 확인해주세요')
  })

  it('timeout 메시지를 인식해야 한다', () => {
    const error = { message: 'Request timeout' }
    expect(parseAuthError(error)).toBe('요청 시간이 초과되었습니다. 다시 시도해주세요')
  })

  it('알 수 없는 에러에 대해 기본 메시지를 반환해야 한다', () => {
    const error = { message: 'Something went wrong' }
    expect(parseAuthError(error)).toBe(AUTH_ERROR_MESSAGES.unknown_error)
  })

  it('메시지가 없는 에러에 대해 기본 메시지를 반환해야 한다', () => {
    const error = {}
    expect(parseAuthError(error)).toBe(AUTH_ERROR_MESSAGES.unknown_error)
  })
})

describe('logAuthError', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('개발 환경에서 콘솔에 에러를 기록해야 한다', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = { code: 'invalid_credentials', message: 'Invalid credentials' }
    const context = { email: 'test@example.com', action: 'login' }
    
    logAuthError(error, context)
    
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('[Auth Error]')
    
    process.env.NODE_ENV = originalEnv
  })

  it('에러 정보가 올바르게 포맷되어야 한다', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = { code: 'test_code', message: 'Test message', status: 400 }
    const context = { test: 'value' }
    
    logAuthError(error, context)
    
    const loggedInfo = consoleErrorSpy.mock.calls[0][1]
    expect(loggedInfo).toHaveProperty('timestamp')
    expect(loggedInfo).toHaveProperty('level', 'error')
    expect(loggedInfo).toHaveProperty('type', 'auth_error')
    expect(loggedInfo).toHaveProperty('code', 'test_code')
    expect(loggedInfo).toHaveProperty('message', 'Test message')
    expect(loggedInfo).toHaveProperty('status', 400)
    expect(loggedInfo).toHaveProperty('context', context)
    
    process.env.NODE_ENV = originalEnv
  })

  it('코드가 없는 에러는 unknown으로 기록해야 한다', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = { message: 'Test message' }
    
    logAuthError(error)
    
    const loggedInfo = consoleErrorSpy.mock.calls[0][1]
    expect(loggedInfo.code).toBe('unknown')
    
    process.env.NODE_ENV = originalEnv
  })
})

