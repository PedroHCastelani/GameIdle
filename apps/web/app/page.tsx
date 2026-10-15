'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { gameApi, restoreSession, useSession, type GameState, type Profession } from '../services/game';
import { AccountPanel } from './account-panel';
import { CampaignPanel } from './campaign-panel';
import { MissionClock } from './mission-clock';

function formText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
}
function missionTitle(character: NonNullable<GameState['character']>, name?: string) {
  if (character.isPrisoned) return 'Personagem detido';
  if (character.isOnMission) return name ?? 'Missão em andamento';
  return 'Pronto para começar';
}
function claimNotice(result: { cycles: number; gold: string; exp: string; capped: boolean }) {
  if (!result.cycles) return 'Nenhum ciclo completo ainda. Seu tempo parcial foi preservado.';
  return '+' + result.gold + ' gold · +' + result.exp + ' EXP · ' + result.cycles + ' ciclos.' + (result.capped ? ' Limite offline aplicado.' : '');
}
const professions: { value: Profession; title: string; description: string }[] = [
  { value: 'POLICE', title: 'Policial', description: 'Proteja as ruas. Comece sua carreira patrulhando a cidade.' },
  { value: 'THIEF', title: 'Ladrão', description: 'Encontre oportunidades. Construa sua reputação no submundo.' },
  { value: 'DOCTOR', title: 'Médico', description: 'Cuide da cidade. Inicie sua jornada no plantão clínico.' },
];
export default function Home() {
  const token = useSession(s => s.token);
  const [state, setState] = useState<GameState | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profession, setProfession] = useState<Profession>('POLICE');

  async function load(collect = false) {
    let next = await gameApi.state();
    if (collect && next.character?.isOnMission && !next.character.isPrisoned) {
      const result = await gameApi.claim(next.character.id);
      if (result.cycles) setNotice('Progresso recuperado: +' + result.gold + ' gold e +' + result.exp + ' EXP.' + (result.capped ? ' Limite offline aplicado.' : ''));
      next = await gameApi.state();
    }
    setState(next);
  }
  useEffect(() => {
    let active = true;
    restoreSession().then(async restored => { if (restored && active) await load(true); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Falha ao recuperar a sessão.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function act(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    void act(async () => { setState(null); await gameApi.enter(mode, formText(data, 'email'), formText(data, 'password')); await load(true); });
  }
  function createCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    void act(async () => { await gameApi.create(formText(data, 'name'), profession); await load(); });
  }
  const character = state?.character;
  const currentMission = state?.missions.find(m => m.id === character?.missionId);
  function renderJourney() {
    if (!token) return <section className="panel auth-panel" aria-label="Acesso">
        <div className="tabs"><button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => setMode('register')}>Criar conta de teste</button><button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => setMode('login')}>Entrar</button></div>
        <h2>{mode === 'register' ? 'Comece sua jornada' : 'Bem-vindo de volta'}</h2>
        <form onSubmit={enter}><label>E-mail de teste<input name="email" type="email" autoComplete="username" placeholder="jogador@example.test" maxLength={254} required disabled={busy} /></label><label>Senha<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={10} maxLength={128} required disabled={busy} /></label><small>Mínimo de 10 caracteres.</small><button type="submit" className="primary" disabled={busy}>{mode === 'register' ? 'Criar minha conta' : 'Entrar na cidade'}</button></form>
      </section>;
    if (!state) return <section className="panel"><p>Carregue sua jornada para continuar.</p><button type="button" disabled={busy} onClick={() => void act(() => load(true))}>Tentar novamente</button><button type="button" disabled={busy} onClick={() => void act(async () => { await gameApi.logout(); setState(null); })}>Sair</button></section>;
    if (!character) return <section className="panel">
        <h2>Escolha seu caminho</h2><p>Esta prévia permite um personagem por conta. A profissão define suas missões.</p>
        <form onSubmit={createCharacter}><fieldset disabled={busy}><legend>Profissão</legend><div className="profession-grid">{professions.map(p => <label className={'profession ' + (profession === p.value ? 'selected' : '')} key={p.value}><input type="radio" name="profession" value={p.value} checked={profession === p.value} onChange={() => setProfession(p.value)} /><strong>{p.title}</strong><span>{p.description}</span></label>)}</div></fieldset><label>Nome do personagem<input name="name" minLength={3} maxLength={24} required disabled={busy} placeholder="Como a cidade vai conhecer você?" /></label><button type="submit" className="primary" disabled={busy}>Criar personagem</button></form>
        <button type="button" className="quiet" disabled={busy} onClick={() => void act(async () => { await gameApi.logout(); setState(null); })}>Sair da conta</button>
      </section>;
    return <>
        {state.adventure && <CampaignPanel adventure={state.adventure} characterId={character.id} level={character.level} gold={character.gold} busy={busy} act={act} refresh={() => load()} notify={setNotice} />}
        <section className="panel character-panel"><div><p className="eyebrow">{professions.find(p => p.value === character.profession)?.title}</p><h2>{character.name}</h2></div><div className="stats"><div><span>Nível</span><strong>{character.level}</strong></div><div><span>Gold</span><strong>{character.gold}</strong></div><div><span>EXP total</span><strong>{character.experience}</strong>{state.adventure && <small>Próximo nível: {state.adventure.nextLevelExperience}</small>}</div></div><button type="button" className="quiet" disabled={busy} onClick={() => void act(async () => { await gameApi.logout(); setState(null); })}>Sair</button></section>
        <section className="panel active-mission"><p className="eyebrow">SUA ATIVIDADE</p><h2>{missionTitle(character, currentMission?.name)}</h2><p>{character.isOnMission ? 'Seu personagem continua trabalhando enquanto você está fora. Ciclos incompletos ficam para a próxima coleta.' : 'Escolha uma missão abaixo para iniciar seu progresso.'}</p>{character.isOnMission && currentMission && <MissionClock since={character.lastCollectedAt} serverTime={state.serverTime} duration={currentMission.durationBase} />}<p className="muted">Até 12 horas de progresso offline na conta gratuita. Sem custo de stamina.</p><button type="button" className="primary" disabled={busy || !character.isOnMission || character.isPrisoned} onClick={() => void act(async () => { const result = await gameApi.claim(character.id); await load(); setNotice(claimNotice(result)); })}>Coletar progresso</button></section>
        <section aria-labelledby="missions-heading"><h2 id="missions-heading">Missões disponíveis</h2><div className="mission-grid">{state.missions.map(mission => <article className="panel mission" key={mission.id}><span className="badge">IDLE · {mission.durationBase} s / ciclo</span><h3>{mission.name}</h3><p>{mission.description}</p><p className="muted">Por ciclo: {mission.expBase} EXP · {Math.floor((mission.goldMin + mission.goldMax) / 2)} gold</p><button type="button" disabled={busy || character.isPrisoned || character.missionId === mission.id} onClick={() => void act(async () => { await gameApi.start(character.id, mission.id); await load(); setNotice('Missão iniciada. Você pode sair e voltar mais tarde.'); })}>{character.missionId === mission.id ? 'Em andamento' : 'Iniciar missão'}</button></article>)}</div>{state.lockedMissions?.map(m => <p className="locked-mission" key={m.id}>🔒 {m.name} · desbloqueia no nível {m.minLevel}</p>)}{state.missions.length === 0 && <p>Nenhuma missão disponível. Verifique os dados iniciais do ambiente.</p>}</section>
      </>;
  }
  return (
    <main className="shell">
      <header className="topbar"><a className="brand" href="/">THE LIFE<span>URBAN IDLE RPG</span></a><span className="badge">PRÉVIA LOCAL</span></header>
      <div className="intro"><p className="eyebrow">UMA CIDADE. TRÊS CAMINHOS.</p><h1>{character ? "A cidade espera por você." : <>Sua próxima história<br />começa nas ruas.</>}</h1><p>Escolha uma profissão. Faça missões, equipe-se e conclua três operações para conquistar seu lugar na cidade.</p></div>
      <aside className="prototype-note">Ambiente de teste: use um e-mail fictício e uma senha exclusiva para esta prévia. Sem CPF, pagamentos ou cadastro público.</aside>
      {error && <div className="message error" role="alert">{error}</div>}
      {notice && <output className="message success">{notice}</output>}
      {busy && <output className="loading">Processando…</output>}
      {renderJourney()}
      <AccountPanel signedIn={Boolean(token)} />
      <footer>The Life · Protótipo em desenvolvimento. Progresso persistido neste ambiente local.</footer>
    </main>
  );
}
