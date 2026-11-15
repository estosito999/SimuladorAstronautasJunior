import { useMission } from '../hooks/useMission.js';
import { Btn, Tag } from '../components/UI.jsx';
import { SOURCES, TOPICS, sourceById } from '../data/nasaSources.js';
import { moonData } from '../data/moonData.js';
import { marsData } from '../data/marsData.js';

const LV = { LOW: 'good', MEDIUM: 'warn', HIGH: 'warn', CRITICAL: 'bad' };

export function EnvTable({ d }) {
  return (
    <div className="rounded-xl border border-white/10 bg-space-800/70 p-3">
      <h3 className="font-display text-sm font-bold uppercase tracking-widest">{d.icon} {d.name}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-1 text-xs font-bold uppercase tracking-wider text-white/70">
        {Object.entries(d.levels).map(([k, v]) => (<div key={k} className="contents"><dt>{k}</dt><dd className="text-right"><Tag tone={LV[v]}>{v}</Tag></dd></div>))}
      </dl>
    </div>
  );
}

export default function NASAData() {
  const { go } = useMission();
  return (
    <div className="hud-grid h-full overflow-y-auto bg-space-950">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Research</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-widest">NASA Data & Science</h1>
        <p className="mt-2 max-w-2xl text-white/80">ZERO-G is a game, not a precise simulator. Real NASA science inspired the rules below. <Tag tone="fact">NASA FACT</Tag> is paraphrased from NASA. <Tag tone="sim">GAME SIMULATION VALUE</Tag> is how we turn it into gameplay. Everything runs offline on local data.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><EnvTable d={moonData} /><EnvTable d={marsData} /></div>
        <p className="mt-2 text-xs text-white/50">Levels (LOW / MEDIUM / HIGH / CRITICAL) are qualitative game values, not NASA measurements.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {TOPICS.map((t) => { const s = sourceById(t.source); return (
            <article key={t.id} className="rounded-2xl border border-white/10 bg-space-900/85 p-4">
              <h2 className="font-display text-base font-bold uppercase tracking-widest"><span aria-hidden>{t.icon}</span> {t.title}</h2>
              <div className="mt-3"><Tag tone="fact">NASA FACT</Tag><p className="mt-1.5 leading-snug">{t.fact}</p></div>
              <div className="mt-3"><Tag tone="sim">How ZERO-G uses it</Tag><p className="mt-1.5 leading-snug text-white/80">{t.sim}</p></div>
              {s && <a className="mt-3 inline-block text-[11px] font-bold uppercase tracking-widest text-sky-300 underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">Source: {s.title} ↗</a>}
            </article>); })}
        </div>
        <h2 className="mt-8 font-display text-sm font-bold uppercase tracking-widest text-white/70">Sources</h2>
        <ul className="mt-2 space-y-1.5">{SOURCES.map((s) => (<li key={s.id}><a className="inline-flex min-h-[44px] items-center text-sky-300 underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">NASA — {s.title} ↗</a></li>))}</ul>
        <div className="mt-6"><Btn variant="ghost" onClick={() => go('home')}>← Main menu</Btn></div>
      </div>
    </div>
  );
}
