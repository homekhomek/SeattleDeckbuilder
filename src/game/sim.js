import { explorerCard, getCard } from '../cards.js'
import { applyCommand, legalCommands, setupGame } from './engine.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function instance(defId, instanceId) {
  return { instanceId, defId, damage: 0, allyUsed: false }
}

function scripted() {
  let state = setupGame(1)
  state.players.p0.hand = [instance('dock-scout', 's1')]
  state.players.p0.trade = 0
  let result = applyCommand(state, { type: 'PLAY_CARD', playerId: 'p0', instanceId: 's1' })
  assert(!result.error, result.error)
  assert(result.state.players.p0.trade === 1, 'scout trade')
  state = result.state

  state.players.p0.hand = [
    instance('ferry-runner', 'h1'),
    instance('ferry-runner', 'h2'),
  ]
  state.players.p0.authority = 50
  state.players.p0.inPlay = []
  result = applyCommand(state, { type: 'PLAY_CARD', playerId: 'p0', instanceId: 'h1' })
  assert(!result.error, result.error)
  assert(result.state.players.p0.authority === 50, 'first harbor has no ally')
  result = applyCommand(result.state, { type: 'PLAY_CARD', playerId: 'p0', instanceId: 'h2' })
  assert(!result.error, result.error)
  assert(result.state.players.p0.authority === 54, 'both harbor allies heal')
  state = result.state

  state.players.p1.bases = [instance('forge', 'forge1')]
  state.players.p0.combat = 10
  result = applyCommand(state, { type: 'ATTACK_PLAYER', playerId: 'p0' })
  assert(result.error, 'outpost should block')
  result = applyCommand(state, { type: 'ATTACK_BASE', playerId: 'p0', instanceId: 'forge1' })
  assert(!result.error, result.error)
  assert(result.state.players.p1.bases.length === 0, 'outpost destroyed')
  assert(result.state.players.p0.combat === 4, 'leftover combat')
  result = applyCommand(result.state, { type: 'ATTACK_PLAYER', playerId: 'p0' })
  assert(!result.error, result.error)
  assert(result.state.players.p1.authority === 46, 'player damage')

  state = setupGame(2)
  const before = state.players.p1.hand.length
  state.players.p0.hand = []
  state.players.p0.inPlay = []
  result = applyCommand(state, { type: 'END_TURN', playerId: 'p0' })
  assert(!result.error, result.error)
  assert(result.state.activePlayerId === 'p1', 'turn passed')
  assert(result.state.players.p0.hand.length === 5, 'ender redrew')
  assert(result.state.players.p1.hand.length === before, 'opponent hand stayed')

  state = setupGame(3)
  state.players.p0.trade = 2
  state.players.p0.hand = []
  const discardBefore = state.players.p0.discard.length
  result = applyCommand(state, { type: 'BUY_CARD', playerId: 'p0', source: 'explorer' })
  assert(!result.error, result.error)
  assert(result.state.players.p0.trade === 0, 'day pass spent trade')
  assert(result.state.players.p0.discard.length === discardBefore + 1, 'day pass to discard')
  assert(result.state.players.p0.discard.at(-1).defId === explorerCard().id, 'bought day pass')

  state = setupGame(4)
  state.players.p0.hand = [instance('day-pass', 'dp')]
  state.players.p0.inPlay = []
  result = applyCommand(state, { type: 'PLAY_CARD', playerId: 'p0', instanceId: 'dp' })
  result = applyCommand(result.state, { type: 'SCRAP_CARD', playerId: 'p0', instanceId: 'dp' })
  assert(!result.error, result.error)
  assert(result.state.players.p0.inPlay.length === 0, 'scrapped out of play')
  assert(result.state.scrap.length === 1, 'scrap pile')
  assert(result.state.players.p0.combat >= 2, 'scrap combat')

  state = setupGame(6)
  const dealt = state.players.p0.hand.length
  result = applyCommand(state, { type: 'PLAY_HAND', playerId: 'p0' })
  assert(!result.error, result.error)
  assert(result.state.players.p0.inPlay.length + result.state.players.p0.bases.length === dealt, 'played the hand')
  assert(result.state.players.p0.hand.length === 0, 'hand empty')

  const custom = setupGame(9, { p0: 'A', p1: 'B' }, { 'ferry-runner': 4 })
  const ferry = [...custom.tradeDeck, ...custom.tradeRow.filter(Boolean)]
    .filter((card) => card.defId === 'ferry-runner')
  assert(ferry.length === 4, 'trade deck copy override')
}

function costOf(command, state) {
  if (command.source === 'explorer') return explorerCard().cost
  return getCard(state.tradeRow[command.index].defId).cost
}

function greedy(state) {
  const commands = legalCommands(state)
  const play = commands.find((command) => command.type === 'PLAY_CARD')
  if (play) return play
  const choose = commands.find((command) => command.type === 'CHOOSE')
  if (choose) return choose
  const buys = commands.filter((command) => command.type === 'BUY_CARD')
  buys.sort((a, b) => costOf(b, state) - costOf(a, state))
  if (buys[0]) return buys[0]
  const attack = commands.find((command) => command.type === 'ATTACK_BASE' || command.type === 'ATTACK_PLAYER')
  if (attack) return attack
  const scrap = commands.find((command) => command.type === 'SCRAP_CARD')
  if (scrap) return scrap
  return commands.find((command) => command.type === 'END_TURN')
}

function playOut() {
  let state = setupGame(11)
  for (let step = 0; step < 800 && state.phase !== 'over'; step += 1) {
    const command = greedy(state)
    assert(command, 'no legal command')
    const result = applyCommand(state, command)
    assert(!result.error, `${result.error} on ${command.type}`)
    state = result.state
  }
  assert(state.phase === 'over', 'game did not finish')
  assert(state.winner === 'p0' || state.winner === 'p1', 'winner')
  const loser = state.winner === 'p0' ? 'p1' : 'p0'
  assert(state.players[loser].authority === 0, 'loser at zero')
  console.log(`sim winner ${state.players[state.winner].name} on turn ${state.turn}`)
}

scripted()
playOut()
