import { useState } from 'react';
import { useStore } from '@/state/store';
import { useAuth } from '@/state/auth';
import { useTheme } from '@/state/theme';
import { useToast } from '@/state/toast';
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, Field, Input, Pill, SegmentedControl, Switch } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { providers, ProviderUnavailableError } from '@/lib/fitness';
import { formatInt } from '@/lib/format';

export function SettingsPage() {
  const { user, updateUser, resetDemo, activities, isRemote } = useStore();
  const { signOut, isLocal } = useAuth();
  const { theme, setTheme, motion, setMotion } = useTheme();
  const { push } = useToast();

  const [stride, setStride] = useState(String(user.stepsPerMile));
  const [confirmReset, setConfirmReset] = useState(false);

  const applyStride = () => {
    const value = Number(stride);
    if (!Number.isFinite(value) || value < 800 || value > 4000) {
      push({ title: 'That stride is not plausible', body: 'Use a value between 800 and 4,000 steps per mile.', icon: 'alert' });
      setStride(String(user.stepsPerMile));
      return;
    }
    updateUser({ stepsPerMile: value });
    push({ title: 'Stride updated', body: `${activities.length} days of history recalculated.`, icon: 'check' });
  };

  const connect = async (id: string) => {
    const provider = providers.find((p) => p.id === id);
    if (!provider) return;
    try {
      await provider.connect();
      push({ title: `${provider.name} connected`, icon: 'check' });
    } catch (error) {
      push({
        title: error instanceof ProviderUnavailableError ? `${provider.name} is not wired up yet` : 'Could not connect',
        body: provider.note,
        icon: 'alert',
      });
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="You"
        title="Settings"
        description="Appearance, measurement, and the step sources this build can and cannot talk to."
      />

      <section aria-labelledby="appearance-heading">
        <SectionHeader title="Appearance" id="appearance-heading" />
        <Card>
          <div className="stack stack--lg">
            <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
              <div>
                <p className="field__label">Theme</p>
                <p className="field__hint">Dark is a separate palette, not an inversion. The map is worth seeing in it.</p>
              </div>
              <SegmentedControl
                label="Theme"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </div>

            <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
              <div>
                <p className="field__label">Motion</p>
                <p className="field__hint">
                  Turns off counting numbers, progress animation and the drifting markers on the map.
                </p>
              </div>
              <Switch
                id="reduce-motion"
                checked={motion === 'reduced'}
                onChange={(next) => setMotion(next ? 'reduced' : 'system')}
                label="Reduce motion"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="section">
        <SectionHeader title="Measurement" />
        <Card>
          <div className="grid grid--2" style={{ gap: 'var(--s-6)' }}>
            <Field
              label="Steps per mile"
              htmlFor="stride"
              hint="Distance is always derived from steps. Changing this recalculates your whole history, not just future days."
            >
              <div className="row" style={{ gap: 'var(--s-2)' }}>
                <Input
                  id="stride"
                  className="input--numeric"
                  inputMode="decimal"
                  value={stride}
                  onChange={(e) => setStride(e.target.value)}
                  onBlur={applyStride}
                />
                <Button variant="quiet" onClick={applyStride}>
                  Apply
                </Button>
              </div>
            </Field>

            <div>
              <p className="field__label">What that works out to</p>
              <p className="stat__figure" style={{ marginTop: 'var(--s-2)' }}>
                <span className="stat__value stat__value--sm">
                  {(5280 / Number(stride || user.stepsPerMile)).toFixed(2)}
                </span>
                <span className="stat__unit">ft per step</span>
              </p>
              <p className="field__hint" style={{ marginTop: 6 }}>
                {formatInt(Number(stride || user.stepsPerMile))} steps per mile is the common rule of thumb.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="section">
        <SectionHeader title="Step sources" />
        <div className="stack">
          {providers.map((provider) => {
            const status = provider.status();
            return (
              <Card key={provider.id}>
                <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row row--wrap" style={{ gap: 'var(--s-2) var(--s-3)' }}>
                      <h3 className="charcard__name">{provider.name}</h3>
                      {status === 'connected' ? (
                        <Pill tone="complete">Connected</Pill>
                      ) : (
                        <Pill tone="locked">Not available</Pill>
                      )}
                    </div>
                    <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 8, maxWidth: '64ch' }}>
                      {provider.note}
                    </p>
                    <div className="row row--wrap" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-3)' }}>
                      {(['steps', 'distance', 'activeMinutes', 'calories', 'backgroundSync'] as const)
                        .filter((key) => provider.capabilities[key])
                        .map((key) => (
                          <Pill plain key={key}>
                            {key === 'activeMinutes' ? 'active time' : key === 'backgroundSync' ? 'background sync' : key}
                          </Pill>
                        ))}
                    </div>
                  </div>

                  <Button
                    variant={status === 'connected' ? 'quiet' : 'default'}
                    disabled={status === 'connected'}
                    onClick={() => connect(provider.id)}
                  >
                    {status === 'connected' ? 'In use' : 'Connect'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card sunken style={{ marginTop: 'var(--s-4)' }}>
          <p className="row" style={{ gap: 'var(--s-3)', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--ember)', flex: 'none', marginTop: 2 }}>
              <Icon name="alert" size={17} />
            </span>
            <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              None of these integrations are faked. Each one is registered behind the same provider interface as
              manual entry, and refuses to connect until it has a real implementation — a native shell for the
              health platforms, and a server-side OAuth exchange for the rest.
            </span>
          </p>
        </Card>
      </section>

      <section className="section">
        <SectionHeader title="Account" />
        <Card>
          <div className="stack stack--lg">
            <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
              <div>
                <p className="field__label">Signed in as</p>
                <p className="field__hint" style={{ maxWidth: '60ch' }}>
                  {isLocal
                    ? 'No account. This browser holds a seeded demo journey, and nothing leaves it.'
                    : `@${user.handle} — your walking record syncs to every device you sign in on.`}
                </p>
              </div>
              {isLocal ? (
                <Pill tone="locked">Local only</Pill>
              ) : (
                <Button variant="quiet" icon="logout" onClick={() => void signOut()}>
                  Sign out
                </Button>
              )}
            </div>

            {isLocal || !isRemote ? (
              <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
                <div>
                  <p className="field__label">Reset this account</p>
                  <p className="field__hint" style={{ maxWidth: '60ch' }}>
                    Restores the seeded demo history and clears anything you have logged in this
                    browser. There is no undo.
                  </p>
                </div>
                <Button variant="danger" icon="trash" onClick={() => setConfirmReset(true)}>
                  Reset demo data
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the demo account?"
        description="Every walk, encounter and edit you have made in this browser goes back to the seeded state."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Keep my data
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                push({ title: 'Demo data restored', icon: 'check' });
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="muted" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
          This only affects this browser. Nothing has ever been sent to a server — the whole account lives in local
          storage.
        </p>
      </Modal>
    </div>
  );
}
