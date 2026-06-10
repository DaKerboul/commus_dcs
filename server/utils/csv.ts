const FORMULA_CHARS = ['=', '+', '-', '@', '\t', '\r']

export function csvEscape(val: string): string {
  if (!val) return ''
  if (FORMULA_CHARS.some(c => val.startsWith(c))) {
    val = "'" + val
  }
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}
