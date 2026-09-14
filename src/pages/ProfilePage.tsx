import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJourney, useStore } from '@/state/store';
import { useToast } from '@/state/toast';
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader';
import { Metric, ProgressBar } from '@/components/domain/Progress';
import { EncounterCard } from '@/components/domain/EncounterCard';
import { MilestoneCard } from '@/components/domain/MilestoneCard';
import { Button } from '@/components/ui/Button';
import { Avatar, Field, Input, Pill } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { formatDateLong, formatDuration, formatMiles } from '@/lib/format';
import { LEVEL_TITLES } from '@/lib/progress';

export function ProfilePage() {
  const { user, destinations, updateUser } = useStore();
  const { totals, level, records, progress, unlockedCount, completedDestinations, milestoneStates } = useJourney();
  const { push } = useToast();
  const [editing, setEditing] = useState(false);

  const logged = useMemo(
    () => progress.filter((p) => p.encounter).sort((a, b) => (b.encounter!.date > a.encounter!.date ? 1 : -1)).slice(0, 4),
    [progress],
  );
  const recentMilestones = useMemo(
    () => milestoneStates.filter((m) => m.unlocked).slice(-2).reverse(),
    [milestoneStates],
  );

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page">
      <PageHeader eyebrow="You" title="Profile" />

      <section className="profilehero grain">
        <div className="profilehero__inner">
          <Avatar initials={initials} src={user.avatar} size={92} accent="var(--ember)" alt={user.name} />

          <div style={{ minWidth: 0 }}>
            <h2 className="profilehero__name">{user.name}</h2>
            <p className="profilehero__handle">
              @{user.handle} · Member since {formatDateLong(user.createdAt)}
            </p>

            <div className="profilehero__badges">
              <span className="levelchip">
                <span className="levelchip__num">{level.level}</span>
                <span className="levelchip__title">{level.title}</span>
              </span>
              <Pill plain>
                <Icon name="flame" size={13} /> {records.currentStreak}-day streak
              </Pill>
              <Button size="sm" variant="ghost" icon="pencil" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            </div>
          </div>

          <div className="levelmeter">
            <div className="levelmeter__head">
              <span>Adventure level {level.level}</span>
              <span className="numeric">
                {formatMiles(level.milesToNext)} mi to {level.level + 1}
              </span>
            </div>
            <ProgressBar value={level.percentage} thickness="thick" tone="gold" ariaLabel="Level progress" />
            <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              Next up: {LEVEL_TITLES[level.level] ?? 'the end of the list'}
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Lifetime stats" />
        <div className="statgrid">
          {[
            { label: 'Total miles', value: <Metric value={totals.miles} decimals={1} /> },
            { label: 'Total steps', value: <Metric value={totals.steps} /> },
            { label: 'Characters unlocked', value: <Metric value={unlockedCount} /> },
            { label: 'Destinations completed', value: <Metric value={completedDestinations} /> },
            { label: 'Walking days', value: <Metric value={totals.walkingDays} /> },
            { label: 'Current streak', value: <Metric value={records.currentStreak} /> },
            { label: 'Longest streak', value: <Metric value={records.longestStreak} /> },
            { label: 'Time on foot', value: formatDuration(totals.activeMinutes) },
          ].map((stat) => (
            <div className="statgrid__cell" key={stat.label}>
              <p className="statgrid__value">{stat.value}</p>
              <p className="statgrid__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader
          title="Encounter history"
          action={
            <Link to="/characters" className="section__link">
              All characters <Icon name="arrowRight" size={14} />
            </Link>
          }
        />
        <div className="grid grid--split-even">
          {logged.map((entry) => (
            <EncounterCard
              key={entry.character.id}
              entry={entry}
              destination={destinations.find((d) => d.id === entry.character.destinationId)}
            />
          ))}
        </div>
      </section>

      {recentMilestones.length > 0 ? (
        <section className="section">
          <SectionHeader
            title="Latest markers"
            action={
              <Link to="/milestones" className="section__link">
                All milestones <Icon name="arrowRight" size={14} />
              </Link>
            }
          />
          <div className="grid grid--2">
            {recentMilestones.map((state) => (
              <MilestoneCard key={state.milestone.id} state={state} />
            ))}
          </div>
        </section>
      ) : null}

      <ProfileEditor
        open={editing}
        onClose={() => setEditing(false)}
        name={user.name}
        handle={user.handle}
        onSave={(next) => {
          updateUser(next);
          setEditing(false);
          push({ title: 'Profile updated', icon: 'check' });
        }}
      />
    </div>
  );
}

function ProfileEditor({
  open,
  onClose,
  onSave,
  name,
  handle,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (patch: { name: string; handle: string }) => void;
  name: string;
  handle: string;
}) {
  const [draft, setDraft] = useState({ name, handle });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Your handle is what the community sees. Your name stays private."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="check" onClick={() => onSave(draft)}>
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Display name" htmlFor="p-name">
          <Input id="p-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        </Field>
        <Field label="Handle" htmlFor="p-handle" hint="Shown on leaderboards instead of your name.">
          <Input
            id="p-handle"
            value={draft.handle}
            onChange={(e) => setDraft((d) => ({ ...d, handle: e.target.value.replace(/\s/g, '') }))}
          />
        </Field>
      </div>
    </Modal>
  );
}
