import { getCard } from '../cards.js'
import Card from './Card.jsx'

const zoneOrder = ['hand', 'discard', 'trade', 'inPlay', 'bases']

const zoneLabel = {
  hand: 'Hand',
  discard: 'Discard',
  trade: 'Trade row',
  inPlay: 'In play',
  bases: 'Bases',
}

export default function CardPicker({ prompt, options, locate, busy, onChoose }) {
  const groups = zoneOrder
    .map((zone) => ({
      zone,
      label: zoneLabel[zone],
      items: options
        .filter((option) => option.zone === zone)
        .map((option) => ({ ...option, card: locate(option.id) }))
        .filter((option) => option.card),
    }))
    .filter((group) => group.items.length)

  return (
    <div className="choice-layer">
      <div className="choice-title">{prompt}</div>
      <div className="choice-board">
        <div className="choice-sheet" style={{ height: groups.length * 150 }}>
          {groups.map((group, groupIndex) => (
            <div className="choice-group" key={group.zone} style={{ top: groupIndex * 150 }}>
              <div className="choice-zone">{group.label}</div>
              <div className="choice-scroller">
                <div className="row-track" style={{ width: Math.max(96, group.items.length * 100) }}>
                  {group.items.map((item, index) => (
                    <div className="choice-slot" key={item.id} style={{ left: index * 100, top: 0 }}>
                      <Card
                        def={getCard(item.card.defId)}
                        damage={item.card.damage}
                        selected
                        onClick={() => {
                          if (busy) return
                          onChoose(item.id)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
