import { useLayoutEffect, useRef, useState } from 'react'

const ghostW = 78
const ghostH = 106

export function useBoardDrag(boardRef) {
  const start = useRef(null)
  const suppress = useRef(false)
  const ghostRef = useRef(null)
  const pointRef = useRef(null)
  const [drag, setDrag] = useState(null)

  function point(clientX, clientY) {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const scale = rect.width / 390 || 1
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }

  function hit(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY)
    return el?.closest?.('[data-drop]')?.dataset.drop || null
  }

  function place() {
    const ghost = ghostRef.current
    const at = pointRef.current
    if (!ghost || !at) return
    ghost.style.left = `${at.x - ghostW / 2}px`
    ghost.style.top = `${at.y - ghostH / 2}px`
  }

  useLayoutEffect(() => {
    place()
  })

  function bind(payload) {
    if (!payload) return {}
    return {
      onPointerDown(event) {
        if (event.button != null && event.button !== 0) return
        start.current = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
          payload,
          armed: false,
        }
      },
      onPointerMove(event) {
        const origin = start.current
        if (!origin || event.pointerId !== origin.id) return
        const dx = event.clientX - origin.x
        const dy = event.clientY - origin.y
        if (!origin.armed) {
          if (Math.hypot(dx, dy) < 14) return
          if (Math.abs(dx) > Math.abs(dy)) {
            origin.scroll = true
            return
          }
          origin.armed = true
          event.currentTarget.setPointerCapture?.(event.pointerId)
          pointRef.current = point(event.clientX, event.clientY)
          setDrag({
            action: origin.payload.action,
            def: origin.payload.def,
            key: origin.payload.key,
            over: hit(event.clientX, event.clientY),
          })
          return
        }
        if (origin.scroll) return
        pointRef.current = point(event.clientX, event.clientY)
        place()
        const over = hit(event.clientX, event.clientY)
        setDrag((current) => {
          if (!current || current.over === over) return current
          return { ...current, over }
        })
      },
      onPointerUp(event) {
        const origin = start.current
        start.current = null
        pointRef.current = null
        if (!origin) return
        if (origin.scroll) {
          suppress.current = true
          return
        }
        if (!origin.armed) {
          setDrag(null)
          return
        }
        suppress.current = true
        const over = hit(event.clientX, event.clientY)
        setDrag(null)
        if (over === origin.payload.action) origin.payload.run()
      },
      onPointerCancel() {
        start.current = null
        pointRef.current = null
        setDrag(null)
      },
      onClick() {
        if (suppress.current) {
          suppress.current = false
          return
        }
        if (payload.dragOnly) return
        payload.run()
      },
    }
  }

  return { drag, ghostRef, bind }
}
