import { getCard } from '../cards.js'

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function name(defId) {
  if (!defId) return 'a card'
  return getCard(defId)?.name || 'a card'
}

export function eventLine(event) {
  if (event.type === 'cardPlayed') return `Played ${name(event.defId)}`
  if (event.type === 'cardDrawn') return event.hidden ? 'Opponent drew a card' : `Drew ${name(event.defId)}`
  if (event.type === 'gained' && event.trade) return `+${event.trade} trade`
  if (event.type === 'gained' && event.combat) return `+${event.combat} combat`
  if (event.type === 'gained' && event.authority) return `+${event.authority} authority`
  if (event.type === 'cardBought') return `Bought ${name(event.defId)}`
  if (event.type === 'cardScrapped') return `Scrapped ${name(event.defId)}`
  if (event.type === 'cardDiscarded') return `Discarded ${name(event.defId)}`
  if (event.type === 'authorityChanged') {
    return event.amount < 0 ? `${-event.amount} damage` : `Authority ${event.next}`
  }
  if (event.type === 'baseDamaged') {
    return event.destroyed ? `Destroyed ${name(event.defId)}` : `Hit ${name(event.defId)}`
  }
  if (event.type === 'choiceRequired') return event.prompt
  if (event.type === 'turnStarted') return `${event.name}'s turn`
  if (event.type === 'turnEnded') return 'Turn ended'
  if (event.type === 'gameOver') return `${event.winnerName} wins`
  if (event.type === 'shuffled') return 'Shuffled the deck'
  if (event.type === 'tradeFilled') return `${name(event.defId)} entered the row`
  return ''
}

const waits = {
  cardPlayed: 160,
  cardBought: 160,
  cardDrawn: 90,
  cardScrapped: 160,
  cardDiscarded: 140,
  baseDamaged: 160,
  gameOver: 0,
  choiceRequired: 0,
}

export async function playQueue(events, onEvent) {
  for (const event of events) {
    const line = eventLine(event)
    if (line) onEvent(event, line)
    await sleep(waits[event.type] ?? 80)
  }
}
