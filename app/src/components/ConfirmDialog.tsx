import { useEffect } from 'react'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Anuluj',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, onConfirm])

  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <p className="dialog-body" style={{ margin: 0 }}>
          {body}
        </p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
