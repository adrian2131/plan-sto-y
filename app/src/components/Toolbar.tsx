import { Circle, RectangleHorizontal, Baby, Download, Save, FolderOpen } from 'lucide-react'

interface ToolbarProps {
  roundSeats: number
  rectSeats: number
  roundMax: number
  rectMax: number
  setRoundSeats: (v: string) => void
  setRectSeats: (v: string) => void
  addRound: () => void
  addRect: () => void
  snapToGrid: boolean
  setSnapToGrid: (v: boolean) => void
  exportPdf: () => void
  canExport: boolean
  exporting: boolean
  savePlan: () => void
  canSave: boolean
  loadPlan: () => void
  clearAll: () => void
}

export default function Toolbar({
  roundSeats,
  rectSeats,
  roundMax,
  rectMax,
  setRoundSeats,
  setRectSeats,
  addRound,
  addRect,
  snapToGrid,
  setSnapToGrid,
  exportPdf,
  canExport,
  exporting,
  savePlan,
  canSave,
  loadPlan,
  clearAll,
}: ToolbarProps) {
  return (
    <div
      className="toolbar"
      style={{
        flex: 'none',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', margin: 0 }}>
        <div>
          <label>Miejsca</label>
          <input
            className="input"
            type="number"
            min={1}
            max={roundMax}
            value={roundSeats}
            onChange={(e) => setRoundSeats(e.target.value)}
            style={{ width: 70 }}
          />
        </div>
        <button className="btn btn-secondary" onClick={addRound}>
          <Circle size={16} strokeWidth={1.6} />
          Stół okrągły
        </button>
      </div>

      <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', margin: 0 }}>
        <div>
          <label>Miejsca</label>
          <input
            className="input"
            type="number"
            min={1}
            max={rectMax}
            value={rectSeats}
            onChange={(e) => setRectSeats(e.target.value)}
            style={{ width: 70 }}
          />
        </div>
        <button className="btn btn-secondary" onClick={addRect}>
          <RectangleHorizontal size={16} strokeWidth={1.6} />
          Stół podłużny
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-accent-2-700)' }}>
        <Baby size={16} strokeWidth={1.6} />
        krzesełka dziecięce dodajesz przyciskiem na stole
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <label className="radio" style={{ fontSize: 13 }}>
          <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
          <span className="dot" style={{ borderRadius: 'var(--radius-sm)' }} />
          Przyciągaj do siatki
        </label>
        <button
          className="btn btn-secondary"
          onClick={loadPlan}
          title="Wczytaj plan z pliku (.json)"
        >
          <FolderOpen size={16} strokeWidth={1.6} />
          Wczytaj
        </button>
        <button
          className="btn btn-secondary"
          onClick={savePlan}
          disabled={!canSave}
          title="Zapisz plan do pliku (.json) — kopia poza przeglądarką"
        >
          <Save size={16} strokeWidth={1.6} />
          Zapisz
        </button>
        <button
          className="btn btn-secondary"
          onClick={exportPdf}
          disabled={!canExport}
          title={'Eksportuj plan sali do PDF — w oknie drukowania wybierz „Zapisz jako PDF”'}
        >
          <Download size={16} strokeWidth={1.6} />
          {exporting ? 'Przygotowuję…' : 'Eksportuj PDF'}
        </button>
        <button className="btn btn-ghost" onClick={clearAll}>
          Wyczyść plan
        </button>
      </div>
    </div>
  )
}
