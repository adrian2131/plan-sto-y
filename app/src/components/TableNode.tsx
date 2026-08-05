import type { CSSProperties, DragEvent, MouseEvent } from 'react'
import { GripVertical, Baby, Minus, Trash2, UserPlus, UserMinus, RotateCw } from 'lucide-react'
import type { Guest, Table } from '../types'
import { geomFor, rotateGeom, SEAT, CHILD, HC_BASE } from '../geometry'

interface TableNodeProps {
  table: Table
  guestsByKey: Map<string, Guest>
  seatedCount: number
  editing: boolean
  seatMax: number
  onGripDown: (e: MouseEvent) => void
  onAddSeat: () => void
  onRemoveSeat: () => void
  onRotate: () => void
  onAddHighChair: () => void
  onRemoveHighChair: () => void
  onRemove: () => void
  onStartEdit: () => void
  onRename: (name: string) => void
  onCommitEdit: () => void
  onSeatDragStart: (gid: string, e: DragEvent) => void
  onSeatDrop: (tableId: string, seatIndex: number, e: DragEvent) => void
  onSeatClick: (gid: string) => void
}

const seatBase: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const emptyInner: CSSProperties = {
  ...seatBase,
  background: 'var(--color-bg)',
  border: '1.5px dashed var(--color-divider)',
  color: 'var(--color-neutral-500)',
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
}
const fullInner: CSSProperties = {
  ...seatBase,
  textAlign: 'center',
  padding: 4,
  background: 'var(--color-accent-100)',
  border: '1px solid var(--color-accent-400)',
  color: 'var(--color-accent-900)',
  fontSize: 10.5,
  lineHeight: 1.12,
  cursor: 'grab',
}
const childEmpty: CSSProperties = {
  ...seatBase,
  background: 'var(--color-accent-2-100)',
  border: '1.5px dashed var(--color-accent-2-400)',
  color: 'var(--color-accent-2-700)',
}
const childFull: CSSProperties = {
  ...seatBase,
  textAlign: 'center',
  padding: 3,
  background: 'var(--color-accent-2-100)',
  border: '1px solid var(--color-accent-2-500)',
  color: 'var(--color-accent-2-900)',
  fontSize: 9.5,
  lineHeight: 1.1,
  cursor: 'grab',
}

interface SeatView {
  key: string
  seatIndex: number
  left: number
  top: number
  size: number
  inner: CSSProperties
  label: string
  showBaby: boolean
  showLabel: boolean
  title: string
  guest: Guest | null
}

export default function TableNode({
  table: t,
  guestsByKey,
  seatedCount,
  editing,
  seatMax,
  onGripDown,
  onAddSeat,
  onRemoveSeat,
  onRotate,
  onAddHighChair,
  onRemoveHighChair,
  onRemove,
  onStartEdit,
  onRename,
  onCommitEdit,
  onSeatDragStart,
  onSeatDrop,
  onSeatClick,
}: TableNodeProps) {
  const geom = rotateGeom(geomFor(t.shape, t.seats), t.rotation ?? 0)
  const hc = t.highChairs || 0

  const mkSeat = (i: number, left: number, top: number, size: number, isChild: boolean): SeatView => {
    const g = guestsByKey.get(t.id + ':' + i) ?? null
    return {
      key: t.id + ':' + i,
      seatIndex: i,
      left,
      top,
      size,
      inner: g ? (isChild ? childFull : fullInner) : isChild ? childEmpty : emptyInner,
      label: g ? g.name : isChild ? '' : String(i + 1),
      showBaby: isChild && !g,
      showLabel: !!g || !isChild,
      title: g
        ? g.name + ' — kliknij, aby zwolnić'
        : isChild
          ? 'Krzesełko dziecięce (puste) — przeciągnij dziecko tutaj'
          : 'Wolne miejsce ' + (i + 1),
      guest: g,
    }
  }

  const seatViews: SeatView[] = geom.seats.map((s, i) => mkSeat(i, s.left, s.top, SEAT, false))

  let areaH = geom.height
  if (hc > 0) {
    const rowTop = geom.height + 12
    const totalW = hc * 58
    const startX = geom.width / 2 - totalW / 2 + (58 - CHILD) / 2
    for (let j = 0; j < hc; j++) {
      seatViews.push(mkSeat(HC_BASE + j, startX + j * 58, rowTop, CHILD, true))
    }
    areaH = rowTop + CHILD + 6
  }

  return (
    <div style={{ position: 'absolute', left: t.x, top: t.y }}>
      {/* Pasek stołu */}
      <div
        className="table-head"
        onMouseDown={onGripDown}
        style={{
          width: geom.width,
          minWidth: 148,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          marginBottom: 4,
          cursor: 'move',
        }}
      >
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'move', color: 'var(--color-neutral-600)' }}
        >
          <GripVertical size={14} />
          przeciągnij
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button
            className="btn btn-icon-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onRemoveSeat}
            disabled={t.seats <= 1}
            title="Usuń krzesło (ostatnie miejsce)"
            style={{ color: 'var(--color-neutral-600)' }}
          >
            <UserMinus size={15} strokeWidth={1.6} />
          </button>
          <button
            className="btn btn-icon-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onAddSeat}
            disabled={t.seats >= seatMax}
            title={t.seats >= seatMax ? `Maksymalnie ${seatMax} miejsc` : 'Dodaj krzesło'}
            style={{ color: 'var(--color-accent-700)' }}
          >
            <UserPlus size={15} strokeWidth={1.6} />
          </button>
          <span aria-hidden style={{ width: 1, height: 16, background: 'var(--color-divider)', margin: '0 2px' }} />
          <button
            className="btn btn-icon-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onAddHighChair}
            title="Dodaj krzesełko dziecięce"
            style={{ color: 'var(--color-accent-2-700)' }}
          >
            <Baby size={15} strokeWidth={1.6} />
          </button>
          {hc > 0 && (
            <button
              className="btn btn-icon-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onRemoveHighChair}
              title="Usuń ostatnie krzesełko dziecięce"
              style={{ color: 'var(--color-neutral-600)' }}
            >
              <Minus size={15} strokeWidth={1.8} />
            </button>
          )}
          {t.shape === 'rect' && (
            <button
              className="btn btn-icon-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onRotate}
              title="Obróć stół o 90°"
              style={{ color: 'var(--color-neutral-600)' }}
            >
              <RotateCw size={15} strokeWidth={1.6} />
            </button>
          )}
          <button
            className="btn btn-icon-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            title="Usuń stół"
            style={{ color: 'var(--color-neutral-600)' }}
          >
            <Trash2 size={15} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Obszar: blat + krzesła */}
      <div style={{ position: 'relative', width: geom.width, height: areaH }}>
        <div
          style={{
            position: 'absolute',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            boxShadow: 'var(--shadow-sm)',
            left: geom.table.left,
            top: geom.table.top,
            width: geom.table.width,
            height: geom.table.height,
            borderRadius: geom.table.borderRadius,
          }}
        >
          {editing ? (
            <input
              className="input"
              autoFocus
              value={t.name}
              onChange={(e) => onRename(e.target.value)}
              onBlur={onCommitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitEdit()
              }}
              style={{ width: '80%', textAlign: 'center', fontFamily: 'var(--font-heading)' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 6, cursor: 'text' }} onClick={onStartEdit} title="Kliknij, aby zmienić nazwę">
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16, lineHeight: 1.1 }}>{t.name}</div>
              <div className="text-muted" style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                {seatedCount} / {t.seats} miejsc
              </div>
            </div>
          )}
        </div>

        {seatViews.map((seat) => (
          <div
            key={seat.key}
            draggable={!!seat.guest}
            onDragStart={seat.guest ? (e) => onSeatDragStart(seat.guest!.id, e) : undefined}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onSeatDrop(t.id, seat.seatIndex, e)}
            onClick={seat.guest ? () => onSeatClick(seat.guest!.id) : undefined}
            title={seat.title}
            style={{ position: 'absolute', left: seat.left, top: seat.top, width: seat.size, height: seat.size }}
          >
            <div style={seat.inner}>
              {seat.showBaby && <Baby size={20} strokeWidth={1.6} />}
              {seat.showLabel && <span className="seat-name">{seat.label}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
