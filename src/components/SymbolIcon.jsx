import { marks } from '../icons/marks.js'

export default function SymbolIcon({ name }) {
  return (
    <svg className={`sym sym-${name}`} viewBox="0 0 512 512" aria-hidden="true">
      <path d={marks[name]} />
    </svg>
  )
}

export function Stat({ kind, amount }) {
  return (
    <div className={`stat stat-${kind}`}>
      <div className="stat-n">{amount}</div>
      <SymbolIcon name={kind} />
    </div>
  )
}
