export const MAX_PEOPLE = 4
export const CODE_RE = /^[a-z0-9]{6}$/

export function newCode(): string {
  const alpha = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => alpha[b % alpha.length]).join('')
}

export function cleanName(v: string): string {
  return v
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
    .trim()
    .slice(0, 20)
}

export const NAME_KEY = 'nels:name'

export function loadName(): string {
  try { return sessionStorage.getItem(NAME_KEY) ?? '' } catch { return '' }
}
export function saveName(name: string) {
  try { sessionStorage.setItem(NAME_KEY, name) } catch { /* sem storage */ }
}
