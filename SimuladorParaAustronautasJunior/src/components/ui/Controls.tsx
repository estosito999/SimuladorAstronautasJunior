import type { LucideIcon } from 'lucide-react'

export function Meter({ label, value, color = 'orange', detail }: { label: string; value: number; color?: string; detail?: string }) {
  return <div className="meter"><div className="meter-heading"><span>{label}</span><strong>{Math.round(value)}<small> %</small></strong></div><div className="meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><div className={`meter-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>{detail && <p>{detail}</p>}</div>
}

export function Toggle({ label, checked, onChange, disabled = false, detail }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean; detail?: string }) {
  return <div className="toggle-row"><div><span>{label}</span>{detail && <small>{detail}</small>}</div><button type="button" className={`toggle ${checked ? 'on' : ''}`} role="switch" aria-label={label} aria-checked={checked} disabled={disabled} onClick={onChange}><span /></button></div>
}

export function IconButton({ icon: Icon, label, onClick, active = false }: { icon: LucideIcon; label: string; onClick: () => void; active?: boolean }) {
  return <button type="button" className={`icon-button ${active ? 'active' : ''}`} title={label} aria-label={label} onClick={onClick}><Icon size={18} strokeWidth={1.8} /></button>
}

export function LunaAvatar({ large = false }: { large?: boolean }) {
  return <div className={`luna-avatar ${large ? 'large' : ''}`} aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M12 35C12 18 20 10 32 10S52 18 52 35V47H12V35Z" fill="#F6F9FF"/><rect x="17" y="22" width="30" height="22" rx="10" fill="#263954"/><path d="M20 29C24 24 32 24 38 25" stroke="#89E3EF" strokeWidth="3" strokeLinecap="round"/><circle cx="26" cy="33" r="2.5" fill="#8DE3E5"/><circle cx="38" cy="33" r="2.5" fill="#8DE3E5"/><path d="M29 39C31 41 33 41 35 39" stroke="#8DE3E5" strokeWidth="2" strokeLinecap="round"/><rect x="8" y="29" width="7" height="15" rx="3" fill="#FFB18B"/><rect x="49" y="29" width="7" height="15" rx="3" fill="#FFB18B"/><path d="M19 48H45L49 56H15L19 48Z" fill="#FFAA7C"/><circle cx="32" cy="51" r="2" fill="#FFF"/></svg></div>
}
