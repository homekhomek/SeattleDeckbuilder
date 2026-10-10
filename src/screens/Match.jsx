import { useEffect, useRef, useState } from 'react'
import { createGuest, createHost, createHotseat } from '../net/session.js'
import { playQueue } from '../visual/queue.js'
import Board from './Board.jsx'

export default function Match({ spec, onLeave }) {
  const [snap, setSnap] = useState(null)
  const [banner, setBanner] = useState('')
  const [busy, setBusy] = useState(false)
  const [pulse, setPulse] = useState(null)
  const [motion, setMotion] = useState(null)
  const [copied, setCopied] = useState(false)
  const chain = useRef(Promise.resolve())
  const sessionRef = useRef(null)

  useEffect(() => {
    const session = spec.kind === 'host'
      ? createHost()
      : spec.kind === 'guest'
        ? createGuest(spec.code)
        : createHotseat()
    sessionRef.current = session
    const unsub = session.subscribe((next) => {
      setSnap(next)
      if (next.error) {
        setBanner(next.error)
        setBusy(false)
        return
      }
      if (!next.events?.length) return
      setBusy(true)
      chain.current = chain.current.then(async () => {
        await playQueue(next.events, (event, line) => {
          setBanner(line)
          setPulse(event.instanceId || null)
          setMotion(event)
        })
        setBusy(false)
        setPulse(null)
        setMotion(null)
      })
    })
    return () => {
      unsub()
      session.close()
      sessionRef.current = null
    }
  }, [spec])

  async function copyCode() {
    if (!snap?.peerId) return
    try {
      await navigator.clipboard.writeText(snap.peerId)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (!snap) return <div className="stage" />

  if (snap.status !== 'playing' || !snap.view) {
    return (
      <div className="stage">
        <div className="fit">
          <div className="home-kicker">{snap.mode === 'guest' ? 'Joining' : 'Hosting'}</div>
          <h1 className="home-title lobby-title">
            {snap.status === 'error' || snap.status === 'closed' ? 'Table closed' : 'Waiting'}
          </h1>
          {snap.peerId ? <div className="code-text">{snap.peerId}</div> : null}
          <p className="home-tag lobby-tag">
            {snap.error
              || (snap.peerId ? 'On the other phone, tap Join and enter this code.' : 'Opening a table...')}
          </p>
          {snap.peerId ? (
            <div className="home-btn btn-a" onClick={copyCode}>{copied ? 'Copied' : 'Copy code'}</div>
          ) : null}
          <div className="home-btn btn-b" onClick={onLeave}>Back</div>
        </div>
      </div>
    )
  }

  return (
    <div className="stage">
      <Board
        snap={snap}
        banner={banner}
        busy={busy}
        pulse={pulse}
        motion={motion}
        onLeave={onLeave}
        onCommand={(command) => sessionRef.current?.send(command)}
      />
    </div>
  )
}
