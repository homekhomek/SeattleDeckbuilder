import { effectView, factions } from '../cards.js'
import SymbolIcon, { Stat } from './SymbolIcon.jsx'

export default function Card({
  def,
  damage = 0,
  dimmed = false,
  selected = false,
  scrap = false,
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
  const effects = def.effects.map(effectView)
  return (
    <div
      className={`gcard${faction ? ` faction-${faction.id}` : ' faction-neutral'}${selected ? ' is-selected' : ''}${dimmed ? ' is-dim' : ''}${def.type === 'outpost' ? ' is-outpost' : ''}${large ? ' is-large' : ''}`}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {def.cost > 0 ? <div className="gcard-cost">{def.cost}</div> : null}
      {def.defense > 0 ? <div className="gcard-def">{hp}</div> : null}
      <div className="gcard-faction">
        {faction ? <SymbolIcon name={faction.id} /> : null}
      </div>
      <div className="gcard-name">{def.name}</div>
      <div className="gcard-type">{typeLabel}</div>
      {effects.map((effect, index) => (
        <div
          className={`effect-line trigger-${effect.trigger}`}
          key={`${effect.trigger}-${index}`}
          style={{ top: (large ? 118 : 62) + index * (large ? 22 : 14) }}
        >
          {effect.trigger === 'ally' ? <div className="effect-tag">Ally</div> : null}
          {effect.trigger === 'scrap' ? <div className="effect-tag">Scrap</div> : null}
          {effect.symbol ? <Stat kind={effect.symbol} amount={effect.amount} /> : <div className="effect-words">{effect.text}</div>}
        </div>
      ))}
      {scrap ? <div className="gcard-scrap">Scrap</div> : null}
    </div>
  )
}
