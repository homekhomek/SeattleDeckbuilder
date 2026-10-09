import { factions, linesFor } from '../cards.js'

export default function Card({ def, damage = 0, dimmed = false, selected = false, scrap = false, large = false, onClick }) {
  if (!def) return null
  const faction = def.faction ? factions[def.faction] : null
  const hp = def.defense > 0 ? def.defense - damage : 0
  const lines = linesFor(def)
  const typeLabel = def.type === 'outpost' ? 'Outpost' : def.type === 'base' ? 'Base' : 'Ship'
  return (
    <div
      className={`gcard${faction ? ` faction-${faction.id}` : ' faction-neutral'}${selected ? ' is-selected' : ''}${dimmed ? ' is-dim' : ''}${def.type === 'outpost' ? ' is-outpost' : ''}${large ? ' is-large' : ''}`}
      onClick={onClick}
    >
      {def.cost > 0 ? <div className="gcard-cost">{def.cost}</div> : null}
      {def.defense > 0 ? <div className="gcard-def">{hp}</div> : null}
      <div className="gcard-faction">{faction ? faction.name : 'Neutral'}</div>
      <div className="gcard-name">{def.name}</div>
      <div className="gcard-type">{typeLabel}</div>
      <div className="gcard-rules">{lines.join('\n')}</div>
      {scrap ? <div className="gcard-scrap">Scrap</div> : null}
    </div>
  )
}
