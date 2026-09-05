/**
 * Sequence-based id generator per prefix (e.g. id('INV') -> 'INV-0001'), persisted
 * alongside the mock collections so ids stay stable across reloads within a browser.
 */
const SEQ_KEY = 'ufa:id-sequences'

function readSequences(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEQ_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeSequences(sequences: Record<string, number>) {
  localStorage.setItem(SEQ_KEY, JSON.stringify(sequences))
}

export function nextId(prefix: string): string {
  const sequences = readSequences()
  const next = (sequences[prefix] ?? 0) + 1
  sequences[prefix] = next
  writeSequences(sequences)
  return `${prefix}-${String(next).padStart(4, '0')}`
}

export function uuid(): string {
  return crypto.randomUUID()
}
