'use client';
import { useEffect, useRef, useState } from 'react';
import { gameApi, type Adventure } from '../services/game';

type Props = Readonly<{ adventure: Adventure; characterId: string; level: number; busy: boolean; act: (action: () => Promise<void>) => Promise<void>; refresh: () => Promise<void>; notify: (message: string) => void }>;
export function EncounterPanel({ adventure, characterId, level, busy, act, refresh, notify }: Props) {
  const missions = adventure.encounters ?? [];
  const [selected, setSelected] = useState(missions[0]?.id);
  const [choiceId, setChoiceId] = useState('');
  const [result, setResult] = useState('');
  const [wait, setWait] = useState(adventure.encounterWaitSeconds ?? 0);
  const pending = useRef<{ key: string; id: string } | null>(null);
  useEffect(() => {
    const until = (adventure.encounterReceivedAt ?? Date.now()) + (adventure.encounterWaitSeconds ?? 0) * 1000;
    const tick = () => setWait(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [adventure]);
  const mission = missions.find(m => m.id === selected);
  const choice = mission?.approaches.find(c => c.id === choiceId);
  function play() {
    if (!mission || !choice) return;
    const key = `${mission.id}:${choice.id}`;
    if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
    const requestId = pending.current.id;
    void act(async () => {
      const response = await gameApi.encounter(characterId, mission.id, choice.id, requestId);
      setResult(response.message); notify(response.message);
      await refresh(); pending.current = null;
    });
  }
  return <div className="encounters">
    <h3>Ocorrências da profissão</h3><p>Escolha seu foco: aprender com a situação ou buscar maior recompensa em gold. Você pode voltar depois e experimentar outra abordagem, mesmo após concluir a campanha.</p>
    <p className="muted">Cada tentativa custa 1 stamina e abre um intervalo de 60 segundos entre ocorrências. Falhar não rende gold ou EXP. Suas missões idle continuam normalmente.</p>
    <div className="encounter-list">{missions.map(m => <button type="button" key={m.id} disabled={busy} aria-pressed={selected === m.id} onClick={() => { setSelected(m.id); setChoiceId(''); setResult(''); }}><strong>{m.name}</strong><span>Nível {m.level}{level < m.level ? ' · Bloqueada' : ' · Disponível'}</span></button>)}</div>
    {mission && <section className="encounter-detail" aria-label={mission.name}><h3>{mission.name}</h3><p>{mission.description}</p><ol>{mission.stages.map(s => <li key={s}>{s}</li>)}</ol>
      {level < mission.level && <p>Alcance o nível {mission.level} para participar.</p>}
      <fieldset disabled={busy || level < mission.level}><legend>Como você quer agir?</legend><div className="chapter-grid">{mission.approaches.map(c => <label className={'approach ' + (choiceId === c.id ? 'selected' : '')} key={c.id}><input type="radio" name="approach" value={c.id} checked={choiceId === c.id} onChange={() => { setChoiceId(c.id); setResult(''); }} /><strong>{c.name}</strong><span>{c.description}</span><span>Poder necessário: {c.power} · Seu poder: {adventure.power}</span><span>Se concluir: +{c.gold} gold · +{c.exp} EXP</span></label>)}</div></fieldset>
      {choice && adventure.power < choice.power && <p className="danger" role="status">Seu poder é insuficiente: esta abordagem vai falhar e consumir 1 stamina. Equipe-se ou escolha outra abordagem.</p>}
      {wait > 0 && <p role="status">Próxima ocorrência em {wait}s.</p>}
      {adventure.stamina < 1 && <p>Sem stamina. Ela se recupera com o tempo; continue nas missões idle.</p>}
      <button className="primary" type="button" disabled={busy || !choice || level < mission.level || wait > 0 || adventure.stamina < 1} onClick={play}>Confirmar abordagem (1 stamina)</button>
      {result && <output className="message success encounter-result">{result}</output>}
    </section>}
  </div>;
}
