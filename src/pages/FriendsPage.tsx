import { useMemo, useState } from 'react';
import { communityMembers, feed, useJourney } from '@/state/store';
import { useToast } from '@/state/toast';
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader';
import { ProgressBar } from '@/components/domain/Progress';
import { Button } from '@/components/ui/Button';
import { Avatar, Card, EmptyState, Field, Input, Pill } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { formatInt, formatMiles, relativeDay } from '@/lib/format';
import type { FeedItem } from '@/types';

const FEED_ICON: Record<FeedItem['kind'], 'sparkle' | 'boot' | 'flag' | 'flame'> = {
  encounter: 'sparkle',
  distance: 'boot',
  milestone: 'flag',
  streak: 'flame',
};

export function FriendsPage() {
  const { routeMiles, totals } = useJourney();
  const { push } = useToast();
  const [added, setAdded] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [query, setQuery] = useState('');

  const friends = useMemo(
    () => communityMembers.filter((m) => (m.isFriend || added.includes(m.id)) && !m.isSelf),
    [added],
  );

  const suggestions = useMemo(
    () =>
      communityMembers.filter(
        (m) => !m.isSelf && !m.isFriend && !added.includes(m.id) && m.handle.includes(query.toLowerCase()),
      ),
    [added, query],
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Community"
        title="Friends"
        description="Someone else walking the same route makes the quiet weeks easier. Everything here stays secondary to your own journey."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setInviting(true)}>
            Add a friend
          </Button>
        }
      />

      <section aria-labelledby="feed-heading">
        <SectionHeader title="Recent activity" id="feed-heading" />
        <Card>
          <ul>
            {feed.map((item) => (
              <li key={item.id} className="feed-item">
                <Avatar initials={item.initials} accent={item.accent} size={36} />
                <div className="feed-item__body">
                  <p className="feed-item__text">
                    <b>@{item.handle}</b> {item.text}
                  </p>
                  <p className="feed-item__time">{relativeDay(item.at, '2026-09-09')}</p>
                </div>
                <span className="muted" style={{ color: 'var(--ember)' }}>
                  <Icon name={FEED_ICON[item.kind]} size={16} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="section">
        <SectionHeader title={`Your friends (${friends.length})`} />

        {friends.length === 0 ? (
          <EmptyState
            icon="users"
            title="Walking alone for now."
            body="Add someone and you will see their progress alongside yours — no pressure, no notifications, just company."
            action={
              <Button variant="accent" icon="plus" onClick={() => setInviting(true)}>
                Add a friend
              </Button>
            }
          />
        ) : (
          <div className="grid grid--2">
            {friends.map((friend) => {
              const share = Math.min(1, friend.lifetimeMiles / routeMiles);
              const ahead = friend.lifetimeMiles - totals.miles;
              return (
                <Card key={friend.id}>
                  <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                    <div className="row" style={{ gap: 'var(--s-3)', minWidth: 0 }}>
                      <Avatar initials={friend.initials} accent={friend.accent} size={42} />
                      <div style={{ minWidth: 0 }}>
                        <p className="lb-handle">@{friend.handle}</p>
                        <p className="lb-sub">
                          {friend.charactersUnlocked} encounters · {formatInt(friend.weeklySteps)} steps this week
                        </p>
                      </div>
                    </div>
                    <Pill plain>
                      {ahead >= 0 ? `${formatMiles(ahead)} mi ahead` : `${formatMiles(-ahead)} mi behind`}
                    </Pill>
                  </div>

                  <div style={{ marginTop: 'var(--s-5)' }}>
                    <div className="row row--between" style={{ marginBottom: 8 }}>
                      <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                        Route progress
                      </span>
                      <span className="muted numeric" style={{ fontSize: 'var(--text-xs)' }}>
                        {formatMiles(friend.lifetimeMiles)} mi
                      </span>
                    </div>
                    <ProgressBar value={share} ariaLabel={`${friend.handle} route progress`} />
                  </div>

                  <div className="row row--wrap" style={{ marginTop: 'var(--s-4)', gap: 'var(--s-2)' }}>
                    <Button
                      size="sm"
                      variant="quiet"
                      icon="sparkle"
                      onClick={() => push({ title: `Cheered @${friend.handle}`, icon: 'sparkle' })}
                    >
                      Celebrate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => push({ title: 'Comparison', body: 'Side-by-side journeys are next on the roadmap.' })}
                    >
                      Compare journeys
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Add a friend"
        description="Search by handle. Nobody is added without accepting on their end."
      >
        <div className="stack">
          <Field label="Handle" htmlFor="friend-search">
            <Input
              id="friend-search"
              placeholder="quietmile"
              value={query}
              onChange={(e) => setQuery(e.target.value.replace(/\s/g, ''))}
            />
          </Field>

          {suggestions.length === 0 ? (
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              No handles match that. Try fewer letters.
            </p>
          ) : (
            <ul className="stack stack--sm">
              {suggestions.map((member) => (
                <li key={member.id} className="row row--between">
                  <span className="row" style={{ gap: 'var(--s-3)' }}>
                    <Avatar initials={member.initials} accent={member.accent} size={32} />
                    <span>
                      <span className="lb-handle">@{member.handle}</span>
                      <span className="lb-sub" style={{ display: 'block' }}>
                        {formatMiles(member.lifetimeMiles)} lifetime miles
                      </span>
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="quiet"
                    icon="plus"
                    onClick={() => {
                      setAdded((prev) => [...prev, member.id]);
                      push({ title: `Request sent to @${member.handle}`, icon: 'check' });
                    }}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}
