export default function MissionLog({ log, limit = 12 }) {
  const tone = { good: 'text-good', bad: 'text-bad', info: 'text-white/70' };
  return (
    <ol className="space-y-1 text-xs" aria-label="Mission log">
      {log.slice(0, limit).map((l, i) => (
        <li key={i} className="flex gap-2 leading-snug"><span className="shrink-0 font-display text-[10px] text-accent">C{String(l.cycle).padStart(2, '0')}</span><span className={tone[l.tone] || tone.info}>{l.text}</span></li>
      ))}
      {!log.length && <li className="text-white/50">No entries yet.</li>}
    </ol>
  );
}
