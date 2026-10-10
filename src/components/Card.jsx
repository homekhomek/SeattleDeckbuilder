import { effectView, factions } from '../cards.js'
import SymbolIcon, { Stat } from './SymbolIcon.jsx'

function boxHeight(effect, large) {
  const long = !effect.symbol && effect.text.length > (large ? 24 : 14)
  if (large) return long ? 40 : 28
  return long ? 22 : 16
}

function placeEffects(effects, large) {
  const gap = large ? 4 : 1
  let top = large ? 116 : 42
  return effects.map((effect) => {
    const height = boxHeight(effect, large)
    const placed = { effect, height, top }
    top += height + gap
    return placed
  })
}

export default function Card({
  def,
  damage = 0,
  dimmed = false,
  selected = false,
  dragging = false,
  flip = false,
  arrive = false,
  large = false,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  if (!def) return null
  const faction = def.faction ? factions[def.faction] : null
  const hp = def.defense > 0 ? def.defense - damage : 0
  const typeLabel = def.type === 'outpost' ? 'Outpost' : def.type === 'base' ? 'Base' : 'Ship'
  const effects = placeEffects(def.effects.map(effectView), large)
  const shell = [
    'gcard',
    faction ? `faction-${faction.id}` : 'faction-neutral',
    selected ? 'is-selected' : '',
    dimmed ? 'is-dim' : '',
    dragging ? 'is-dragging' : '',
    def.type === 'outpost' ? 'is-outpost' : '',
    large ? 'is-large' : '',
    flip ? 'is-flip' : '',
    arrive ? 'is-arriving' : '',
  ].filter(Boolean).join(' ')
  return (
    <div
      className={shell}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="gcard-rotor">
        <div className="gcard-face">
          {def.cost > 0 ? <div className="gcard-cost">{def.cost}</div> : null}
          {def.defense > 0 ? <div className="gcard-def">{hp}</div> : null}
          <div className="gcard-name">{def.name}</div>
          {faction ? (
            <div className="gcard-faction">
              <SymbolIcon name={faction.id} />
            </div>
          ) : null}
          <div className="gcard-type">{typeLabel}</div>
          {effects.map(({ effect, height, top }, index) => (
            <div
              className={`effect-line trigger-${effect.trigger}${effect.trigger === 'play' ? '' : ' is-marked'}`}
              key={`${effect.trigger}-${index}`}
              style={{ top, height }}
            >
              {effect.trigger === 'ally' && faction ? <div className="effect-mark"><SymbolIcon name={faction.id} /></div> : null}
              {effect.trigger === 'scrap' ? <div className="effect-mark"><SymbolIcon name="scrap" /></div> : null}
              {effect.trigger !== 'play' ? <div className="effect-rule" /> : null}
              {effect.symbol ? <Stat kind={effect.symbol} amount={effect.amount} /> : <div className="effect-words">{effect.text}</div>}
            </div>
          ))}
        </div>
        <div className="gcard-back">
          <div className="gcard-back-mark" />
        </div>
      </div>
    </div>
  )
}
