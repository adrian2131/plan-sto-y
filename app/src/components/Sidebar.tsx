import type { DragEvent } from 'react'
import { GripVertical } from 'lucide-react'
import type { Guest } from '../types'

interface SidebarProps {
  guestText: string
  setGuestText: (v: string) => void
  addGuests: () => void
  unassigned: Guest[]
  total: number
  onGuestDragStart: (gid: string, e: DragEvent) => void
  onListDrop: (e: DragEvent) => void
}

export default function Sidebar({
  guestText,
  setGuestText,
  addGuests,
  unassigned,
  total,
  onGuestDragStart,
  onListDrop,
}: SidebarProps) {
  const noUnassigned = total > 0 && unassigned.length === 0

  return (
    <aside
      style={{
        flex: 'none',
        width: 308,
        borderRight: '1px solid var(--color-divider)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        overflow: 'auto',
      }}
    >
      <div>
        <h4 style={{ marginBottom: 'var(--space-2)' }}>Lista gości</h4>
        <div className="field">
          <label>Wklej imiona — jedno w wierszu (lub po przecinku)</label>
          <textarea
            className="input"
            placeholder={'Anna Kowalska\nJan Nowak\nMaria Wiśniewska…'}
            value={guestText}
            onChange={(e) => setGuestText(e.target.value)}
            style={{ minHeight: 120 }}
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={addGuests}>
          Dodaj gości
        </button>
      </div>

      <hr className="hr" style={{ margin: 'var(--space-2) 0' }} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>Nieusadzeni</h4>
        <span className="tag tag-neutral">{unassigned.length}</span>
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
        Przeciągnij gościa na krzesło. Aby zwolnić miejsce, upuść tutaj lub kliknij zajęte krzesło.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onListDrop}
        style={{
          flex: 1,
          minHeight: 120,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-2)',
          border: '1.5px dashed var(--color-divider)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {unassigned.map((g) => (
          <div
            key={g.id}
            className="chip"
            draggable
            onDragStart={(e) => onGuestDragStart(g.id, e)}
            title={g.name}
            style={{
              cursor: 'grab',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 11px',
              fontSize: 13,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              borderRadius: 999,
            }}
          >
            <GripVertical size={12} style={{ opacity: 0.5 }} />
            <span>{g.name}</span>
          </div>
        ))}
        {noUnassigned && (
          <span className="text-muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
            Wszyscy goście usadzeni.
          </span>
        )}
      </div>
    </aside>
  )
}
