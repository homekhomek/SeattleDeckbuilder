import { useState } from 'react'
import { cards } from '../cards.js'
import Card from '../components/Card.jsx'
import { loadCopies, setCopy } from '../deckSetup.js'

export default function Catalog({ onBack }) {
  const [copies, setCopies] = useState(loadCopies)
  const rows = Math.ceil(cards.length / 2)
  const total = Object.values(copies).reduce((sum, count) => sum + count, 0)

  function bump(id, delta) {
    setCopies(setCopy(id, (copies[id] ?? 0) + delta))
  }

  return (
    <div className="stage">
      <div className="back-pin" onClick={onBack}>Back</div>
      <div className="catalog-title">All cards</div>
      <div className="catalog-count">Trade deck {total}</div>
      <div className="catalog-page">
        <div className="catalog-board" style={{ height: rows * 300 + 24 }}>
          {cards.map((def, index) => {
            const col = index % 2
            const row = Math.floor(index / 2)
            return (
              <div
                className="catalog-slot"
                key={def.id}
                style={{ left: col === 0 ? '4%' : '52%', top: row * 300 }}
              >
                <div className="catalog-card">
                  <Card def={def} large />
                </div>
                {def.supply === 'trade' ? (
                  <div className="copy-controls">
                    <div className="copy-btn copy-minus" onClick={() => bump(def.id, -1)}>-</div>
                    <div className="copy-count">{copies[def.id]}</div>
                    <div className="copy-btn copy-plus" onClick={() => bump(def.id, 1)}>+</div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
