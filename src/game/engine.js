import { cards, explorerCard, getCard } from '../cards.js'

const players = ['p0', 'p1']

function other(id) {
  return id === 'p0' ? 'p1' : 'p0'
}

function nextRand(state) {
  let a = state.rng | 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  state.rng = (t ^ (t >>> 14)) >>> 0
  return state.rng / 4294967296
}

function shuffleIn(list, state) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRand(state) * (i + 1))
    const swap = list[i]
    list[i] = list[j]
    list[j] = swap
  }
}

function makeInstance(state, defId) {
  const instanceId = `c${state.nextId}`
  state.nextId += 1
  return { instanceId, defId, damage: 0, allyUsed: false }
}

function remaining(card) {
  return getCard(card.defId).defense - card.damage
}

function takeFrom(list, instanceId) {
  const index = list.findIndex((card) => card.instanceId === instanceId)
  if (index < 0) return null
  return list.splice(index, 1)[0]
}

function publicEvent(event) {
  return { audience: 'all', ...event }
}

function emit(events, event) {
  events.push(event)
}

function checkWin(state, events) {
  for (const id of players) {
    if (state.players[id].authority <= 0) {
      state.players[id].authority = 0
      state.phase = 'over'
      state.winner = other(id)
      state.pendingChoice = null
      emit(events, publicEvent({
        type: 'gameOver',
        winnerId: state.winner,
        winnerName: state.players[state.winner].name,
      }))
      return true
    }
  }
  return false
}

function drawOne(state, events, playerId, silent) {
  const player = state.players[playerId]
  if (player.deck.length === 0) {
    if (player.discard.length === 0) return
    player.deck = player.discard
    player.discard = []
    shuffleIn(player.deck, state)
    if (!silent) emit(events, publicEvent({ type: 'shuffled', playerId }))
  }
  const card = player.deck.pop()
  player.hand.push(card)
  if (!silent) {
    emit(events, {
      type: 'cardDrawn',
      playerId,
      instanceId: card.instanceId,
      defId: card.defId,
      audience: playerId,
    })
    emit(events, {
      type: 'cardDrawn',
      playerId,
      hidden: true,
      audience: other(playerId),
    })
  }
}

function drawMany(state, events, playerId, count, silent) {
  for (let i = 0; i < count; i += 1) drawOne(state, events, playerId, silent)
}

function applyInstant(state, events, playerId, effect) {
  const player = state.players[playerId]
  if (effect.kind === 'gainTrade') {
    player.trade += effect.amount
    emit(events, publicEvent({ type: 'gained', playerId, trade: effect.amount }))
  } else if (effect.kind === 'gainCombat') {
    player.combat += effect.amount
    emit(events, publicEvent({ type: 'gained', playerId, combat: effect.amount }))
    dumpCombat(state, events, playerId)
  } else if (effect.kind === 'gainAuthority') {
    player.authority += effect.amount
    emit(events, publicEvent({
      type: 'gained',
      playerId,
      authority: effect.amount,
    }))
    emit(events, publicEvent({
      type: 'authorityChanged',
      playerId,
      amount: effect.amount,
      next: player.authority,
    }))
  } else if (effect.kind === 'draw') {
    drawMany(state, events, playerId, effect.amount, false)
  }
}

function openChoice(state, events, playerId, effect) {
  if (effect.kind === 'opponentDiscard') {
    const ownerId = other(playerId)
    const options = state.players[ownerId].hand.map((card) => ({ id: card.instanceId, zone: 'hand' }))
    if (options.length === 0) return false
    state.pendingChoice = {
      playerId: ownerId,
      ownerId,
      kind: 'discard',
      prompt: 'Discard a card',
      options,
      resume: null,
    }
    emit(events, publicEvent({ type: 'choiceRequired', prompt: 'Discard a card', playerId: ownerId }))
    return true
  }
  if (effect.kind === 'scrapFromHandOrDiscard') {
    const player = state.players[playerId]
    const options = [
      ...player.hand.map((card) => ({ id: card.instanceId, zone: 'hand' })),
      ...player.discard.map((card) => ({ id: card.instanceId, zone: 'discard' })),
    ]
    if (options.length === 0) return false
    state.pendingChoice = {
      playerId,
      ownerId: playerId,
      kind: 'scrapOwn',
      prompt: 'Scrap a card from your hand or discard',
      options,
      resume: null,
    }
    emit(events, publicEvent({ type: 'choiceRequired', prompt: state.pendingChoice.prompt, playerId }))
    return true
  }
  if (effect.kind === 'scrapFromTradeRow') {
    const options = state.tradeRow.filter(Boolean).map((card) => ({ id: card.instanceId, zone: 'trade' }))
    if (options.length === 0) return false
    state.pendingChoice = {
      playerId,
      kind: 'scrapRow',
      prompt: 'Scrap a card from the trade row',
      options,
      resume: null,
    }
    emit(events, publicEvent({ type: 'choiceRequired', prompt: state.pendingChoice.prompt, playerId }))
    return true
  }
  return false
}

function refreshAllies(state, events, playerId) {
  if (state.pendingChoice || state.phase === 'over') return
  const player = state.players[playerId]
  const zones = [...player.bases, ...player.inPlay]
  const counts = {}
  for (const card of zones) {
    const faction = getCard(card.defId).faction
    if (!faction) continue
    counts[faction] = (counts[faction] || 0) + 1
  }
  for (const card of zones) {
    const def = getCard(card.defId)
    if (!def.faction || counts[def.faction] < 2 || card.allyUsed) continue
    card.allyUsed = true
    const allies = def.effects.filter((effect) => effect.trigger === 'ally')
    applyEffectList(state, events, playerId, allies, card.instanceId, {
      thenAllies: true,
      playerId,
    })
    return
  }
}

function finishTail(state, events, tail) {
  if (!tail || state.pendingChoice || state.phase === 'over') return
  if (tail.thenAllies) refreshAllies(state, events, tail.playerId)
}

function applyEffectList(state, events, playerId, effects, sourceId, tail) {
  for (let i = 0; i < effects.length; i += 1) {
    if (state.phase === 'over') return
    const effect = effects[i]
    if (effect.kind === 'gainTrade' || effect.kind === 'gainCombat' || effect.kind === 'gainAuthority' || effect.kind === 'draw') {
      applyInstant(state, events, playerId, effect)
      continue
    }
    const opened = openChoice(state, events, playerId, effect)
    if (opened) {
      state.pendingChoice.resume = {
        effects: effects.slice(i + 1),
        playerId,
        sourceId,
        tail,
      }
      return
    }
  }
  finishTail(state, events, tail)
}

function startTurn(state, playerId) {
  for (const base of state.players[playerId].bases) base.allyUsed = false
}

function fillSlot(state, events, index) {
  const next = state.tradeDeck.pop() || null
  state.tradeRow[index] = next
  if (next) {
    emit(events, publicEvent({ type: 'tradeFilled', index, defId: next.defId, instanceId: next.instanceId }))
  }
}

function actorId(state) {
  if (state.phase === 'over') return null
  if (state.pendingChoice) return state.pendingChoice.playerId
  return state.activePlayerId
}

function scrapCard(state, events, card) {
  state.scrap.push(card)
  emit(events, publicEvent({
    type: 'cardScrapped',
    instanceId: card.instanceId,
    defId: card.defId,
  }))
}

function playCard(state, events, command) {
  const player = state.players[command.playerId]
  const card = takeFrom(player.hand, command.instanceId)
  if (!card) return 'That card is not in your hand'
  const def = getCard(card.defId)
  if (def.type === 'base' || def.type === 'outpost') player.bases.push(card)
  else player.inPlay.push(card)
  emit(events, publicEvent({
    type: 'cardPlayed',
    playerId: command.playerId,
    instanceId: card.instanceId,
    defId: card.defId,
  }))
  applyEffectList(
    state,
    events,
    command.playerId,
    def.effects.filter((effect) => effect.trigger === 'play'),
    card.instanceId,
    { thenAllies: true, playerId: command.playerId },
  )
  return null
}

function scrapPlayed(state, events, command) {
  const player = state.players[command.playerId]
  let card = takeFrom(player.inPlay, command.instanceId)
  if (!card) card = takeFrom(player.bases, command.instanceId)
  if (!card) return 'That card is not in play'
  const def = getCard(card.defId)
  const effects = def.effects.filter((effect) => effect.trigger === 'scrap')
  if (effects.length === 0) return 'That card cannot be scrapped'
  scrapCard(state, events, card)
  applyEffectList(state, events, command.playerId, effects, card.instanceId, null)
  return null
}

function buyCard(state, events, command) {
  const player = state.players[command.playerId]
  if (command.source === 'explorer') {
    const def = explorerCard()
    if (player.trade < def.cost) return 'Not enough trade'
    player.trade -= def.cost
    const card = makeInstance(state, def.id)
    player.discard.push(card)
    emit(events, publicEvent({
      type: 'cardBought',
      playerId: command.playerId,
      instanceId: card.instanceId,
      defId: card.defId,
    }))
    return null
  }
  const card = state.tradeRow[command.index]
  if (!card) return 'That trade row slot is empty'
  const def = getCard(card.defId)
  if (player.trade < def.cost) return 'Not enough trade'
  player.trade -= def.cost
  player.discard.push(card)
  emit(events, publicEvent({
    type: 'cardBought',
    playerId: command.playerId,
    instanceId: card.instanceId,
    defId: card.defId,
  }))
  fillSlot(state, events, command.index)
  return null
}

function attackBase(state, events, command) {
  const player = state.players[command.playerId]
  const opponent = state.players[other(command.playerId)]
  const card = opponent.bases.find((base) => base.instanceId === command.instanceId)
  if (!card) return 'That base is not in play'
  if (player.combat <= 0) return 'No combat'
  const outposts = opponent.bases.filter((base) => getCard(base.defId).type === 'outpost' && remaining(base) > 0)
  const def = getCard(card.defId)
  if (outposts.length > 0 && def.type !== 'outpost') return 'An outpost is blocking'
  const hp = remaining(card)
  if (hp <= 0) return 'That base is already destroyed'
  const spend = Math.min(player.combat, hp)
  player.combat -= spend
  card.damage += spend
  const destroyed = card.damage >= def.defense
  emit(events, publicEvent({
    type: 'baseDamaged',
    instanceId: card.instanceId,
    defId: card.defId,
    amount: spend,
    destroyed,
  }))
  if (destroyed) {
    takeFrom(opponent.bases, card.instanceId)
    card.damage = 0
    opponent.discard.push(card)
    emit(events, publicEvent({
      type: 'cardDiscarded',
      playerId: other(command.playerId),
      instanceId: card.instanceId,
      defId: card.defId,
    }))
  }
  dumpCombat(state, events, command.playerId)
  return null
}

function dumpCombat(state, events, playerId) {
  const player = state.players[playerId]
  if (state.phase === 'over' || player.combat <= 0) return
  const opponent = state.players[other(playerId)]
  const living = opponent.bases.filter((base) => remaining(base) > 0)
  if (living.length > 0) return
  attackPlayer(state, events, { playerId })
}

function attackPlayer(state, events, command) {
  const player = state.players[command.playerId]
  const opponentId = other(command.playerId)
  const opponent = state.players[opponentId]
  if (player.combat <= 0) return 'No combat'
  const blocked = opponent.bases.some((base) => getCard(base.defId).type === 'outpost' && remaining(base) > 0)
  if (blocked) return 'An outpost is blocking'
  const spend = player.combat
  player.combat = 0
  opponent.authority -= spend
  emit(events, publicEvent({
    type: 'authorityChanged',
    playerId: opponentId,
    amount: -spend,
    next: Math.max(0, opponent.authority),
  }))
  checkWin(state, events)
  return null
}

function resolveChoice(state, events, command) {
  const choice = state.pendingChoice
  if (!choice) return 'Nothing to choose'
  if (command.playerId !== choice.playerId) return 'Not your choice'
  if (!choice.options.some((option) => option.id === command.optionId)) return 'Not a legal card'
  const resume = choice.resume
  state.pendingChoice = null
  if (choice.kind === 'discard') {
    const owner = state.players[choice.ownerId]
    const card = takeFrom(owner.hand, command.optionId)
    owner.discard.push(card)
    emit(events, publicEvent({
      type: 'cardDiscarded',
      playerId: choice.ownerId,
      instanceId: card.instanceId,
      defId: card.defId,
    }))
  } else if (choice.kind === 'scrapOwn') {
    const owner = state.players[choice.ownerId]
    let card = takeFrom(owner.hand, command.optionId)
    if (!card) card = takeFrom(owner.discard, command.optionId)
    scrapCard(state, events, card)
  } else if (choice.kind === 'scrapRow') {
    const index = state.tradeRow.findIndex((card) => card && card.instanceId === command.optionId)
    const card = state.tradeRow[index]
    scrapCard(state, events, card)
    fillSlot(state, events, index)
  }
  if (resume) {
    applyEffectList(state, events, resume.playerId, resume.effects, resume.sourceId, resume.tail)
  }
  return null
}

function playHand(state, events, command) {
  const player = state.players[command.playerId]
  if (player.hand.length === 0) return 'No cards in hand'
  let guard = 0
  while (player.hand.length > 0 && !state.pendingChoice && state.phase !== 'over') {
    guard += 1
    if (guard > 30) return 'Could not play the hand'
    const card = player.hand[0]
    const error = playCard(state, events, { playerId: command.playerId, instanceId: card.instanceId })
    if (error) return error
  }
  return null
}

function endTurn(state, events, command) {
  const player = state.players[command.playerId]
  for (const card of [...player.inPlay, ...player.hand]) {
    emit(events, publicEvent({
      type: 'cardDiscarded',
      playerId: command.playerId,
      instanceId: card.instanceId,
      defId: card.defId,
    }))
  }
  player.discard.push(...player.inPlay, ...player.hand)
  player.inPlay = []
  player.hand = []
  player.trade = 0
  player.combat = 0
  emit(events, publicEvent({ type: 'turnEnded', playerId: command.playerId }))
  drawMany(state, events, command.playerId, 5, false)
  const next = other(command.playerId)
  state.activePlayerId = next
  state.turn += 1
  startTurn(state, next)
  emit(events, publicEvent({
    type: 'turnStarted',
    playerId: next,
    name: state.players[next].name,
  }))
  return null
}

export function setupGame(seed = 1, names = { p0: 'Player 1', p1: 'Player 2' }, copies = null) {
  const state = {
    rng: seed >>> 0 || 1,
    nextId: 1,
    seq: 0,
    turn: 1,
    phase: 'main',
    activePlayerId: 'p0',
    winner: null,
    pendingChoice: null,
    tradeRow: [],
    tradeDeck: [],
    scrap: [],
    players: {},
  }
  for (const id of players) {
    const deck = []
    for (const def of cards) {
      if (!def.opening) continue
      for (let i = 0; i < def.opening; i += 1) deck.push(makeInstance(state, def.id))
    }
    state.players[id] = {
      id,
      name: names[id],
      authority: 50,
      trade: 0,
      combat: 0,
      deck,
      hand: [],
      discard: [],
      inPlay: [],
      bases: [],
    }
    shuffleIn(state.players[id].deck, state)
  }
  for (const def of cards) {
    if (def.supply !== 'trade') continue
    const count = copies && Number.isInteger(copies[def.id]) ? copies[def.id] : def.deckCopies
    for (let i = 0; i < count; i += 1) state.tradeDeck.push(makeInstance(state, def.id))
  }
  shuffleIn(state.tradeDeck, state)
  for (let i = 0; i < 5; i += 1) state.tradeRow.push(state.tradeDeck.pop() || null)
  for (const id of players) drawMany(state, [], id, 5, true)
  startTurn(state, 'p0')
  return state
}

export function applyCommand(state, command) {
  const next = structuredClone(state)
  const events = []
  if (next.phase === 'over') return { state, events, error: 'Game over' }
  const actor = actorId(next)
  if (command.playerId !== actor) return { state, events, error: 'Not your turn' }
  let error = null
  if (next.pendingChoice && command.type !== 'CHOOSE') error = 'Choose first'
  else if (command.type === 'PLAY_CARD') error = playCard(next, events, command)
  else if (command.type === 'PLAY_HAND') error = playHand(next, events, command)
  else if (command.type === 'SCRAP_CARD') error = scrapPlayed(next, events, command)
  else if (command.type === 'BUY_CARD') error = buyCard(next, events, command)
  else if (command.type === 'ATTACK_BASE') error = attackBase(next, events, command)
  else if (command.type === 'ATTACK_PLAYER') error = attackPlayer(next, events, command)
  else if (command.type === 'CHOOSE') error = resolveChoice(next, events, command)
  else if (command.type === 'END_TURN') error = endTurn(next, events, command)
  else error = 'Unknown command'
  if (error || next.phase === 'over') {
    if (error) return { state, events: [], error }
  }
  next.seq += 1
  return { state: next, events, error: null }
}

export function legalCommands(state) {
  if (state.phase === 'over') return []
  if (state.pendingChoice) {
    return state.pendingChoice.options.map((option) => ({
      type: 'CHOOSE',
      playerId: state.pendingChoice.playerId,
      optionId: option.id,
    }))
  }
  const player = state.players[state.activePlayerId]
  const commands = []
  if (player.hand.length > 0) {
    commands.push({ type: 'PLAY_HAND', playerId: player.id })
  }
  for (const card of player.hand) {
    commands.push({ type: 'PLAY_CARD', playerId: player.id, instanceId: card.instanceId })
  }
  for (const card of [...player.inPlay, ...player.bases]) {
    const def = getCard(card.defId)
    if (def.effects.some((effect) => effect.trigger === 'scrap')) {
      commands.push({ type: 'SCRAP_CARD', playerId: player.id, instanceId: card.instanceId })
    }
  }
  state.tradeRow.forEach((card, index) => {
    if (card && player.trade >= getCard(card.defId).cost) {
      commands.push({ type: 'BUY_CARD', playerId: player.id, source: 'row', index })
    }
  })
  if (player.trade >= explorerCard().cost) {
    commands.push({ type: 'BUY_CARD', playerId: player.id, source: 'explorer' })
  }
  if (player.combat > 0) {
    const opponent = state.players[other(player.id)]
    const outposts = opponent.bases.filter((base) => getCard(base.defId).type === 'outpost' && remaining(base) > 0)
    if (outposts.length > 0) {
      for (const base of outposts) {
        commands.push({ type: 'ATTACK_BASE', playerId: player.id, instanceId: base.instanceId })
      }
    } else {
      commands.push({ type: 'ATTACK_PLAYER', playerId: player.id })
      for (const base of opponent.bases) {
        if (remaining(base) > 0) {
          commands.push({ type: 'ATTACK_BASE', playerId: player.id, instanceId: base.instanceId })
        }
      }
    }
  }
  commands.push({ type: 'END_TURN', playerId: player.id })
  return commands
}

export function viewFor(state, playerId) {
  const view = structuredClone(state)
  delete view.rng
  view.tradeDeck = { count: state.tradeDeck.length }
  view.scrap = { count: state.scrap.length }
  for (const id of players) {
    view.players[id].deck = { count: state.players[id].deck.length }
    if (id !== playerId) view.players[id].hand = { count: state.players[id].hand.length }
  }
  if (view.pendingChoice) {
    const mine = view.pendingChoice.playerId === playerId
    view.pendingChoice = {
      playerId: view.pendingChoice.playerId,
      kind: view.pendingChoice.kind,
      prompt: view.pendingChoice.prompt,
      options: mine ? view.pendingChoice.options : [],
      hidden: !mine,
    }
  }
  return view
}

export function filterEvents(events, playerId) {
  return events.filter((event) => event.audience === 'all' || event.audience === playerId)
}
