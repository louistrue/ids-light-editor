import type { IDSAuditReport } from '@ifc-lite/ids'

export function formatIdsAudit(data: Pick<IDSAuditReport, 'status' | 'issues'>): string {
  const headings = {
    valid: '✅ IDS document audit passed — no issues found',
    warning: '⚠️ IDS document audit completed with warnings',
    error: '❌ IDS document audit failed',
  }
  const lines = [headings[data.status], 'Audited with ifc-lite. This checks the IDS document; it does not check an IFC model.', '']
  for (const issue of data.issues) {
    lines.push(`${issue.severity.toUpperCase()} [${issue.code}] ${issue.message}`)
    if (issue.path) lines.push(`  Location: ${issue.path}`)
    lines.push('')
  }
  return lines.join('\n')
}
