/**
 * Generic localStorage-backed collection. This is the entire "backend" for the hackathon
 * build — every features/*\/api.ts reads and writes through here. It exists ONLY inside
 * lib/dev-mocks/, so swapping in a real API later means deleting this folder and rewriting
 * each api.ts's function bodies to call fetch() instead — no caller (hooks, components,
 * pages) needs to change, because the async CRUD shape stays identical.
 */

export interface Entity {
  id: string
}

type Predicate<T> = (item: T) => boolean

const STORAGE_PREFIX = 'ufa:'

export function createCollection<T extends Entity>(key: string, seed: T[]) {
  const storageKey = `${STORAGE_PREFIX}${key}`

  function readAll(): T[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw === null) {
        localStorage.setItem(storageKey, JSON.stringify(seed))
        return seed
      }
      return JSON.parse(raw) as T[]
    } catch {
      return seed
    }
  }

  function writeAll(items: T[]) {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }

  return {
    list(): T[] {
      return readAll()
    },
    get(id: string): T | undefined {
      return readAll().find((item) => item.id === id)
    },
    query(predicate: Predicate<T>): T[] {
      return readAll().filter(predicate)
    },
    insert(item: T): T {
      const items = readAll()
      items.push(item)
      writeAll(items)
      return item
    },
    update(id: string, patch: Partial<T>): T {
      const items = readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) {
        throw new Error(`${key}: no record with id "${id}"`)
      }
      const updated = { ...items[index], ...patch }
      items[index] = updated
      writeAll(items)
      return updated
    },
    remove(id: string): void {
      writeAll(readAll().filter((item) => item.id !== id))
    },
    reset(): void {
      writeAll(seed)
    },
  }
}

export type Collection<T extends Entity> = ReturnType<typeof createCollection<T>>
