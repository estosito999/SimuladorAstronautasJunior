import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { getDest } from '../data/destinations.js';
import { sfx } from '../audio/audio.js';
import { Btn } from '../components/UI.jsx';

export default function Launch() {
  const { go, mission, launch } = useMission();
  const d = getDest(mission?.destination);
  const lines = [`MISSION ${mission?.missionId}`, `DESTINATION: ${d.name}`, `CREW: ${mission?.crewSize}`, `MISSION DURATION: ${mission?.duration} CYCLES`, 'LANDING SEQUENCE INITIATED...'];
  const [n, setN] = useState(1);
  const finish = () => { launch(); go('control'); };
  useEffect(() => {
    const t = setInterval(() => setN((x) => { if (x < lines.length) { sfx.select(); return x + 1; } return x; }), 850);
    const end = setTimeout(finish, 5300);
    return () => { clearInterval(t); clearTimeout(end); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const mars = mission?.destination === 'mars';
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-space-950">
      <motion.div className={`absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full ${mars ? 'bg-gradient-to-br from-[#e48f55] to-[#69301d]' : 'bg-gradient-to-br from-[#d5d8df] to-[#4c4f59]'}`}
        initial={{ width: 60, height: 60, y: -40, opacity: 0.6 }} animate={{ width: 1800, height: 1800, y: 420, opacity: 1 }} transition={{ duration: 5.2, ease: 'easeIn' }} style={{ marginLeft: 0 }} />
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative z-10 p-6 text-center">
        {lines.map((l, i) => i < n && (<motion.p key={l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`font-display font-black uppercase tracking-[0.2em] drop-shadow-lg ${i === lines.length - 1 ? 'mt-4 text-sm text-warn sm:text-lg' : 'text-xl sm:text-3xl'}`}>{l}</motion.p>))}
      </div>
      <div className="absolute bottom-6 right-4 z-10"><Btn small variant="ghost" onClick={finish}>Skip ▸</Btn></div>
    </div>
  );
}
