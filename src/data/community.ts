import type { Announcement, CommunityMember, FeedItem, User } from '@/types';
import { DEMO_USER_ID, START_DATE } from '@/data/activity';

export const demoUser: User = {
  id: DEMO_USER_ID,
  name: 'Sam Okonjo',
  handle: 'quietmile',
  email: 'sam@example.com',
  avatar: null,
  createdAt: START_DATE,
  role: 'admin',
  stepsPerMile: 2000.5,
};

/**
 * Community rows use chosen handles rather than real names — nothing here reveals
 * who anyone is unless they decide it should.
 */
export const communityMembers: CommunityMember[] = [
  { id: 'c_1', handle: 'northgate', initials: 'NG', accent: '#6E8FA8', weeklyMiles: 41.2, monthlyMiles: 168.4, lifetimeMiles: 1912.7, weeklySteps: 82_460, charactersUnlocked: 20, isFriend: false },
  { id: 'c_2', handle: 'duskwalker', initials: 'DW', accent: '#A87A5C', weeklyMiles: 38.6, monthlyMiles: 151.9, lifetimeMiles: 1604.3, weeklySteps: 77_240, charactersUnlocked: 19, isFriend: true },
  { id: DEMO_USER_ID, handle: 'quietmile', initials: 'QM', accent: '#BE5F2E', weeklyMiles: 44.7, monthlyMiles: 143.2, lifetimeMiles: 1246.6, weeklySteps: 89_523, charactersUnlocked: 18, isFriend: false, isSelf: true },
  { id: 'c_3', handle: 'lampglow', initials: 'LG', accent: '#7E8F63', weeklyMiles: 33.8, monthlyMiles: 139.6, lifetimeMiles: 1188.0, weeklySteps: 67_640, charactersUnlocked: 18, isFriend: true },
  { id: 'c_4', handle: 'ninefathom', initials: 'NF', accent: '#5F7F86', weeklyMiles: 31.4, monthlyMiles: 128.1, lifetimeMiles: 1043.9, weeklySteps: 62_840, charactersUnlocked: 17, isFriend: false },
  { id: 'c_5', handle: 'saltroad', initials: 'SR', accent: '#8C6A9E', weeklyMiles: 29.9, monthlyMiles: 121.7, lifetimeMiles: 962.5, weeklySteps: 59_830, charactersUnlocked: 16, isFriend: true },
  { id: 'c_6', handle: 'thirdbell', initials: 'TB', accent: '#9E6A6A', weeklyMiles: 27.2, monthlyMiles: 110.4, lifetimeMiles: 874.1, weeklySteps: 54_420, charactersUnlocked: 15, isFriend: false },
  { id: 'c_7', handle: 'fernwick', initials: 'FW', accent: '#6B8E72', weeklyMiles: 24.5, monthlyMiles: 96.8, lifetimeMiles: 712.6, weeklySteps: 49_030, charactersUnlocked: 14, isFriend: true },
  { id: 'c_8', handle: 'palehour', initials: 'PH', accent: '#7A7FA0', weeklyMiles: 21.8, monthlyMiles: 88.2, lifetimeMiles: 604.4, weeklySteps: 43_620, charactersUnlocked: 13, isFriend: false },
  { id: 'c_9', handle: 'brasskey', initials: 'BK', accent: '#A88A4C', weeklyMiles: 18.4, monthlyMiles: 74.6, lifetimeMiles: 468.9, weeklySteps: 36_840, charactersUnlocked: 11, isFriend: true },
  { id: 'c_10', handle: 'lowtide', initials: 'LT', accent: '#5E8896', weeklyMiles: 15.1, monthlyMiles: 61.3, lifetimeMiles: 331.2, weeklySteps: 30_240, charactersUnlocked: 10, isFriend: false },
  { id: 'c_11', handle: 'emberline', initials: 'EL', accent: '#B0714A', weeklyMiles: 12.7, monthlyMiles: 52.9, lifetimeMiles: 248.6, weeklySteps: 25_420, charactersUnlocked: 9, isFriend: false },
];

export const feed: FeedItem[] = [
  { id: 'f_1', handle: 'duskwalker', initials: 'DW', accent: '#A87A5C', kind: 'encounter', text: 'unlocked a new Character Encounter in the Clockwork Quarter.', at: '2026-09-09' },
  { id: 'f_2', handle: 'lampglow', initials: 'LG', accent: '#7E8F63', kind: 'distance', text: 'walked 12.4 miles today.', at: '2026-09-09' },
  { id: 'f_3', handle: 'saltroad', initials: 'SR', accent: '#8C6A9E', kind: 'streak', text: 'reached a 60-day walking streak.', at: '2026-09-08' },
  { id: 'f_4', handle: 'fernwick', initials: 'FW', accent: '#6B8E72', kind: 'milestone', text: 'passed the 700-mile marker.', at: '2026-09-08' },
  { id: 'f_5', handle: 'brasskey', initials: 'BK', accent: '#A88A4C', kind: 'encounter', text: 'logged an encounter at Starfall Basin.', at: '2026-09-07' },
  { id: 'f_6', handle: 'duskwalker', initials: 'DW', accent: '#A87A5C', kind: 'distance', text: 'finished a 9.8-mile evening loop.', at: '2026-09-06' },
];

export const announcements: Announcement[] = [
  {
    id: 'an_1',
    title: 'A sixth destination is being surveyed',
    body: 'Four new encounters are in production beyond the Clockwork Quarter. Anyone who finishes the route before it ships keeps their completion record.',
    publishedAt: '2026-09-01',
    active: true,
  },
  {
    id: 'an_2',
    title: 'Stride settings now affect past activity',
    body: 'Adjusting your stride in Settings recalculates historical distance instead of only applying going forward.',
    publishedAt: '2026-08-18',
    active: true,
  },
  {
    id: 'an_3',
    title: 'Leaderboards moved to opt-in',
    body: 'Community rankings no longer include an account unless it has been switched on in Settings.',
    publishedAt: '2026-07-30',
    active: false,
  },
];
