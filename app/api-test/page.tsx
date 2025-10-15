// app/api-test/page.tsx
// Gemini API 테스트 페이지
// Gemini API 기능을 수동으로 테스트할 수 있는 UI 제공
// Related: app/api-test/actions.ts, lib/gemini/client.ts

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { testGeminiAPI, checkApiKeyStatus } from './actions'
import { testDatabaseConnection, testNotesTable } from './actions'
import { toast } from 'sonner'

export default function APITestPage() {
  const [prompt, setPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [inputTokens, setInputTokens] = useState<number | null>(null)
  const [outputTokens, setOutputTokens] = useState<number | null>(null)
  const [totalTokens, setTotalTokens] = useState<number | null>(null)
  const [generationTime, setGenerationTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('확인 중...')
  const [dbConnectionStatus, setDbConnectionStatus] = useState<string>('확인 중...')
  const [notesTableStatus, setNotesTableStatus] = useState<string>('확인 중...')

  // API 키 및 데이터베이스 상태 확인
  useEffect(() => {
    // API 키 상태 확인
    checkApiKeyStatus().then(({ hasKey, message }) => {
      setApiKeyStatus(message)
      if (!hasKey) {
        toast.error('API 키가 설정되지 않았습니다')
      }
    })

    // 데이터베이스 연결 테스트
    testDatabaseConnection().then((result) => {
      setDbConnectionStatus(result.success ? '✅ 연결 성공' : `❌ 연결 실패: ${result.error}`)
    })

    // notes 테이블 확인
    testNotesTable().then((result) => {
      setNotesTableStatus(result.success ? '✅ 테이블 존재' : `❌ 테이블 없음: ${result.error}`)
    })
  }, [])

  const handleTest = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)
    setModel(null)
    setInputTokens(null)
    setOutputTokens(null)
    setTotalTokens(null)
    setGenerationTime(null)

    try {
      const response = await testGeminiAPI(prompt, {
        temperature,
        maxOutputTokens: maxTokens,
      })

      if (response.success) {
        setResult(response.text || '')
        setModel(response.model || null)
        setInputTokens(response.inputTokens || null)
        setOutputTokens(response.outputTokens || null)
        setTotalTokens(response.totalTokens || null)
        setGenerationTime(response.generationTime || null)
        toast.success('API 호출 성공!')
      } else {
        setError(response.error || '알 수 없는 오류가 발생했습니다.')
        toast.error(response.error || '오류가 발생했습니다')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 샘플 프롬프트 설정
  const setSamplePrompt = (sample: string) => {
    setPrompt(sample)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API 테스트</h1>
          <p className="mt-2 text-gray-600">
            Gemini API 및 데이터베이스 연결 상태를 테스트해보세요
          </p>
        </div>

        {/* 시스템 상태 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* API 키 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Gemini API 키</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${apiKeyStatus.includes('정상') ? 'text-green-600' : 'text-red-600'}`}>
                {apiKeyStatus}
              </p>
            </CardContent>
          </Card>

          {/* 데이터베이스 연결 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">데이터베이스 연결</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${dbConnectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {dbConnectionStatus}
              </p>
            </CardContent>
          </Card>

          {/* Notes 테이블 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Notes 테이블</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${notesTableStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {notesTableStatus}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 입력 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>프롬프트 입력</CardTitle>
            <CardDescription>
              Gemini에게 보낼 메시지를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 샘플 프롬프트 버튼 */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSamplePrompt('안녕하세요! 자기소개를 해주세요.')}
              >
                샘플 1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSamplePrompt('인공지능의 미래에 대해 간단히 설명해주세요.')}
              >
                샘플 2
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSamplePrompt('다음 텍스트를 요약해주세요: "TypeScript는 JavaScript의 상위 집합 언어로, 정적 타입 검사를 제공합니다. 이를 통해 개발 중 오류를 미리 발견할 수 있으며, 코드의 가독성과 유지보수성이 향상됩니다."')}
              >
                샘플 3 (요약)
              </Button>
            </div>

            {/* 프롬프트 입력 */}
            <div>
              <Textarea
                placeholder="프롬프트를 입력하세요..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* 설정 옵션 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperature: {temperature}
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  0에 가까울수록 일관적, 2에 가까울수록 창의적
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">
                  Max Tokens: {maxTokens}
                </Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="8192"
                  step="1"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  최대 출력 토큰 수
                </p>
              </div>
            </div>

            {/* 실행 버튼 */}
            <Button
              onClick={handleTest}
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? '테스트 중...' : 'API 테스트 실행'}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 영역 */}
        {(result || error) && (
          <Card>
            <CardHeader>
              <CardTitle>결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">오류 발생</p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              ) : (
                <>
                  {/* 메타 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">모델</p>
                      <p className="text-sm font-medium text-gray-900">
                        {model || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">입력 토큰</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inputTokens?.toLocaleString() || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">출력 토큰</p>
                      <p className="text-sm font-medium text-gray-900">
                        {outputTokens?.toLocaleString() || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">총 토큰</p>
                      <p className="text-sm font-medium text-gray-900">
                        {totalTokens?.toLocaleString() || '-'}
                      </p>
                    </div>
                  </div>

                  {/* 응답 시간 */}
                  {generationTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>⏱️ 응답 시간:</span>
                      <span className="font-medium">{generationTime}ms</span>
                      <span className="text-gray-400">
                        ({(generationTime / 1000).toFixed(2)}초)
                      </span>
                    </div>
                  )}

                  {/* 응답 텍스트 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">생성된 텍스트</p>
                    <div className="p-4 bg-white border border-gray-200 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900">
                        {result}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 사용 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">사용 가이드</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>1. API 키가 정상적으로 설정되어 있는지 확인하세요</p>
            <p>2. 프롬프트를 입력하거나 샘플 버튼을 클릭하세요</p>
            <p>3. 필요시 Temperature와 Max Tokens을 조정하세요</p>
            <p>4. &quot;API 테스트 실행&quot; 버튼을 클릭하여 테스트하세요</p>
            <p className="pt-2 border-t">
              <strong>참고:</strong> 이 페이지는 개발/테스트용이며, 실제 사용자에게는 노출되지 않아야 합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

