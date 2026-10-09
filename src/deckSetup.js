import { cards } from './cards.js'

const key = 'seattle-trade-copies'

export function defaultCopies() {
  const map = {}
  for (const card of cards) {
    if (card.supply === 'trade') map[card.id] = card.deckCopies
  }
  return map
}

export function loadCopies() {
  const base = defaultCopies()
  if (typeof localStorage === 'undefined') return base
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (!saved) return base
    for (const id of Object.keys(base)) {
      const count = Number(saved[id])
      if (Number.isInteger(count) && count >= 0 && count <= 8) base[id] = count
    }
  } catch {
    return base
  }
  return base
}

export function setCopy(id, count) {
  const next = loadCopies()
  next[id] = Math.max(0, Math.min(8, count))
  localStorage.setItem(key, JSON.stringify(next))
  return next
}
