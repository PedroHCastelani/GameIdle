'use client';
import { useEffect, useState } from 'react';

export function MissionClock({ since, serverTime, duration }: Readonly<{ since: string; serverTime: string; duration: number }>) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const received = Date.now();
    const server = Date.parse(serverTime), start = Date.parse(since);
    const tick = () => setSeconds(Math.max(0, Math.floor(((Number.isFinite(server - start) ? server - start : 0) + Date.now() - received) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [since, serverTime]);
  const cycles = Math.floor(seconds / duration);
  return <div className="cycle-status"><progress aria-label="Progresso do ciclo" max={duration} value={seconds % duration} /><p>{cycles > 0 ? 'Progresso pronto para coletar.' : `Próxima coleta em ${duration - seconds % duration}s.`} <span className="muted">O servidor confirma os valores na coleta.</span></p></div>;
}
