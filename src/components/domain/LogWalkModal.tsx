import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, SegmentedControl } from '@/components/ui/Primitives';
import { useStore, useJourney } from '@/state/store';
import { useToast } from '@/state/toast';
import { formatMiles, milesToSteps } from '@/lib/format';

type Unit = 'steps' | 'miles';
type Mode = 'add' | 'set';

/**
 * Manual entry is the only source implemented today, so it is treated as a
 * first-class input rather than a stopgap: pick a unit, pick a day, done.
 */
export function LogWalkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logActivity, user, today, activities } = useStore();
  const { leg } = useJourney();
  const { push } = useToast();

  const [unit, setUnit] = useState<Unit>('steps');
  const [mode, setMode] = useState<Mode>('add');
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUnit('steps');
    setMode('add');
    setDate(today);
    setAmount('');
    setMinutes('');
    setError(null);
  }, [open, today]);

  const parsed = Number(amount.replace(/,/g, ''));
  const valid = amount.trim() !== '' && Number.isFinite(parsed) && parsed > 0;
  const steps = valid ? (unit === 'steps' ? Math.round(parsed) : milesToSteps(parsed, user.stepsPerMile)) : 0;
  const existing = activities.find((a) => a.date === date);

  const submit = () => {
    if (!valid) {
      setError('Enter a number greater than zero.');
      return;
    }
    if (date > today) {
      setError('You cannot log a walk that has not happened yet.');
      return;
    }

    const before = leg?.milesRemaining ?? 0;
    logActivity({
      date,
      steps,
      activeMinutes: minutes.trim() === '' ? null : Math.max(0, Math.round(Number(minutes))),
      mode,
    });

    const gained = steps / user.stepsPerMile;
    push({
      title: `${formatMiles(gained, 2)} miles logged`,
      body:
        before > 0 && gained >= before
          ? 'That finishes the leg. An encounter is waiting.'
          : `${formatMiles(Math.max(0, before - gained))} miles to the next encounter.`,
      icon: before > 0 && gained >= before ? 'sparkle' : 'boot',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a walk"
      description="Manual entry. Connect a step source later and this fills itself in."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} icon="plus">
            Add to journey
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="row row--wrap" style={{ gap: 'var(--s-3)' }}>
          <SegmentedControl<Unit>
            label="Unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'steps', label: 'Steps' },
              { value: 'miles', label: 'Miles' },
            ]}
          />
          <SegmentedControl<Mode>
            label="How to apply"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'add', label: 'Add to day' },
              { value: 'set', label: 'Replace day' },
            ]}
          />
        </div>

        <Field
          label={unit === 'steps' ? 'Steps walked' : 'Miles walked'}
          htmlFor="log-amount"
          error={error ?? undefined}
          hint={
            valid
              ? unit === 'steps'
                ? `About ${formatMiles(steps / user.stepsPerMile, 2)} miles at your stride.`
                : `About ${steps.toLocaleString('en-US')} steps at your stride.`
              : 'Distance and steps convert using the stride in your settings.'
          }
        >
          <Input
            id="log-amount"
            className="input--numeric"
            inputMode="decimal"
            autoComplete="off"
            placeholder={unit === 'steps' ? '8,400' : '4.2'}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </Field>

        <div className="grid grid--2">
          <Field label="Date" htmlFor="log-date" hint={existing ? 'This day already has activity.' : undefined}>
            <Input
              id="log-date"
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label="Active time" htmlFor="log-minutes" hint="Optional, in minutes.">
            <Input
              id="log-minutes"
              className="input--numeric"
              inputMode="numeric"
              placeholder="Estimated"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </Field>
        </div>

        <p className="field__hint">
          Calories are left blank on purpose — manual entry cannot measure them, and an invented
          number is worse than an empty one.
        </p>
      </div>
    </Modal>
  );
}
