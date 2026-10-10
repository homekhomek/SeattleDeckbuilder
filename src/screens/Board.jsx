import { useRef } from 'react'
import { explorerCard, getCard } from '../cards.js'
import Card from '../components/Card.jsx'
import CardPicker from '../components/CardPicker.jsx'
import { Stat } from '../components/SymbolIcon.jsx'
import { useBoardDrag } from '../components/useBoardDrag.js'

function other(id) {
  return id === 'p0' ? 'p1' : 'p0'
}

function Row({ className, items, render, mark }) {
  const width = Math.max(86, items.length * 86)
  return (
    <div className={className}>
      <div className="row-track" style={{ width }}>
        {items.map((item, index) => (
          <div
            className="row-slot"
            key={item?.instanceId || `slot-${index}`}
            ref={mark?.(item?.instanceId)}
            style={{ left: index * 86, top: 0 }}
          >
            {render(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

function locate(view, you, instanceId) {
  const lists = [
    view.players[you].hand,
    view.players[you].discard,
    view.players[you].inPlay,
    view.players[you].bases,
    view.tradeRow,
    view.players[other(you)].bases,
    view.players[other(you)].inPlay,
  ]
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    const found = list.find((card) => card && card.instanceId === instanceId)
    if (found) return found
  }
  return null
}

function flyersFor(motion) {
  if (!motion) return []
  if (motion.type === 'cardDiscarded') return motion.cards || [motion]
  if (motion.type === 'cardBought') return [motion]
  return []
}

export default function Board({ snap, banner, busy, pulse, motion, onCommand, onLeave }) {
  const boardRef = useRef(null)
  const spots = useRef({})
  const { drag, ghostRef, bind } = useBoardDrag(boardRef)
  function mark(id) {
    return (el) => {
      if (!el || !id || !boardRef.current) return
      const board = boardRef.current.getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      const scale = board.width / 390 || 1
      spots.current[id] = {
        x: (rect.left - board.left) / scale,
        y: (rect.top - board.top) / scale,
      }
    }
  }
  const flipping = motion && (motion.type === 'tradeFilled' || motion.type === 'cardDrawn') ? motion.instanceId : null
  const arriving = motion?.type === 'tradeFilled' ? motion.instanceId : null
  const { view, you, mode } = snap
  const me = view.players[you]
  const opp = view.players[other(you)]
  const yourTurn = view.phase !== 'over' && (view.pendingChoice
    ? view.pendingChoice.playerId === you && !view.pendingChoice.hidden
    : view.activePlayerId === you)
  const choice = view.pendingChoice && !view.pendingChoice.hidden ? view.pendingChoice : null
  const canAct = yourTurn && !busy && !choice
  const dayPass = explorerCard()
  const tradeSlots = view.tradeRow.map((card, index) => ({ card, index }))

  function play(card) {
    if (!canAct) return
    onCommand({ type: 'PLAY_CARD', instanceId: card.instanceId })
  }

  function scrap(card) {
    if (!canAct) return
    onCommand({ type: 'SCRAP_CARD', instanceId: card.instanceId })
  }

  function buyRow(index) {
    if (!canAct) return
    onCommand({ type: 'BUY_CARD', source: 'row', index })
  }

  function buyPass() {
    if (!canAct || me.trade < dayPass.cost) return
    onCommand({ type: 'BUY_CARD', source: 'explorer' })
  }

  function attack(instanceId) {
    if (!canAct || me.combat <= 0) return
    if (instanceId) onCommand({ type: 'ATTACK_BASE', instanceId })
    else onCommand({ type: 'ATTACK_PLAYER' })
  }

  const mineInPlay = [...me.bases, ...me.inPlay]
  const prompt = choice?.prompt
    || (view.phase === 'over' ? `${view.players[view.winner].name} wins` : null)
    || (view.pendingChoice?.hidden ? 'Waiting on the other player' : null)
    || (!yourTurn ? `${opp.name}'s turn` : null)
    || banner
    || (mode === 'hotseat' ? `${me.name}, your turn` : 'Your turn')

  const hand = Array.isArray(me.hand) ? me.hand : []

  return (
    <div className="fit" ref={boardRef}>
      <div className="you-chip">
        <div className="you-name">{me.name}</div>
      </div>
      <div className="opp-bar">
        <div className="opp-name">{opp.name}</div>
        <div className="opp-meta">{Array.isArray(opp.hand) ? opp.hand.length : opp.hand.count} in hand</div>
      </div>

      <div className="zone-label zone-opp">Opponent bases</div>
      <div className="opp-health" onClick={() => attack(null)}>
        <Stat kind="heal" amount={opp.authority} />
      </div>
      <Row
        className="row row-opp"
        items={opp.bases.length ? opp.bases : []}
        mark={mark}
        render={(card) => (
          <Card
            def={getCard(card.defId)}
            damage={card.damage}
            selected={pulse === card.instanceId}
            flip={flipping === card.instanceId}
            arrive={arriving === card.instanceId}
            onClick={() => attack(card.instanceId)}
          />
        )}
      />
      {opp.bases.length === 0 ? <div className="empty-note note-opp">No bases</div> : null}

      <div className="zone-label zone-trade">Trade row</div>
      <div className="trade-grid">
        <div className="trade-cell" style={{ left: 66, top: 0 }}>
          <Card
            def={dayPass}
            dimmed={!canAct || me.trade < dayPass.cost}
            dragging={drag?.key === 'explorer'}
            {...(canAct ? bind({ action: 'buy', def: dayPass, key: 'explorer', dragOnly: true, run: buyPass }) : {})}
          />
        </div>
        {tradeSlots.map((slot, i) => {
          const col = (i + 1) % 3
          const row = Math.floor((i + 1) / 3)
          if (!slot.card) {
            return (
              <div className="trade-cell" key={`empty-${slot.index}`} style={{ left: 66 + col * 90, top: row * 112 }}>
                <div className="empty-card" />
              </div>
            )
          }
          const def = getCard(slot.card.defId)
          return (
            <div className="trade-cell" key={slot.card.instanceId} ref={mark(slot.card.instanceId)} style={{ left: 66 + col * 90, top: row * 112 }}>
              <Card
                def={def}
                dimmed={!canAct || me.trade < def.cost}
                selected={pulse === slot.card.instanceId}
                dragging={drag?.key === slot.card.instanceId}
                flip={flipping === slot.card.instanceId}
                arrive={arriving === slot.card.instanceId}
                {...(canAct ? bind({ action: 'buy', def, key: slot.card.instanceId, dragOnly: true, run: () => buyRow(slot.index) }) : {})}
              />
            </div>
          )
        })}
      </div>

      <div className="pool pool-trade"><Stat kind="trade" amount={me.trade} /></div>
      <div className="pool pool-combat"><Stat kind="combat" amount={me.combat} /></div>

      <div className="zone-label zone-play">In play</div>
      <Row
        className="row row-play"
        items={mineInPlay}
        mark={mark}
        render={(card) => {
          const def = getCard(card.defId)
          const canScrap = def.effects.some((effect) => effect.trigger === 'scrap')
          return (
            <Card
              def={def}
              damage={card.damage}
              selected={pulse === card.instanceId}
              dragging={drag?.key === card.instanceId}
              flip={flipping === card.instanceId}
              arrive={arriving === card.instanceId}
              {...(canScrap && canAct ? bind({ action: 'scrap', def, key: card.instanceId, run: () => scrap(card) }) : {})}
            />
          )
        }}
      />

      <div className="zone-label zone-hand">Hand</div>
      <div className="you-health">
        <Stat kind="heal" amount={me.authority} />
      </div>
      <div
        className={canAct && hand.length ? 'play-hand-btn' : 'play-hand-btn is-dim'}
        onClick={() => {
          if (!canAct || hand.length === 0) return
          onCommand({ type: 'PLAY_HAND' })
        }}
      >
        Play hand
      </div>
      <Row
        className="row row-hand"
        items={hand}
        mark={mark}
        render={(card) => {
          const def = getCard(card.defId)
          return (
            <Card
              def={def}
              dimmed={!canAct}
              selected={pulse === card.instanceId}
              dragging={drag?.key === card.instanceId}
              flip={flipping === card.instanceId}
              arrive={arriving === card.instanceId}
              {...(canAct ? bind({ action: 'play', def, key: card.instanceId, run: () => play(card) }) : {})}
            />
          )
        }}
      />

      <div className="banner">{prompt}</div>
      <div className="pile-deck">Deck {me.deck.count}</div>
      <div className="pile-discard">Discard {me.discard.length}</div>
      <div
        className={canAct ? 'end-btn' : 'end-btn is-dim'}
        onClick={() => {
          if (!canAct) return
          onCommand({ type: 'END_TURN' })
        }}
      >
        End turn
      </div>

      {drag ? (
        <div className={`drop-pad${drag.action === 'buy' ? ' is-buy' : ''}${drag.over === drag.action ? ' is-over' : ''}`} data-drop={drag.action}>
          {drag.action === 'play' ? 'Play' : drag.action === 'buy' ? 'Buy' : 'Scrap'}
        </div>
      ) : null}
      {drag ? (
        <div className="drag-ghost" ref={ghostRef}>
          <Card def={drag.def} />
        </div>
      ) : null}
      {flyersFor(motion).map((card) => {
        const at = spots.current[card.instanceId] || { x: 149, y: 186 }
        return (
          <div className="discard-fly" key={card.instanceId} style={{ left: at.x, top: at.y }}>
            <Card def={getCard(card.defId)} />
          </div>
        )
      })}

      {choice ? (
        <CardPicker
          prompt={choice.prompt}
          options={choice.options}
          busy={busy}
          locate={(instanceId) => locate(view, you, instanceId)}
          onChoose={(optionId) => onCommand({ type: 'CHOOSE', optionId })}
        />
      ) : null}

      {view.phase === 'over' ? (
        <div className="win-layer">
          <div className="win-title">{view.players[view.winner].name} wins</div>
          <div className="home-btn btn-win" onClick={onLeave}>Back home</div>
        </div>
      ) : null}
    </div>
  )
}
