import { jest, beforeEach, afterEach, test, expect } from '@jest/globals'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useIdsValidation } from '../use-ids-validation'

const response = (status = 200, data: any = { status: 'valid', issues: [] }) => ({
  ok: status < 400, status, json: async () => data,
})

beforeEach(() => { global.fetch = jest.fn<typeof fetch>() })
afterEach(() => { jest.useRealTimers() })

test('HTTP failure stops after one attempt, stays visible, and permits explicit retry', async () => {
  const fetchMock = global.fetch as jest.Mock<(...args: any[]) => any>
  fetchMock.mockResolvedValue(response(502, { error: 'Service unavailable' }))
  const { result, rerender } = renderHook(() => useIdsValidation('<ids/>', true))
  await waitFor(() => expect(result.current.validationResult).toContain('Service unavailable'))
  rerender()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(result.current.isValidating).toBe(false)
  fetchMock.mockResolvedValue(response())
  await act(async () => { await result.current.validate() })
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(result.current.validationResult).toContain('audit passed')
})

test('non-JSON failures stop loading and do not retry when reopening the tab', async () => {
  ;(global.fetch as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ ok: false, status: 503, json: async () => { throw Error('HTML') } })
  const { result, rerender } = renderHook(({ enabled }) => useIdsValidation('<ids/>', enabled), { initialProps: { enabled: true } })
  await waitFor(() => expect(result.current.validationResult).toContain('HTTP 503'))
  rerender({ enabled: false })
  rerender({ enabled: true })
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

test('aborts a hung request after 25 seconds and stops loading', async () => {
  jest.useFakeTimers()
  ;(global.fetch as jest.Mock<(...args: any[]) => any>).mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(Error('aborted')))
  }))
  const { result } = renderHook(() => useIdsValidation('<ids/>', true))
  await act(async () => { jest.advanceTimersByTime(25000) })
  expect(result.current.isValidating).toBe(false)
  expect(result.current.validationResult).toContain('timed out')
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

test('changed XML aborts the previous audit and ignores its late response', async () => {
  let resolveOld: (value: any) => void = () => {}
  const fetchMock = global.fetch as jest.Mock<(...args: any[]) => any>
  fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    .mockResolvedValueOnce(response(200, { status: 'error', issues: [{ severity: 'error', code: 'E_XSD_STRUCTURE', message: 'Invalid schema' }] }))
  const { result, rerender } = renderHook(({ xml }) => useIdsValidation(xml, true), { initialProps: { xml: '<old/>' } })
  const oldSignal = fetchMock.mock.calls[0][1].signal
  rerender({ xml: '<new/>' })
  await waitFor(() => expect(result.current.validationResult).toContain('Invalid schema'))
  expect(oldSignal.aborted).toBe(true)
  await act(async () => { resolveOld(response()) })
  expect(result.current.validationResult).toContain('Invalid schema')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test('unmount cancels an in-flight audit', () => {
  ;(global.fetch as jest.Mock<(...args: any[]) => any>).mockImplementation(() => new Promise(() => {}))
  const { unmount } = renderHook(() => useIdsValidation('<ids/>', true))
  const signal = (global.fetch as jest.Mock<(...args: any[]) => any>).mock.calls[0][1].signal
  unmount()
  expect(signal.aborted).toBe(true)
})
