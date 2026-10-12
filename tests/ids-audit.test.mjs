import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { auditIDSDocument } from '@ifc-lite/ids'

function convertInBrowserWorker(source) {
  let result
  const context = { console: { log() {} }, self: { postMessage(message) { result = message } } }
  runInNewContext(readFileSync(new URL('../public/workers/idsWorker.js', import.meta.url), 'utf8'), context)
  context.self.onmessage({ data: { type: 'convert', text: source } })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  return result.xml
}
const source = readFileSync(new URL('../docs/examples/bfh-fire-rating.yaml', import.meta.url), 'utf8')
const xml = convertInBrowserWorker(source)

test('real browser converter output for the BFH YAML passes the real ifc-lite auditor', async () => {
  assert.match(xml, /ifcVersion="IFC2X3"/)
  for (const value of ['EI30', 'EI60', 'EI90', 'keine Anforderung']) {
    assert.ok(xml.includes(`value="${value}"`))
  }
  const report = await auditIDSDocument(xml)
  assert.equal(report.status, 'valid', JSON.stringify(report.issues))
})

test('malformed XML fails the audit', async () => {
  assert.equal((await auditIDSDocument('<ids:ids')).status, 'error')
})

test('a misspelled IFC entity is rejected with schema diagnostics', async () => {
  const report = await auditIDSDocument(xml.replace('IFCDOOR', 'IFCDOORNOTREAL'))
  assert.equal(report.status, 'error')
  assert.ok(report.issues.some(issue => issue.code === 'E_IFC_ENTITY_UNKNOWN'), JSON.stringify(report.issues))
})

test('an invalid requirement cardinality is rejected', async () => {
  const report = await auditIDSDocument(xml.replace('cardinality="required"', 'cardinality="not-valid"'))
  assert.equal(report.status, 'error')
})
