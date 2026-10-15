'use client';
import { useState } from 'react';
import { gameApi, type Adventure } from '../services/game';
import { EncounterPanel } from './encounter-panel';

type Props = Readonly<{ adventure: Adventure; characterId: string; level: number; gold: string; busy: boolean; act: (action: () => Promise<void>) => Promise<void>; refresh: () => Promise<void>; notify: (message: string) => void }>;
const tabs = ['Jornada', 'Ocorrências', 'Inventário', 'Loja', 'Diário'] as const;
function nextGoal(adventure: Adventure, level: number) {
  if (adventure.completed) return 'Você concluiu os três capítulos. Experimente as decisões da sua profissão na aba Ocorrências ou continue evoluindo nas missões.';
  const chapter = adventure.chapters[adventure.chapter];
  if (level < chapter.level) return `Faça missões e colete EXP até o nível ${chapter.level}. Depois enfrente ${chapter.name}.`;
  if (adventure.power < chapter.power) return `Você precisa de ${chapter.power} de poder. Compre ou equipe itens no inventário; níveis e prática também aumentam seu poder.`;
  return `Você está pronto para ${chapter.name}. Prepare a operação abaixo.`;
}

export function CampaignPanel(props: Props) {
  const { adventure: a, level, gold, busy } = props;
  const [tab, setTab] = useState<typeof tabs[number]>('Jornada');
  const [prepared, setPrepared] = useState<number | null>(null);
  function perform(action: () => Promise<{ message: string }>) {
    void props.act(async () => { const result = await action(); await props.refresh(); props.notify(result.message); });
  }
  function journey() {
    return <>
      <p className="eyebrow">SEU PRÓXIMO OBJETIVO</p><p>{nextGoal(a, level)}</p>
      {a.completed && <div className="victory"><h2>Campanha concluída!</h2><p>{a.ending}</p><p>Três operações. Uma história nas ruas.</p></div>}
      <div className="chapter-grid">{a.chapters.map(c => <article className={'chapter ' + (c.chapter <= a.chapter ? 'complete' : '')} key={c.chapter}>
        <span className="badge">CAPÍTULO {c.chapter} · {c.chapter <= a.chapter ? 'CONCLUÍDO' : 'OPERAÇÃO'}</span><h3>{c.name}</h3>
        <p>Nível {c.level} · Poder recomendado {c.power}</p><p className="muted">Recompensa única: {c.gold} gold · {c.exp} EXP{c.reward ? ' + equipamento' : ' + conclusão da campanha'}</p>
        <button type="button" disabled={busy || c.chapter !== a.chapter + 1 || level < c.level} onClick={() => setPrepared(c.chapter)}>Preparar {c.name}</button>
        {prepared === c.chapter && c.chapter === a.chapter + 1 && <div className="operation-preview"><ol>{c.stages.map(stage => <li key={stage}>{stage}</li>)}</ol><p>Seu poder: <strong>{a.power}</strong> / {c.power}. Custo: 1 stamina.</p>
          {a.power < c.power && <p className="danger">Seu poder está abaixo do necessário. A tentativa vai falhar; melhore o equipamento primeiro.</p>}
          <button className="primary" type="button" disabled={busy || a.stamina < 1} onClick={() => { const requestId = crypto.randomUUID(); perform(() => gameApi.challenge(props.characterId, c.chapter, requestId)); }}>Iniciar operação (1 stamina)</button>
        </div>}
      </article>)}</div>
    </>;
  }
  function inventory() {
    return <><p>Um item por espaço. Equipar substitui o anterior. Suprimentos aparecem a cada cinco ciclos das missões locais.</p>
      {a.inventory.length === 0 && <p>Seu inventário está vazio. Compre uma ferramenta na Loja ou complete cinco ciclos.</p>}
      <div className="chapter-grid">{a.inventory.map(item => <article className="chapter" key={item.id}><span className="badge">{item.equipped ? 'EQUIPADO' : 'NA MOCHILA'}</span><h3>{item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}</h3><p>{item.description}</p><p className="muted">{item.slot ? `Poder +${item.power} · Nível ${item.level}` : 'Material para venda'}</p>
        <div className="item-actions">{item.slot && <button type="button" disabled={busy || level < item.level} onClick={() => perform(() => gameApi.item(props.characterId, item.id, item.equipped ? 'unequip' : 'equip'))}>{item.equipped ? 'Remover' : 'Equipar'} {item.name}</button>}
          <button type="button" disabled={busy || item.equipped} onClick={() => perform(() => gameApi.item(props.characterId, item.id, 'sell'))}>Vender {item.name} (+{item.sell * item.quantity} gold)</button></div>
      </article>)}</div></>;
  }
  function shop() {
    return <><p>Loja do bairro · saldo: {gold} gold. Não há dinheiro real.</p><div className="chapter-grid">{a.shop.map(item => <article className="chapter" key={item.id}><h3>{item.name}</h3><p>{item.description}</p><p>{item.price} gold · Poder +{item.power}</p><button type="button" disabled={busy || BigInt(gold) < BigInt(item.price)} onClick={() => perform(() => gameApi.buy(props.characterId, item.id))}>Comprar {item.name}</button></article>)}</div></>;
  }
  function diary() {
    return <>{a.history.length === 0 && <p>Nenhuma operação realizada ainda. Prepare seu primeiro capítulo na Jornada.</p>}{a.history.map(entry => <article className="chapter" key={entry.id}><h3>{entry.name}</h3>{entry.decision && <p><strong>{entry.decision.name}</strong> · {entry.decision.ending}</p>}<p>{entry.outcome === 'BOSS_DEFEATED' ? 'Operação concluída' : 'Operação interrompida'} · +{entry.gold} gold · +{entry.exp} EXP</p><ol>{entry.stages.map(s => <li key={s.number}>Etapa {s.number}: {s.outcome === 'SUCCESS' ? 'concluída' : 'poder insuficiente'}</li>)}</ol></article>)}</>;
  }
  const views = { Jornada: journey, Inventário: inventory, Loja: shop, Diário: diary };
  return <section className="panel campaign" aria-label="Campanha local"><div className="campaign-heading"><div><p className="eyebrow">HISTÓRIAS DO BAIRRO</p><h2>Sua jornada · {a.chapter}/3 capítulos</h2></div><div className="stats"><div><span>Poder</span><strong>{a.power}</strong></div><div><span>{a.skillName}</span><strong>{a.skillLevel}</strong></div><div><span>Stamina</span><strong>{a.stamina}/10</strong></div></div></div>
    <p className="muted">Prática cresce a cada coleta local. Stamina regenera 1 ponto a cada 2h24; missões idle são gratuitas.</p>
    <nav className="tabs" aria-label="Áreas do jogo">{tabs.map(name => <button type="button" key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</nav>
    {tab === 'Ocorrências' ? <EncounterPanel {...props} /> : views[tab]()}
  </section>;
}
