import Peer from 'peerjs'
import { loadCopies } from '../deckSetup.js'
import { applyCommand, filterEvents, setupGame, viewFor } from '../game/engine.js'

function emitter() {
  const listeners = new Set()
  let current = null
  return {
    snapshot() {
      return current
    },
    publish(next) {
      current = next
      for (const listener of listeners) listener(next)
    },
    subscribe(listener) {
      listeners.add(listener)
      if (current) listener(current)
      return () => listeners.delete(listener)
    },
  }
}

function blank(mode) {
  return {
    mode,
    status: 'connecting',
    you: mode === 'guest' ? 'p1' : 'p0',
    peerId: null,
    view: null,
    events: [],
    error: null,
  }
}

function seat(state) {
  if (state.phase === 'over') return state.winner || state.activePlayerId
  if (state.pendingChoice) return state.pendingChoice.playerId
  return state.activePlayerId
}

function tableCode() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let text = ''
  for (const byte of bytes) text += alphabet[byte % alphabet.length]
  return text
}

export function createHotseat() {
  let state = setupGame(Date.now() >>> 0, { p0: 'Player 1', p1: 'Player 2' }, loadCopies())
  let closed = false
  const bus = emitter()
  function publish(events, error) {
    if (closed) return
    const you = seat(state)
    bus.publish({
      mode: 'hotseat',
      status: 'playing',
      you,
      peerId: null,
      view: viewFor(state, you),
      events: filterEvents(events, you),
      error,
    })
  }
  publish([], null)
  return {
    subscribe: bus.subscribe,
    send(command) {
      if (closed) return
      const result = applyCommand(state, { ...command, playerId: seat(state) })
      if (result.error) {
        publish([], result.error)
        return
      }
      state = result.state
      publish(result.events, null)
    },
    close() {
      closed = true
    },
  }
}

export function createHost() {
  let state = null
  let conn = null
  let peer = null
  let closed = false
  const bus = emitter()
  function publish(partial) {
    if (closed) return
    bus.publish({ ...blank('host'), ...(bus.snapshot() || {}), ...partial })
  }
  function broadcast(events) {
    publish({
      status: 'playing',
      you: 'p0',
      view: viewFor(state, 'p0'),
      events: filterEvents(events, 'p0'),
      error: null,
    })
    if (conn?.open) {
      conn.send({
        t: 'sync',
        view: viewFor(state, 'p1'),
        events: filterEvents(events, 'p1'),
      })
    }
  }
  function applyFrom(command) {
    if (!state || closed) return
    const result = applyCommand(state, command)
    if (result.error) {
      if (command.playerId === 'p0') publish({ error: result.error, events: [] })
      else if (conn?.open) conn.send({ t: 'error', error: result.error })
      return
    }
    state = result.state
    broadcast(result.events)
  }
  peer = new Peer(tableCode())
  peer.on('open', (id) => publish({ status: 'waiting', peerId: id, error: null }))
  peer.on('error', (err) => publish({ status: 'error', error: err.message || 'Could not open a table' }))
  peer.on('connection', (incoming) => {
    if (closed) {
      incoming.close()
      return
    }
    if (conn) {
      incoming.close()
      return
    }
    conn = incoming
    conn.on('open', () => {
      state = setupGame((Date.now() >>> 0) || 1, { p0: 'Host', p1: 'Guest' }, loadCopies())
      broadcast([])
    })
    conn.on('data', (message) => {
      if (message?.t === 'command') applyFrom(message.command)
    })
    conn.on('close', () => publish({ status: 'closed', error: 'The other player left' }))
  })
  publish({ status: 'connecting' })
  return {
    subscribe: bus.subscribe,
    send(command) {
      applyFrom({ ...command, playerId: 'p0' })
    },
    close() {
      closed = true
      conn?.close()
      peer?.destroy()
    },
  }
}

export function createGuest(peerId) {
  let conn = null
  let closed = false
  const peer = new Peer()
  const bus = emitter()
  function publish(partial) {
    if (closed) return
    bus.publish({ ...blank('guest'), peerId, ...(bus.snapshot() || {}), ...partial })
  }
  peer.on('open', () => {
    conn = peer.connect(peerId)
    conn.on('open', () => publish({ status: 'waiting', error: null }))
    conn.on('data', (message) => {
      if (message?.t === 'sync') {
        publish({
          status: 'playing',
          view: message.view,
          events: message.events || [],
          error: null,
        })
      } else if (message?.t === 'error') {
        publish({ error: message.error, events: [] })
      }
    })
    conn.on('close', () => publish({ status: 'closed', error: 'The other player left' }))
    conn.on('error', (err) => publish({ status: 'error', error: err.message || 'Could not join' }))
  })
  peer.on('error', (err) => publish({ status: 'error', error: err.message || 'Could not join' }))
  publish({ status: 'connecting', peerId })
  return {
    subscribe: bus.subscribe,
    send(command) {
      if (conn?.open) conn.send({ t: 'command', command: { ...command, playerId: 'p1' } })
    },
    close() {
      closed = true
      conn?.close()
      peer.destroy()
    },
  }
}
