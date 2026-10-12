/** @jest-environment node */
import { jest, beforeEach, afterEach, test, expect } from '@jest/globals'
import type { auditIDSDocument as AuditFn } from '@ifc-lite/ids'

jest.mock('@ifc-lite/ids', () => ({ auditIDSDocument: jest.fn() }))
const { POST } = require('../route') as typeof import('../route')
const { auditIDSDocument } = require('@ifc-lite/ids')
const auditMock = auditIDSDocument as jest.Mock<typeof AuditFn>
const request = (body: string) => new Request('http://localhost/api/validate-ids', { method: 'POST', body })
beforeEach(() => {
  auditMock.mockReset()
  global.fetch = jest.fn<typeof fetch>()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { jest.restoreAllMocks() })

test.each(['bad JSON', '{}', '{"xml":42}', '{"xml":" "}', 'null'])('rejects malformed input: %s', async body => {
  expect((await POST(request(body))).status).toBe(400)
  expect(auditMock).not.toHaveBeenCalled()
})
test('audits locally without network access or Cloud Run credentials', async () => {
  auditMock.mockResolvedValue({ status: 'valid', issues: [] })
  const r = await POST(request('{"xml":"<ids/>"}'))
  expect(r.status).toBe(200)
  expect(await r.json()).toEqual({ status: 'valid', issues: [] })
  expect(auditMock).toHaveBeenCalledWith('<ids/>')
  expect(global.fetch).not.toHaveBeenCalled()
})
test('preserves invalid document diagnostics and omits the parsed document', async () => {
  const issues = [{ severity: 'error' as const, code: 'E_XSD_STRUCTURE' as const, message: 'Invalid schema', path: 'specifications' }]
  auditMock.mockResolvedValue({ status: 'error', issues, parsedDocument: { info: { title: 'Test' }, specifications: [] } })
  const r = await POST(request('{"xml":"<ids/>"}'))
  expect(r.status).toBe(200)
  expect(await r.json()).toEqual({ status: 'error', issues })
})
test('reports an unexpected auditor failure without claiming the IDS is valid', async () => {
  auditMock.mockRejectedValue(Error('unexpected'))
  const r = await POST(request('{"xml":"<ids/>"}'))
  expect(r.status).toBe(500)
  expect((await r.json()).error).toContain('download')
})
