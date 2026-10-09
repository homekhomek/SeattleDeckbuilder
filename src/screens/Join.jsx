import { useState } from 'react'

export default function Join({ onBack, onConnect }) {
  const [code, setCode] = useState('')
  const ready = code.trim().length > 0
  return (
    <div className="stage">
      <div className="fit">
        <div className="home-kicker">Join a table</div>
        <h1 className="home-title join-title">Enter the code</h1>
        <input
          className="code-input"
          value={code}
          placeholder="table code"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setCode(event.target.value)}
        />
        <div
          className={ready ? 'home-btn btn-a' : 'home-btn btn-a is-dim'}
          onClick={() => {
            if (!ready) return
            onConnect(code.trim().toLowerCase())
          }}
        >
          Connect
        </div>
        <div className="home-btn btn-b" onClick={onBack}>Back</div>
      </div>
    </div>
  )
}
