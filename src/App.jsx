import { useState } from 'react'
import Catalog from './screens/Catalog.jsx'
import Home from './screens/Home.jsx'
import Join from './screens/Join.jsx'
import Match from './screens/Match.jsx'

export default function App() {
  const [route, setRoute] = useState('home')
  const [table, setTable] = useState(null)

  function leave() {
    setTable(null)
    setRoute('home')
  }

  if (route === 'catalog') return <Catalog onBack={() => setRoute('home')} />
  if (route === 'join') {
    return (
      <Join
        onBack={() => setRoute('home')}
        onConnect={(code) => {
          setTable({ kind: 'guest', code })
          setRoute('match')
        }}
      />
    )
  }
  if (route === 'match' && table) return <Match spec={table} onLeave={leave} />

  return (
    <Home
      onHost={() => {
        setTable({ kind: 'host' })
        setRoute('match')
      }}
      onJoin={() => setRoute('join')}
      onHotseat={() => {
        setTable({ kind: 'hotseat' })
        setRoute('match')
      }}
      onCatalog={() => setRoute('catalog')}
    />
  )
}
