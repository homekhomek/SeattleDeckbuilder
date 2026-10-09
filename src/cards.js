export const factions = {
  harbor: { id: 'harbor', name: 'Harbor', color: '#1f7a86' },
  market: { id: 'market', name: 'Market', color: '#2f7d45' },
  monorail: { id: 'monorail', name: 'Monorail', color: '#b6892e' },
  foundry: { id: 'foundry', name: 'Foundry', color: '#9c3d32' },
}

export const cards = [
  {
    id: 'dock-scout',
    name: 'Dock Scout',
    faction: null,
    type: 'ship',
    cost: 0,
    defense: 0,
    supply: 'starter',
    deckCopies: 0,
    opening: 8,
    effects: [{ trigger: 'play', kind: 'gainTrade', amount: 1 }],
  },
  {
    id: 'alley-viper',
    name: 'Alley Viper',
    faction: null,
    type: 'ship',
    cost: 0,
    defense: 0,
    supply: 'starter',
    deckCopies: 0,
    opening: 2,
    effects: [{ trigger: 'play', kind: 'gainCombat', amount: 1 }],
  },
  {
    id: 'day-pass',
    name: 'Day Pass',
    faction: null,
    type: 'ship',
    cost: 2,
    defense: 0,
    supply: 'explorer',
    deckCopies: 0,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainTrade', amount: 2 },
      { trigger: 'scrap', kind: 'gainCombat', amount: 2 },
    ],
  },
  {
    id: 'ferry-runner',
    name: 'Ferry Runner',
    faction: 'harbor',
    type: 'ship',
    cost: 1,
    defense: 0,
    supply: 'trade',
    deckCopies: 3,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainTrade', amount: 2 },
      { trigger: 'ally', kind: 'gainAuthority', amount: 2 },
    ],
  },
  {
    id: 'dock-clinic',
    name: 'Dock Clinic',
    faction: 'harbor',
    type: 'ship',
    cost: 2,
    defense: 0,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainTrade', amount: 1 },
      { trigger: 'play', kind: 'gainAuthority', amount: 3 },
      { trigger: 'ally', kind: 'gainAuthority', amount: 2 },
    ],
  },
  {
    id: 'lighthouse',
    name: 'Lighthouse',
    faction: 'harbor',
    type: 'outpost',
    cost: 4,
    defense: 5,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainTrade', amount: 2 },
      { trigger: 'ally', kind: 'gainAuthority', amount: 3 },
    ],
  },
  {
    id: 'pike-brawler',
    name: 'Pike Brawler',
    faction: 'market',
    type: 'ship',
    cost: 1,
    defense: 0,
    supply: 'trade',
    deckCopies: 3,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 2 },
      { trigger: 'ally', kind: 'gainCombat', amount: 2 },
    ],
  },
  {
    id: 'night-vendor',
    name: 'Night Vendor',
    faction: 'market',
    type: 'ship',
    cost: 3,
    defense: 0,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 4 },
      { trigger: 'ally', kind: 'draw', amount: 1 },
    ],
  },
  {
    id: 'stall-base',
    name: 'Stall Base',
    faction: 'market',
    type: 'base',
    cost: 3,
    defense: 5,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [{ trigger: 'play', kind: 'gainCombat', amount: 3 }],
  },
  {
    id: 'line-car',
    name: 'Line Car',
    faction: 'monorail',
    type: 'ship',
    cost: 2,
    defense: 0,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 2 },
      { trigger: 'play', kind: 'draw', amount: 1 },
      { trigger: 'ally', kind: 'opponentDiscard', amount: 1 },
    ],
  },
  {
    id: 'express',
    name: 'Express',
    faction: 'monorail',
    type: 'ship',
    cost: 3,
    defense: 0,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 3 },
      { trigger: 'play', kind: 'draw', amount: 1 },
      { trigger: 'ally', kind: 'gainCombat', amount: 2 },
    ],
  },
  {
    id: 'station',
    name: 'Station',
    faction: 'monorail',
    type: 'base',
    cost: 4,
    defense: 6,
    supply: 'trade',
    deckCopies: 1,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 3 },
      { trigger: 'ally', kind: 'opponentDiscard', amount: 1 },
    ],
  },
  {
    id: 'scrap-hauler',
    name: 'Scrap Hauler',
    faction: 'foundry',
    type: 'ship',
    cost: 1,
    defense: 0,
    supply: 'trade',
    deckCopies: 3,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainTrade', amount: 1 },
      { trigger: 'scrap', kind: 'gainCombat', amount: 3 },
    ],
  },
  {
    id: 'cutter',
    name: 'Cutter',
    faction: 'foundry',
    type: 'ship',
    cost: 2,
    defense: 0,
    supply: 'trade',
    deckCopies: 2,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 2 },
      { trigger: 'play', kind: 'scrapFromHandOrDiscard', amount: 1 },
      { trigger: 'ally', kind: 'gainCombat', amount: 2 },
    ],
  },
  {
    id: 'forge',
    name: 'Forge',
    faction: 'foundry',
    type: 'outpost',
    cost: 5,
    defense: 6,
    supply: 'trade',
    deckCopies: 1,
    opening: 0,
    effects: [
      { trigger: 'play', kind: 'gainCombat', amount: 2 },
      { trigger: 'play', kind: 'scrapFromHandOrDiscard', amount: 1 },
    ],
  },
]

const byId = Object.fromEntries(cards.map((card) => [card.id, card]))

export function getCard(id) {
  return byId[id]
}

export function explorerCard() {
  return cards.find((card) => card.supply === 'explorer')
}

function effectText(effect) {
  if (effect.kind === 'gainTrade') return `+${effect.amount} trade`
  if (effect.kind === 'gainCombat') return `+${effect.amount} combat`
  if (effect.kind === 'gainAuthority') return `+${effect.amount} authority`
  if (effect.kind === 'draw') return `Draw ${effect.amount}`
  if (effect.kind === 'opponentDiscard') return `Opponent discards ${effect.amount}`
  if (effect.kind === 'scrapFromHandOrDiscard') return 'Scrap from hand or discard'
  if (effect.kind === 'scrapFromTradeRow') return 'Scrap from the trade row'
  return effect.kind
}

export function effectView(effect) {
  if (effect.kind === 'gainTrade') return { trigger: effect.trigger, symbol: 'trade', amount: effect.amount }
  if (effect.kind === 'gainCombat') return { trigger: effect.trigger, symbol: 'combat', amount: effect.amount }
  if (effect.kind === 'gainAuthority') return { trigger: effect.trigger, symbol: 'heal', amount: effect.amount }
  return { trigger: effect.trigger, text: effectText(effect) }
}

export function linesFor(def) {
  return def.effects.map((effect) => {
    const view = effectView(effect)
    const text = view.symbol ? `${view.amount} ${view.symbol}` : view.text
    if (view.trigger === 'ally') return `Ally: ${text}`
    if (view.trigger === 'scrap') return `Scrap: ${text}`
    return text
  })
}
