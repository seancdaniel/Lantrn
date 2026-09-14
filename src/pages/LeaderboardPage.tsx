import { useMemo, useState } from 'react';
import { communityMembers } from '@/state/store';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Card, Pill, SegmentedControl, Switch } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { formatInt, formatMiles } from '@/lib/format';

type Board = 'weeklyMiles' | 'monthlyMiles' | 'lifetimeMiles' | 'weeklySteps' | 'charactersUnlocked';

const BOARDS: { value: Board; label: string; unit: string; kind: 'miles' | 'steps' | 'count' }[] = [
  { value: 'weeklyMiles', label: 'Weekly miles', unit: 'mi', kind: 'miles' },
  { value: 'monthlyMiles', label: 'Monthly miles', unit: 'mi', kind: 'miles' },
  { value: 'lifetimeMiles', label: 'Lifetime miles', unit: 'mi', kind: 'miles' },
  { value: 'weeklySteps', label: 'Weekly steps', unit: 'steps', kind: 'steps' },
  { value: 'charactersUnlocked', label: 'Characters', unit: 'unlocked', kind: 'count' },
];

export function LeaderboardPage() {
  const [board, setBoard] = useState<Board>('weeklyMiles');
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [visible, setVisible] = useState(true);

  const config = BOARDS.find((b) => b.value === board)!;

  const rows = useMemo(() => {
    const pool = communityMembers.filter((m) => (friendsOnly ? m.isFriend || m.isSelf : true));
    return [...pool].sort((a, b) => b[board] - a[board]);
  }, [board, friendsOnly]);

  const selfRank = rows.findIndex((r) => r.isSelf) + 1;

  const format = (value: number) => {
    if (config.kind === 'miles') return formatMiles(value);
    if (config.kind === 'steps') return formatInt(value);
    return String(value);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Community"
        title="Leaderboard"
        description="Opt-in, handle-only, and deliberately quiet. Somebody is always walking more than you, and that is fine."
        actions={
          <SegmentedControl<Board>
            label="Leaderboard type"
            value={board}
            onChange={setBoard}
            options={BOARDS.map((b) => ({ value: b.value, label: b.label }))}
          />
        }
      />

      <Card sunken style={{ marginBottom: 'var(--s-6)' }}>
        <div className="row row--between row--wrap" style={{ gap: 'var(--s-4)' }}>
          <div className="row row--wrap" style={{ gap: 'var(--s-6)' }}>
            <Switch checked={visible} onChange={setVisible} id="lb-visible" label="Show me on leaderboards" />
            <Switch checked={friendsOnly} onChange={setFriendsOnly} id="lb-friends" label="Friends only" />
          </div>
          {selfRank > 0 && visible ? (
            <Pill plain>
              <Icon name="trophy" size={13} /> You are #{selfRank} of {rows.length}
            </Pill>
          ) : (
            <Pill tone="locked">Hidden from others</Pill>
          )}
        </div>
      </Card>

      <Card flush>
        <div style={{ padding: 'var(--s-3)' }}>
          <ol>
            {rows.map((member, index) => {
              const rank = index + 1;
              const hidden = member.isSelf && !visible;
              return (
                <li
                  key={member.id}
                  className={`lb-row${member.isSelf ? ' lb-row--self' : ''}`}
                  style={hidden ? { opacity: 0.45 } : undefined}
                >
                  <span className={`lb-rank${rank <= 3 ? ` lb-rank--${rank}` : ''}`}>
                    {rank <= 3 ? <Icon name="trophy" size={16} /> : rank}
                  </span>

                  <span className="lb-who">
                    <Avatar initials={member.initials} accent={member.accent} size={36} />
                    <span style={{ minWidth: 0 }}>
                      <span className="lb-handle">
                        @{member.handle}
                        {member.isSelf ? <span className="muted"> · you</span> : null}
                      </span>
                      <span className="lb-sub" style={{ display: 'block' }}>
                        {member.charactersUnlocked} encounters · {formatMiles(member.lifetimeMiles)} mi lifetime
                      </span>
                    </span>
                  </span>

                  <span className="lb-value">
                    {hidden ? '—' : format(member[board])}
                    <small>{config.unit}</small>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      <p className="field__hint" style={{ marginTop: 'var(--s-4)' }}>
        Rankings use chosen handles, never real names. Turning yourself off removes your row for everyone else
        and leaves your own progress untouched.
      </p>
    </div>
  );
}
