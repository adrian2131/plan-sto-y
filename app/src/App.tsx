import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import TableNode from './components/TableNode'
import ConfirmDialog from './components/ConfirmDialog'
import { HC_BASE } from './geometry'
import type { Guest, PersistedState, Table, TableShape } from './types'

const STORAGE_KEY = 'wedding-seating-v1'
const GRID = 26

const uid = () => Math.random().toString(36).slice(2, 9)
const clampInt = (v: string | number, max: number) => {
  let n = parseInt(String(v), 10)
  if (isNaN(n)) n = 1
  return Math.max(1, Math.min(max, n))
}
// Maks. liczba miejsc: okrągły 12, podłużny 80
const ROUND_MAX = 12
const RECT_MAX = 80

function loadInitial(): PersistedState {
  const fallback: PersistedState = { tables: [], guests: [], guestText: '', roundSeats: 8, rectSeats: 12 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const s = JSON.parse(raw)
    if (s && Array.isArray(s.tables)) {
      return {
        tables: s.tables ?? [],
        guests: s.guests ?? [],
        guestText: s.guestText ?? '',
        roundSeats: s.roundSeats ?? 8,
        rectSeats: s.rectSeats ?? 12,
      }
    }
  } catch {
    /* ignore corrupt state */
  }
  return fallback
}

export default function App() {
  const initial = useMemo(loadInitial, [])
  const [tables, setTables] = useState<Table[]>(initial.tables)
  const [guests, setGuests] = useState<Guest[]>(initial.guests)
  const [guestText, setGuestText] = useState<string>(initial.guestText)
  const [roundSeats, setRoundSeats] = useState<number>(initial.roundSeats)
  const [rectSeats, setRectSeats] = useState<number>(initial.rectSeats)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false)
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false)

  // Efemeryczne (poza stanem renderu)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const planRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const dragGid = useRef<string | null>(null)
  const snapRef = useRef(snapToGrid)
  snapRef.current = snapToGrid
  const tablesRef = useRef(tables)
  tablesRef.current = tables

  // Persistencja — zapis przy każdej zmianie zapisywanego slice'u.
  useEffect(() => {
    try {
      const slice: PersistedState = { tables, guests, guestText, roundSeats, rectSeats }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slice))
    } catch {
      /* ignore */
    }
  }, [tables, guests, guestText, roundSeats, rectSeats])

  // Przeciąganie stołu po kanwie — globalne mousemove/mouseup.
  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      const drag = dragRef.current
      const canvas = canvasRef.current
      if (!drag || !canvas) return
      const r = canvas.getBoundingClientRect()
      let x = e.clientX - r.left + canvas.scrollLeft - drag.dx
      let y = e.clientY - r.top + canvas.scrollTop - drag.dy
      if (snapRef.current) {
        x = Math.round(x / GRID) * GRID
        y = Math.round(y / GRID) * GRID
      }
      x = Math.max(0, x)
      y = Math.max(0, y)
      setTables((ts) => ts.map((t) => (t.id === drag.id ? { ...t, x, y } : t)))
    }
    const onUp = () => {
      dragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startDrag = useCallback(
    (id: string, e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const r = canvas.getBoundingClientRect()
      const t = tables.find((x) => x.id === id)
      if (!t) return
      dragRef.current = {
        id,
        dx: e.clientX - r.left + canvas.scrollLeft - t.x,
        dy: e.clientY - r.top + canvas.scrollTop - t.y,
      }
      e.preventDefault()
    },
    [tables],
  )

  // ── Goście ──────────────────────────────────────────────────────────
  const addGuests = useCallback(() => {
    const names = guestText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!names.length) return
    const add: Guest[] = names.map((n) => ({ id: uid(), name: n, tableId: null, seatIndex: null }))
    setGuests((gs) => [...gs, ...add])
    setGuestText('')
  }, [guestText])

  const assign = useCallback((gid: string, tid: string, si: number) => {
    setGuests((prev) => {
      const next = prev.map((g) => ({ ...g }))
      const g = next.find((x) => x.id === gid)
      if (!g) return prev
      const occ = next.find((x) => x.tableId === tid && x.seatIndex === si && x.id !== gid)
      const oT = g.tableId
      const oS = g.seatIndex
      g.tableId = tid
      g.seatIndex = si
      if (occ) {
        occ.tableId = oT
        occ.seatIndex = oT != null ? oS : null
      }
      return next
    })
  }, [])

  const unassign = useCallback((gid: string) => {
    setGuests((gs) => gs.map((g) => (g.id === gid ? { ...g, tableId: null, seatIndex: null } : g)))
  }, [])

  const removeGuest = useCallback((gid: string) => {
    setGuests((gs) => gs.filter((g) => g.id !== gid))
  }, [])

  // ── Stoły ───────────────────────────────────────────────────────────
  const addTable = useCallback(
    (shape: TableShape) => {
      const seats = shape === 'round' ? roundSeats : rectSeats
      setTables((ts) => {
        const n = ts.length
        return [
          ...ts,
          {
            id: uid(),
            name: 'Stół ' + (n + 1),
            shape,
            seats: Math.max(1, seats),
            highChairs: 0,
            x: 40 + (n % 5) * 90,
            y: 40 + (n % 4) * 70,
          },
        ]
      })
    },
    [roundSeats, rectSeats],
  )

  const removeTable = useCallback((id: string) => {
    setTables((ts) => ts.filter((t) => t.id !== id))
    setGuests((gs) => gs.map((g) => (g.tableId === id ? { ...g, tableId: null, seatIndex: null } : g)))
  }, [])

  const rename = useCallback((id: string, name: string) => {
    setTables((ts) => ts.map((t) => (t.id === id ? { ...t, name } : t)))
  }, [])

  const addHighChair = useCallback((id: string) => {
    setTables((ts) => ts.map((t) => (t.id === id ? { ...t, highChairs: (t.highChairs || 0) + 1 } : t)))
  }, [])

  const removeHighChair = useCallback((id: string) => {
    const t = tablesRef.current.find((x) => x.id === id)
    const hc = (t && t.highChairs) || 0
    if (hc <= 0) return
    const si = HC_BASE + (hc - 1)
    setTables((ts) => ts.map((x) => (x.id === id ? { ...x, highChairs: hc - 1 } : x)))
    setGuests((gs) => gs.map((g) => (g.tableId === id && g.seatIndex === si ? { ...g, tableId: null, seatIndex: null } : g)))
  }, [])

  const doClearAll = useCallback(() => {
    setTables([])
    setGuests([])
    setGuestText('')
    setEditingId(null)
    setShowClearConfirm(false)
  }, [])

  // ── Drag & drop gości ───────────────────────────────────────────────
  const onGuestDragStart = useCallback((gid: string, e: DragEvent) => {
    dragGid.current = gid
    e.dataTransfer.setData('text/plain', gid)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onSeatDrop = useCallback(
    (tableId: string, seatIndex: number, e: DragEvent) => {
      e.preventDefault()
      const id = e.dataTransfer.getData('text/plain') || dragGid.current
      if (id) assign(id, tableId, seatIndex)
      dragGid.current = null
    },
    [assign],
  )

  const onListDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const id = e.dataTransfer.getData('text/plain') || dragGid.current
      if (id) unassign(id)
      dragGid.current = null
    },
    [unassign],
  )

  // ── Wyliczane przy renderze ─────────────────────────────────────────
  const guestsByKey = useMemo(() => {
    const m = new Map<string, Guest>()
    guests.forEach((g) => {
      if (g.tableId != null) m.set(g.tableId + ':' + g.seatIndex, g)
    })
    return m
  }, [guests])

  const unassigned = useMemo(() => guests.filter((g) => g.tableId == null), [guests])
  const seated = guests.length - unassigned.length

  const seatedByTable = useMemo(() => {
    const m = new Map<string, number>()
    guests.forEach((g) => {
      if (g.tableId != null) m.set(g.tableId, (m.get(g.tableId) || 0) + 1)
    })
    return m
  }, [guests])

  // ── Eksport planu do PDF (wizualny zrzut kanwy) ─────────────────────
  const [exporting, setExporting] = useState(false)
  // Eksport przez natywny druk przeglądarki („Zapisz jako PDF"). Renderuje
  // prawdziwymi fontami i z pełną wiernością CSS — bez bibliotek i rasteryzacji.
  // Przed drukiem liczymy obrys treści, żeby zmieścić plan na stronie A4 poziomej
  // i przyciąć puste marginesy kanwy.
  const exportPdf = useCallback(() => {
    const node = planRef.current
    if (!node || tablesRef.current.length === 0) return
    setExporting(true)

    // Obrys wszystkich stołów (razem z krzesłami i paskiem nad blatem).
    const base = node.getBoundingClientRect()
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    node.querySelectorAll<HTMLElement>('[data-table-node]').forEach((el) => {
      const r = el.getBoundingClientRect()
      minX = Math.min(minX, r.left - base.left)
      minY = Math.min(minY, r.top - base.top)
      maxX = Math.max(maxX, r.right - base.left)
      maxY = Math.max(maxY, r.bottom - base.top)
    })
    if (!isFinite(minX)) {
      setExporting(false)
      return
    }

    const pad = 24
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    const contentW = maxX - minX + pad
    const contentH = maxY - minY + pad

    // A4 poziomo przy 96dpi ≈ 1122×794px; margines 10mm ≈ 38px, nagłówek ~64px.
    const pageW = 1122 - 76
    const pageH = 794 - 76 - 64
    const scale = Math.min(pageW / contentW, pageH / contentH, 1)

    const root = document.documentElement
    root.style.setProperty('--print-x', `${-minX}px`)
    root.style.setProperty('--print-y', `${-minY}px`)
    root.style.setProperty('--print-scale', String(scale))
    root.style.setProperty('--print-w', `${contentW}px`)
    root.style.setProperty('--print-h', `${contentH}px`)
    document.body.classList.add('printing')

    const cleanup = () => {
      document.body.classList.remove('printing')
      setExporting(false)
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    // Pozwól przeglądarce zastosować style wydruku przed otwarciem okna.
    // setTimeout, nie requestAnimationFrame — rAF nie odpala się w karcie w tle.
    window.setTimeout(() => {
      try {
        window.print()
      } finally {
        // Fallback: część przeglądarek nie emituje afterprint.
        window.setTimeout(cleanup, 500)
      }
    }, 50)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Nagłówek widoczny wyłącznie na wydruku / w PDF */}
      <div className="print-header">
        <h2 style={{ margin: 0, fontSize: 22 }}>Plan Sali Weselnej</h2>
        <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          Usadzeni: {seated} / {guests.length} · Nieusadzeni: {unassigned.length}
        </div>
      </div>

      {/* Górny pasek */}
      <div className="nav" style={{ flex: 'none' }}>
        <span className="nav-brand">Plan Sali Weselnej</span>
        <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 13 }}>
          <span>
            Usadzeni: <strong style={{ color: 'var(--color-text)' }}>{seated}</strong> / {guests.length}
          </span>
          <span>
            Nieusadzeni: <strong style={{ color: 'var(--color-text)' }}>{unassigned.length}</strong>
          </span>
        </div>
      </div>

      <div className="app-shell" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar
          guestText={guestText}
          setGuestText={setGuestText}
          addGuests={addGuests}
          unassigned={unassigned}
          total={guests.length}
          onGuestDragStart={onGuestDragStart}
          onListDrop={onListDrop}
          onRemoveGuest={removeGuest}
        />

        <section className="plan-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Toolbar
            roundSeats={roundSeats}
            rectSeats={rectSeats}
            roundMax={ROUND_MAX}
            rectMax={RECT_MAX}
            setRoundSeats={(v) => setRoundSeats(clampInt(v, ROUND_MAX))}
            setRectSeats={(v) => setRectSeats(clampInt(v, RECT_MAX))}
            addRound={() => addTable('round')}
            addRect={() => addTable('rect')}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            exportPdf={exportPdf}
            canExport={tables.length > 0 && !exporting}
            exporting={exporting}
            clearAll={() => setShowClearConfirm(true)}
          />

          <div
            ref={canvasRef}
            className="canvas-scroll"
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'auto',
              backgroundColor: 'var(--color-bg)',
              backgroundImage: 'radial-gradient(var(--color-divider) 1px, transparent 1px)',
              backgroundSize: `${GRID}px ${GRID}px`,
            }}
          >
            <div ref={planRef} className="plan-surface" style={{ position: 'relative', minWidth: 1400, minHeight: 1000 }}>
              {tables.length === 0 && (
                <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                  <h3 className="text-muted" style={{ fontWeight: 400 }}>
                    Plan sali jest pusty
                  </h3>
                  <p className="text-muted" style={{ fontSize: 14 }}>
                    Dodaj stół okrągły lub podłużny za pomocą przycisków powyżej, a następnie przeciągaj gości na krzesła.
                  </p>
                </div>
              )}

              {tables.map((t) => (
                <TableNode
                  key={t.id}
                  table={t}
                  guestsByKey={guestsByKey}
                  seatedCount={seatedByTable.get(t.id) || 0}
                  editing={editingId === t.id}
                  onGripDown={(e) => startDrag(t.id, e)}
                  onAddHighChair={() => addHighChair(t.id)}
                  onRemoveHighChair={() => removeHighChair(t.id)}
                  onRemove={() => removeTable(t.id)}
                  onStartEdit={() => setEditingId(t.id)}
                  onRename={(name) => rename(t.id, name)}
                  onCommitEdit={() => setEditingId(null)}
                  onSeatDragStart={onGuestDragStart}
                  onSeatDrop={onSeatDrop}
                  onSeatClick={unassign}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="Wyczyść plan sali"
          body="Czy na pewno chcesz wyczyścić cały plan sali? Usunięte zostaną wszystkie stoły i goście. Tej operacji nie można cofnąć."
          confirmLabel="Wyczyść plan"
          onConfirm={doClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}
