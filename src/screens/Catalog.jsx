import { cards } from '../cards.js'
import Card from '../components/Card.jsx'

export default function Catalog({ onBack }) {
  const rows = Math.ceil(cards.length / 2)
  return (
    <div className="stage">
      <div className="back-pin" onClick={onBack}>Back</div>
      <div className="catalog-title">All cards</div>
      <div className="catalog-page">
        <div className="catalog-board" style={{ height: rows * 250 + 24 }}>
          {cards.map((def, index) => {
            const col = index % 2
            const row = Math.floor(index / 2)
            return (
              <div
                className="catalog-slot"
                key={def.id}
                style={{ left: col === 0 ? '4%' : '52%', top: row * 250 }}
              >
                <Card def={def} large />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
