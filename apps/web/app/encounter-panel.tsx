'use client';
import { useEffect, useRef, useState } from 'react';
import { gameApi, type Adventure, type Encounter } from '../services/game';

function Consequences({ choice }: Readonly<{ choice: Encounter['approaches'][number] }>) {
  if (!choice.specialization) return null;
  return <><span className="badge">{choice.specialization} · bônus atual +{choice.bonus}</span>
    <span>{choice.completed ? 'Experiência já adquirida: repetir rende gold e EXP, sem novo ponto.' : `Primeiro sucesso: +1 em ${choice.specialization} e +3 poder nessa área.`}</span>
    {choice.unlocks?.map(name => <span key={name}>Abre caminho para: {name}.</span>)}
    {!!choice.storyBonus && <span>Apoio do personagem: +{choice.storyBonus} poder, já incluído no seu poder.</span>}
    {choice.lockReason && <span className="danger">{choice.lockReason}</span>}</>;
}

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
    <h3>Ocorrências da profissão</h3><p>Suas decisões constroem especializações e abrem novas missões. Cada abordagem diferente concluída dá um ponto uma única vez. Você pode desenvolver os dois caminhos, mesmo após concluir a campanha.</p>
    <div className="chapter-grid">{adventure.specializations?.map(path => <article className="chapter" key={path.name}><h4>{path.name}</h4><p>{path.points} pontos · +{path.bonus} poder nas abordagens dessa área</p></article>)}</div>
    <p className="muted">Cada tentativa custa 1 stamina e abre um intervalo de 60 segundos entre ocorrências. Falhar não rende gold ou EXP. Suas missões idle continuam normalmente.</p>
    <div className="encounter-list">{missions.map(m => <button type="button" key={m.id} disabled={busy} aria-pressed={selected === m.id} onClick={() => { setSelected(m.id); setChoiceId(''); setResult(''); }}><strong>{m.name}</strong><span>Nível {m.level}{level < m.level || m.lockReason ? ' · Bloqueada' : ' · Disponível'}</span></button>)}</div>
    {mission && <section className="encounter-detail" aria-label={mission.name}><h3>{mission.name}</h3><p>{mission.description}</p><ol>{mission.stages.map(s => <li key={s}>{s}</li>)}</ol>
      {mission.character && <article className="chapter" aria-label="Personagem da história"><h4>{mission.character.name} · {mission.character.role}</h4><span className="badge">{mission.character.relationship}</span><p>“{mission.character.dialogue}”</p><p>{mission.event}</p><p className="muted">O último compromisso concluído com sucesso define a relação atual. Você pode mudá-lo voltando ao encontro; o diário preserva os acontecimentos anteriores.</p></article>}
      {level < mission.level && <p>Alcance o nível {mission.level} para participar.</p>}
      {mission.lockReason && <p className="danger">{mission.lockReason}</p>}
      <fieldset disabled={busy || level < mission.level || !!mission.lockReason}><legend>Como você quer agir?</legend><div className="chapter-grid">{mission.approaches.map(c => <label className={'approach ' + (choiceId === c.id ? 'selected' : '')} key={c.id}><input type="radio" name="approach" value={c.id} disabled={!!c.lockReason} checked={choiceId === c.id} onChange={() => { setChoiceId(c.id); setResult(''); }} /><strong>{c.name}</strong><span>{c.description}</span><span>Poder necessário: {c.power} · Seu poder: {c.effectivePower ?? adventure.power}</span><span>Se concluir: +{c.gold} gold · +{c.exp} EXP</span><Consequences choice={c} /></label>)}</div></fieldset>
      {choice && (choice.effectivePower ?? adventure.power) < choice.power && <output className="danger encounter-status">Seu poder é insuficiente: esta abordagem vai falhar e consumir 1 stamina. Equipe-se ou escolha outra abordagem.</output>}
      {wait > 0 && <output className="encounter-status">Próxima ocorrência em {wait}s.</output>}
      {adventure.stamina < 1 && <p>Sem stamina. Ela se recupera com o tempo; continue nas missões idle.</p>}
      <button className="primary" type="button" disabled={busy || !choice || !!mission.lockReason || !!choice.lockReason || level < mission.level || wait > 0 || adventure.stamina < 1} onClick={play}>Confirmar abordagem (1 stamina)</button>
      {result && <output className="message success encounter-result">{result}</output>}
    </section>}
  </div>;
}
