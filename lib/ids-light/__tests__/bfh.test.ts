/** @jest-environment node */
import { test, expect } from '@jest/globals'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseIdsLight, validateIdsLight, convertIdsLightToXml } from '..'

test('BFH classroom YAML preserves IFC2X3, required FireRating and the allowed values in downloadable IDS', () => {
  const source = readFileSync(join(process.cwd(), 'docs/examples/bfh-fire-rating.yaml'), 'utf8')
  const parsed = parseIdsLight(source)
  expect(validateIdsLight(parsed).valid).toBe(true)
  const xml = convertIdsLightToXml(parsed)
  expect(xml).toContain('ifcVersion="IFC2X3"')
  expect(xml).toContain('IFCDOOR')
  expect(xml).toContain('Pset_DoorCommon')
  expect(xml).toContain('FireRating')
  expect(xml).toContain('cardinality="required"')
  for (const value of ['EI30', 'EI60', 'EI90', 'keine Anforderung']) {
    expect(xml).toContain(`value="${value}"`)
  }
})
