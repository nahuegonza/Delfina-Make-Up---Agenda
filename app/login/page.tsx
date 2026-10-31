'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError('El mail o la contraseña no coinciden.');
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <p className="eyebrow">— Agenda</p>
        <h1 style={{ fontSize: 40, marginBottom: 6 }}>
          Delfina <em>Acuña</em>
        </h1>
        <p className="muted small" style={{ marginTop: 0, marginBottom: 20 }}>Ingresá para ver tus turnos.</p>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Mail</label>
            <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pw">Contraseña</label>
            <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="alert alert-err">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  );
}
