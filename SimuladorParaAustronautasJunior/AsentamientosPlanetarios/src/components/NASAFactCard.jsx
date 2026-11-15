import { Tag } from './UI.jsx';
import { sourceById } from '../data/nasaSources.js';

export default function NASAFactCard({ fact, impact, source }) {
  const src = sourceById(source);
  return (
    <div className="rounded-xl border border-sky-300/30 bg-space-800/80 p-3 text-sm">
      <Tag tone="fact">NASA FACT</Tag>
      <p className="mt-1.5 font-semibold leading-snug">{fact}</p>
      <div className="mt-2"><Tag tone="sim">GAME IMPACT</Tag></div>
      <p className="mt-1.5 leading-snug text-white/80">{impact}</p>
      {src && <a href={src.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-bold uppercase tracking-widest text-sky-300 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Source: {src.title} ↗</a>}
    </div>
  );
}
