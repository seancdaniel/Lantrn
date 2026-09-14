import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** One source of truth for both the desktop rail and the mobile bar. */
export const navGroups: NavGroup[] = [
  {
    label: 'Journey',
    items: [
      { to: '/', label: 'Dashboard', icon: 'home', end: true },
      { to: '/map', label: 'Adventure map', icon: 'map' },
      { to: '/characters', label: 'Characters', icon: 'characters' },
      { to: '/milestones', label: 'Milestones', icon: 'flag' },
    ],
  },
  {
    label: 'Walking',
    items: [
      { to: '/activity', label: 'Activity', icon: 'activity' },
      { to: '/history', label: 'History', icon: 'calendar' },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
      { to: '/friends', label: 'Friends', icon: 'users' },
    ],
  },
  {
    label: 'You',
    items: [
      { to: '/profile', label: 'Profile', icon: 'profile' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
      { to: '/admin', label: 'Admin', icon: 'shield', adminOnly: true },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/activity', label: 'Activity', icon: 'activity' },
  { to: '/characters', label: 'Characters', icon: 'characters' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];
