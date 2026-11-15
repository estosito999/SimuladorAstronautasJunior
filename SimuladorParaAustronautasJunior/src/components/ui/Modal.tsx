import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose?: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; if (dialog && !dialog.open) dialog.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className={`modal ${className}`} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose?.() }}><div className="modal-top"><span className="eyebrow">LUNAR TRAINING 3D</span>{onClose && <button type="button" className="icon-button" aria-label="Cerrar ventana" onClick={onClose}><X size={20} /></button>}</div>{children}</dialog>
}
