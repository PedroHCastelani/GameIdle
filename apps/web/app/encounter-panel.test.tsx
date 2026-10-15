import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EncounterPanel } from './encounter-panel';
import { gameApi, type Adventure } from '../services/game';
vi.mock('../services/game', () => ({ gameApi: { encounter: vi.fn() } }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); });
const mission = { id: 'doctor_square', name: 'Mutirão na praça', description: 'Equipe de apoio.', level: 2, stages: ['Organizar', 'Atender', 'Concluir'], approaches: [
  { id: 'prevention', name: 'Conduzir a prevenção', description: 'Mais experiência.', power: 22, gold: 40, exp: 140, ending: 'Famílias orientadas.' },
  { id: 'mobile', name: 'Assumir a unidade móvel', description: 'Mais gold.', power: 32, gold: 120, exp: 60, ending: 'Plantão concluído.' },
] };
const adventure: Adventure = { chapter: 3, completed: true, ending: 'Fim', power: 25, skillName: 'Medicina', skillLevel: 1, cycles: 5, stamina: 10, staminaNextAt: null, nextLevelExperience: '400', chapters: [], shop: [], inventory: [], history: [], encounters: [mission, { ...mission, id: 'later', name: 'Bairro alagado', level: 4 }], encounterWaitSeconds: 0 };
const props = { characterId: 'char', level: 2, busy: false, act: async (action: () => Promise<void>) => { try { await action(); } catch { /* Parent displays request errors. */ } }, refresh: vi.fn(async () => {}), notify: vi.fn() };
const confirm = () => screen.getByRole('button', { name: 'Confirmar abordagem (1 stamina)' }) as HTMLButtonElement;

it('requires an explicit choice, shows consequences and submits only server identifiers', async () => {
  vi.mocked(gameApi.encounter).mockResolvedValue({ message: 'Famílias orientadas.' });
  render(<EncounterPanel {...props} adventure={adventure} />);
  expect(confirm().disabled).toBe(true);
  expect(screen.getByText('Se concluir: +40 gold · +140 EXP')).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Conduzir a prevenção/ }));
  expect(confirm().disabled).toBe(false);
  await act(async () => { fireEvent.click(confirm()); });
  expect(gameApi.encounter).toHaveBeenCalledWith('char', 'doctor_square', 'prevention', expect.stringMatching(/^[0-9a-f-]{36}$/));
  expect(screen.getByText('Famílias orientadas.')).toBeTruthy();
  expect(props.refresh).toHaveBeenCalled();
});
it('warns about insufficient power and clears a choice when changing missions', () => {
  render(<EncounterPanel {...props} adventure={adventure} />);
  fireEvent.click(screen.getByRole('radio', { name: /Assumir a unidade móvel/ }));
  expect(screen.getByText(/esta abordagem vai falhar/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Bairro alagado/ }));
  expect(screen.getByText('Alcance o nível 4 para participar.')).toBeTruthy();
  expect(confirm().disabled).toBe(true);
  expect((screen.getByRole('radio', { name: /Conduzir a prevenção/ }) as HTMLInputElement).checked).toBe(false);
});
it('honors cooldown, stamina and busy state and enables retry after the countdown', () => {
  vi.useFakeTimers();
  const timed = { ...adventure, encounterWaitSeconds: 2, encounterReceivedAt: Date.now() };
  const { rerender } = render(<EncounterPanel {...props} adventure={timed} />);
  fireEvent.click(screen.getByRole('radio', { name: /Conduzir a prevenção/ }));
  expect(confirm().disabled).toBe(true); expect(screen.getByText('Próxima ocorrência em 2s.')).toBeTruthy();
  act(() => { vi.advanceTimersByTime(2000); });
  expect(confirm().disabled).toBe(false);
  rerender(<EncounterPanel {...props} adventure={{ ...timed }} />);
  expect(confirm().disabled).toBe(false);
  rerender(<EncounterPanel {...props} adventure={{ ...adventure, stamina: 0 }} />);
  expect(confirm().disabled).toBe(true); expect(screen.getByText(/Sem stamina/)).toBeTruthy();
  rerender(<EncounterPanel {...props} busy adventure={adventure} />);
  expect(confirm().disabled).toBe(true);
});
it('reuses request identity after a lost response and uses a new one for another decision', async () => {
  vi.mocked(gameApi.encounter).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ message: 'Registrado' });
  render(<EncounterPanel {...props} adventure={adventure} />);
  fireEvent.click(screen.getByRole('radio', { name: /Conduzir a prevenção/ }));
  await act(async () => { fireEvent.click(confirm()); });
  const first = vi.mocked(gameApi.encounter).mock.calls[0][3];
  await act(async () => { fireEvent.click(confirm()); });
  expect(vi.mocked(gameApi.encounter).mock.calls[1][3]).toBe(first);
  fireEvent.click(screen.getByRole('radio', { name: /Assumir a unidade móvel/ }));
  await act(async () => { fireEvent.click(confirm()); });
  expect(vi.mocked(gameApi.encounter).mock.calls[2][3]).not.toBe(first);
});
it('renders an empty list for an older server response', () => {
  render(<EncounterPanel {...props} adventure={{ ...adventure, encounters: undefined, encounterWaitSeconds: undefined }} />);
  expect(screen.getByText('Ocorrências da profissão')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Confirmar abordagem/ })).toBeNull();
});

it('explains earned power, permanent progress and prerequisite locks before spending stamina', () => {
  const followup = { ...mission, id: 'followup', name: 'O retorno das famílias', lockReason: 'Conclua o mutirão com prevenção.', approaches: mission.approaches.map(c => ({...c, specialization:'Cuidado comunitário', bonus:3, effectivePower:28, completed:false, unlocks:['Programa do bairro'], lockReason:'Requer 2 pontos; você tem 1.'})) };
  const state = { ...adventure, specializations:[{name:'Cuidado comunitário',points:1,bonus:3}], encounters:[followup] };
  const {rerender} = render(<EncounterPanel {...props} adventure={state} />);
  expect(screen.getByText('1 pontos · +3 poder nas abordagens dessa área')).toBeTruthy();
  expect(screen.getByText('Conclua o mutirão com prevenção.')).toBeTruthy();
  expect(confirm().disabled).toBe(true);
  const unlocked = {...followup,lockReason:null,approaches:followup.approaches.map(c=>({...c,lockReason:null,completed:true}))};
  rerender(<EncounterPanel {...props} adventure={{...state,encounters:[unlocked]}} />);
  fireEvent.click(screen.getByRole('radio',{name:/Conduzir a prevenção/}));
  expect(confirm().disabled).toBe(false);
  expect(screen.queryByText(/esta abordagem vai falhar/)).toBeNull();
  expect(screen.getAllByText(/Experiência já adquirida/)).toHaveLength(2);
  expect(gameApi.encounter).not.toHaveBeenCalled();
});
