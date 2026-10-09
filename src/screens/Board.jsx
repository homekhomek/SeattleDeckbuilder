import { explorerCard, getCard } from '../cards.js'
import Card from '../components/Card.jsx'

function other(id) {
  return id === 'p0' ? 'p1' : 'p0'
}

function Row({ className, items, render }) {
  const width = Math.max(96, items.length * 96)
  return (
    <div className={className}>
      <div className="row-track" style={{ width }}>
        {items.map((item, index) => (
          <div className="row-slot" key={item?.instanceId || `slot-${index}`} style={{ left: index * 96, top: 0 }}>
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

export default function Board({ snap, banner, busy, pulse, onCommand, onLeave }) {
  const { view, you, mode } = snap
  const me = view.players[you]
  const opp = view.players[other(you)]
  const yourTurn = view.phase !== 'over' && (view.pendingChoice
    ? view.pendingChoice.playerId === you && !view.pendingChoice.hidden
    : view.activePlayerId === you)
  const choice = view.pendingChoice && !view.pendingChoice.hidden ? view.pendingChoice : null
  const canAct = yourTurn && !busy && !choice
  const dayPass = explorerCard()
  const tradeCards = [null, ...view.tradeRow]

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

  return (
    <div className="fit">
      <div className="you-chip">{me.name} · {me.authority}</div>
      <div className="opp-bar" onClick={() => attack(null)}>
        <div className="opp-name">{opp.name}</div>
        <div className="opp-auth">{opp.authority}</div>
        <div className="opp-meta">{Array.isArray(opp.hand) ? opp.hand.length : opp.hand.count} in hand</div>
      </div>

      <div className="zone-label zone-opp">Opponent bases</div>
      <Row
        className="row row-opp"
        items={opp.bases.length ? opp.bases : []}
        render={(card) => (
          <Card
            def={getCard(card.defId)}
            damage={card.damage}
            selected={pulse === card.instanceId}
            onClick={() => attack(card.instanceId)}
          />
        )}
      />
      {opp.bases.length === 0 ? <div className="empty-note note-opp">No bases</div> : null}

      <div className="zone-label zone-trade">Trade row</div>
      <Row
        className="row row-trade"
        items={tradeCards}
        render={(card, index) => {
          if (index === 0) {
            return (
              <Card
                def={dayPass}
                dimmed={!canAct || me.trade < dayPass.cost}
                onClick={buyPass}
              />
            )
          }
          if (!card) return <div className="empty-card" />
          const def = getCard(card.defId)
          return (
            <Card
              def={def}
              dimmed={!canAct || me.trade < def.cost}
              selected={pulse === card.instanceId}
              onClick={() => buyRow(index - 1)}
            />
          )
        }}
      />

      <div className="pool pool-trade">{me.trade} trade</div>
      <div className="pool pool-combat">{me.combat} combat</div>
      <div className="piles">Deck {me.deck.count} · Discard {me.discard.length}</div>

      <div className="zone-label zone-play">In play</div>
      <Row
        className="row row-play"
        items={mineInPlay}
        render={(card) => {
          const def = getCard(card.defId)
          const canScrap = def.effects.some((effect) => effect.trigger === 'scrap')
          return (
            <Card
              def={def}
              damage={card.damage}
              scrap={canScrap && canAct}
              selected={pulse === card.instanceId}
              onClick={canScrap ? () => scrap(card) : undefined}
            />
          )
        }}
      />

      <div className="zone-label zone-hand">Hand</div>
      <Row
        className="row row-hand"
        items={Array.isArray(me.hand) ? me.hand : []}
        render={(card) => (
          <Card
            def={getCard(card.defId)}
            dimmed={!canAct}
            selected={pulse === card.instanceId}
            onClick={() => play(card)}
          />
        )}
      />

      <div className="banner">{prompt}</div>
      <div className="leave-btn" onClick={onLeave}>Leave</div>
      <div
        className={canAct ? 'end-btn' : 'end-btn is-dim'}
        onClick={() => {
          if (!canAct) return
          onCommand({ type: 'END_TURN' })
        }}
      >
        End turn
      </div>

      {choice ? (
        <div className="choice-layer">
          <div className="choice-title">{choice.prompt}</div>
          <div className="choice-board">
            <div className="choice-sheet" style={{ height: Math.ceil(choice.options.length / 3) * 156 + 12 }}>
              {choice.options.map((instanceId, index) => {
                const card = locate(view, you, instanceId)
                if (!card) return null
                const col = index % 3
                const row = Math.floor(index / 3)
                return (
                  <div
                    className="choice-slot"
                    key={instanceId}
                    style={{ left: 12 + col * 124, top: row * 156 }}
                  >
                    <Card
                      def={getCard(card.defId)}
                      damage={card.damage}
                      selected
                      onClick={() => {
                        if (busy) return
                        onCommand({ type: 'CHOOSE', optionId: instanceId })
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
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
