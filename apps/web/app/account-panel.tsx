'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { accountApi } from '../services/game';

function field(event: FormEvent<HTMLFormElement>, name: string) {
  const value = new FormData(event.currentTarget).get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function AccountPanel({ signedIn }: Readonly<{ signedIn: boolean }>) {
  const [account, setAccount] = useState<{ email: string; emailVerified: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (signedIn) accountApi.status().then(value => { if (active) setAccount(value); })
      .catch(() => { if (active) setError('Não foi possível consultar sua conta.'); });
    return () => { active = false; };
  }, [signedIn]);
  async function run(action: () => Promise<{ message: string }>) {
    setBusy(true); setError(''); setMessage('');
    try { setMessage((await action()).message); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const email = field(event, 'email');
    void run(() => accountApi.requestReset(email));
  }
  function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const code = field(event, 'code');
    const value = new FormData(event.currentTarget).get('password');
    const password = typeof value === 'string' ? value : '';
    void run(() => accountApi.reset(code, password));
  }
  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const code = field(event, 'code');
    void run(async () => {
      const result = await accountApi.confirm(code);
      setAccount(await accountApi.status());
      return result;
    });
  }
  function verification() {
    if (!signedIn) return null;
    if (!account) return <p>Carregando dados da conta…</p>;
    if (account.emailVerified) return <p>E-mail confirmado: {account.email}</p>;
    return <>
      <p>E-mail ainda não confirmado: {account.email}</p>
      <button type="button" disabled={busy} onClick={() => void run(accountApi.requestVerification)}>Solicitar código de confirmação</button>
      <form onSubmit={confirm}><label>Código de confirmação<input name="code" required minLength={64} maxLength={64} autoComplete="one-time-code" disabled={busy} /></label><button type="submit" disabled={busy}>Confirmar e-mail</button></form>
    </>;
  }
  return <section className="panel" aria-label="Segurança da conta">
    <h2>Segurança da conta</h2>
    <p className="muted">Prévia local: mensagens são salvas na pasta .local-mail do projeto. Abra a mensagem destinada ao seu e-mail de teste e copie o código. Nenhum e-mail é enviado pela internet.</p>
    {error && <p role="alert">{error}</p>}
    {message && <output>{message}</output>}
    {verification()}
    <details><summary>Esqueci minha senha</summary>
      <form onSubmit={requestReset}><label>E-mail para recuperação<input name="email" type="email" maxLength={254} required autoComplete="username" disabled={busy} /></label><button type="submit" disabled={busy}>Solicitar recuperação</button></form>
      <form onSubmit={reset}><label>Código de recuperação<input name="code" required minLength={64} maxLength={64} autoComplete="one-time-code" disabled={busy} /></label><label>Nova senha<input name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required disabled={busy} /></label><button type="submit" disabled={busy}>Redefinir senha</button></form>
      <p className="muted">O código expira em 30 minutos e só pode ser usado uma vez. A redefinição encerra as sessões existentes. Aguarde um minuto entre solicitações.</p>
    </details>
  </section>;
}
