"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { formatIdsAudit } from "@/lib/ids-validation"

export function useIdsValidation(xml?: string, autoValidate = false) {
  const [validationResult, setValidationResult] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const attemptedXml = useRef<string>()
  const activeRequest = useRef<AbortController>()

  const validate = useCallback(async () => {
    if (!xml) return
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    // Remember failures too: a state update must never automatically retry a request.
    attemptedXml.current = xml
    setIsValidating(true)
    setValidationResult(null)
    const timeout = setTimeout(() => controller.abort(), 25000)
    try {
      const response = await fetch('/api/validate-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml }),
        signal: controller.signal,
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || data?.error) {
        throw new Error(data?.error || `Validation service returned HTTP ${response.status}. Please retry later.`)
      }
      if (!data || !['valid', 'warning', 'error'].includes(data.status) || !Array.isArray(data.issues)) {
        throw new Error('Validation service returned an unexpected response. Please retry later.')
      }
      if (activeRequest.current === controller && !controller.signal.aborted) {
        setValidationResult(formatIdsAudit(data))
      }
    } catch (error) {
      if (activeRequest.current === controller) {
        setValidationResult(controller.signal.aborted
          ? 'Error: Validation timed out. Please retry. You can still download the generated IDS XML.'
          : `Error: ${error instanceof Error ? error.message : 'Failed to connect to validation service'}`)
      }
    } finally {
      clearTimeout(timeout)
      if (activeRequest.current === controller) {
        activeRequest.current = undefined
        setIsValidating(false)
      }
    }
  }, [xml])

  useEffect(() => {
    attemptedXml.current = undefined
    setValidationResult(null)
    setIsValidating(false)
    return () => {
      const controller = activeRequest.current
      activeRequest.current = undefined
      controller?.abort()
    }
  }, [xml])

  useEffect(() => {
    if (autoValidate && xml && attemptedXml.current !== xml) void validate()
  }, [autoValidate, xml, validate])

  return { validationResult, isValidating, validate }
}
