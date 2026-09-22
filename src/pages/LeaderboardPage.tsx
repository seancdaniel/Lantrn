import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/state/store';
import { useToast } from '@/state/toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/media';
import { Card, EmptyState, ErrorState, Pill, SegmentedControl, Skeleton, Switch } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import type { LeaderboardEntry } from '@/lib/db/types';
import { formatInt, formatMiles } from '@/lib/format';

type Board = 'weeklyMiles' | 'monthlyMiles' | 'lifetimeMiles' | 'weeklySteps' | 'encounters';

const BOARDS: { value: Board; label: string; unit: string }[] = [
  { value: 'weeklyMiles', label: 'Weekly miles', unit: 'mi' },
  { value: 'monthlyMiles', label: 'Monthly miles', unit: 'mi' },
  { value: 'lifetimeMiles', label: 'Lifetime miles', unit: 'mi' },
  { value: 'weeklySteps', label: 'Weekly steps', unit: 'steps' },
  { value: 'encounters', label: 'Encounters', unit: 'unlocked' },
];

/** Every row converts with its own walker's stride, never the viewer's. */
function score(entry: LeaderboardEntry, board: Board): number {
  switch (board) {
    case 'weeklyMiles':
      return entry.weeklySteps / entry.stepsPerMile;
    case 'monthlyMiles':
      return entry.monthlySteps / entry.stepsPerMile;
    case 'lifetimeMiles':
      return entry.lifetimeSteps / entry.stepsPerMile;
    case 'weeklySteps':
      return entry.weeklySteps;
    case 'encounters':
      return entry.encountersLogged;
  }
}

const initials = (handle: string) => handle.slice(0, 2).toUpperCase();

/** A stable colour per handle, so a walker looks the same every visit. */
function accentFor(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i += 1) hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  const hues = [18, 42, 96, 168, 202, 232, 268, 312];
  return `hsl(${hues[hash % hues.length]} 42% 48%)`;
}

export function LeaderboardPage() {
  const { user, updateUser, fetchLeaderboard, isRemote } = useStore();
  const { push } = useToast();

  const [board, setBoard] = useState<Board>('weeklyMiles');
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    setError(null);
    fetchLeaderboard()
      .then(setRows)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Something went wrong.'));
  }, [fetchLeaderboard]);

  // Re-reads when visibility changes, because the view filters on it — switching
  // yourself off removes your own row too, and the list should show that.
  useEffect(load, [load, user.leaderboardVisible]);

  const config = BOARDS.find((b) => b.value === board)!;

  const ranked = useMemo(
    () => (rows ? [...rows].sort((a, b) => score(b, board) - score(a, board)) : []),
    [rows, board],
  );

  const myRank = ranked.findIndex((r) => r.handle === user.handle) + 1;

  const format = (entry: LeaderboardEntry) => {
    const value = score(entry, board);
    if (board === 'encounters') return String(Math.round(value));
    if (board === 'weeklySteps') return formatInt(value);
    return formatMiles(value);
  };

  const setVisible = (next: boolean) => {
    updateUser({ leaderboardVisible: next });
    push({
      title: next ? 'You are on the leaderboard' : 'Hidden from the leaderboard',
      body: next ? 'Your handle and totals are visible to others.' : 'Your own progress is untouched.',
      icon: next ? 'trophy' : 'eye',
    });
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
          <Switch
            checked={user.leaderboardVisible}
            onChange={setVisible}
            id="lb-visible"
            label="Show me on leaderboards"
          />
          {user.leaderboardVisible && myRank > 0 ? (
            <Pill plain>
              <Icon name="trophy" size={13} /> You are #{myRank} of {ranked.length}
            </Pill>
          ) : (
            <Pill tone="locked">Hidden</Pill>
          )}
        </div>
      </Card>

      {error ? (
        <ErrorState detail={error} onRetry={load} />
      ) : rows === null ? (
        <Card flush>
          <div className="stack" style={{ padding: 'var(--s-4)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="lb-row">
                <Skeleton width={24} height={16} />
                <div className="lb-who">
                  <Skeleton width={36} height={36} radius={999} />
                  <Skeleton width={140} height={14} />
                </div>
                <Skeleton width={64} height={18} />
              </div>
            ))}
          </div>
        </Card>
      ) : ranked.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="Nobody is walking yet."
          body={
            user.leaderboardVisible
              ? 'You are the first. Log a walk and the board starts with you.'
              : 'Switch yourself on above to appear here, or wait for somebody else to join.'
          }
        />
      ) : (
        <Card flush>
          <div style={{ padding: 'var(--s-3)' }}>
            <ol>
              {ranked.map((entry, index) => {
                const rank = index + 1;
                const isSelf = entry.handle === user.handle;
                return (
                  <li key={entry.handle} className={`lb-row${isSelf ? ' lb-row--self' : ''}`}>
                    <span className={`lb-rank${rank <= 3 ? ` lb-rank--${rank}` : ''}`}>
                      {rank <= 3 ? <Icon name="trophy" size={16} /> : rank}
                    </span>

                    <span className="lb-who">
                      <Avatar initials={initials(entry.handle)} accent={accentFor(entry.handle)} size={36} />
                      <span style={{ minWidth: 0 }}>
                        <span className="lb-handle">
                          @{entry.handle}
                          {isSelf ? <span className="muted"> · you</span> : null}
                        </span>
                        <span className="lb-sub" style={{ display: 'block' }}>
                          {entry.encountersLogged} encounters ·{' '}
                          {formatMiles(entry.lifetimeSteps / entry.stepsPerMile)} mi lifetime
                        </span>
                      </span>
                    </span>

                    <span className="lb-value">
                      {format(entry)}
                      <small>{config.unit}</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
      )}

      <p className="field__hint" style={{ marginTop: 'var(--s-4)' }}>
        Rankings use chosen handles, never real names, and are built from totals only — nobody can
        see the individual walks behind a number.{' '}
        {isRemote
          ? 'Switching yourself off removes your row for everyone, including this page.'
          : 'This is the seeded demo community; sign in with a real account to see live rankings.'}
      </p>
    </div>
  );
}
