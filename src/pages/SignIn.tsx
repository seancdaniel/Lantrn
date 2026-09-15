import { useState, type FormEvent } from 'react';
import { useAuth } from '@/state/auth';
import { useDocumentMeta } from '@/hooks';
import { Brandmark, Wordmark } from '@/components/ui/Brand';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Primitives';

type Mode = 'signin' | 'signup';

export function SignIn() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useDocumentMeta(
    'Sign in · Lantrn',
    'Sign in to Lantrn and pick your adventure back up where you left it.',
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name.trim());
        setSent(true);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="authpage">
      <div className="authcard">
        <div className="authcard__brand">
          <Brandmark size={40} />
          <Wordmark />
        </div>

        {sent ? (
          <>
            <h1 className="authcard__title">Check your inbox.</h1>
            <p className="authcard__sub">
              We sent a confirmation link to <strong>{email}</strong>. Open it and your journey
              starts at mile zero.
            </p>
            <Button variant="ghost" block onClick={() => { setSent(false); setMode('signin'); }}>
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <h1 className="authcard__title">
              {mode === 'signin' ? 'Pick up where you left off.' : 'Start at mile zero.'}
            </h1>
            <p className="authcard__sub">
              {mode === 'signin'
                ? 'Your miles, your route, your encounters.'
                : 'Twenty encounters across fourteen hundred and fifty miles. It starts with one walk.'}
            </p>

            <form className="stack" onSubmit={submit} noValidate>
              {mode === 'signup' ? (
                <Field label="Your name" htmlFor="auth-name">
                  <Input
                    id="auth-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
              ) : null}

              <Field label="Email" htmlFor="auth-email">
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field
                label="Password"
                htmlFor="auth-password"
                error={error ?? undefined}
                hint={mode === 'signup' ? 'At least six characters.' : undefined}
              >
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                block
                disabled={busy || !email || !password}
              >
                {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="authcard__switch">
              {mode === 'signin' ? 'No account yet?' : 'Already walking?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
