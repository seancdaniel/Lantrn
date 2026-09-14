import type { Milestone } from '@/types';

export const milestones: Milestone[] = [
  { id: 'm-10', name: 'First Ten', requiredMiles: 10, description: 'Far enough that it stopped being a walk and started being a habit.' },
  { id: 'm-25', name: 'Quarter Century', requiredMiles: 25, description: 'The novelty has worn off and you kept going anyway.' },
  { id: 'm-50', name: 'The Half Hundred', requiredMiles: 50, description: 'A full destination behind you, and a route that no longer feels theoretical.' },
  { id: 'm-100', name: 'Triple Digits', requiredMiles: 100, description: 'One hundred miles on foot. Most people who start never see this number.' },
  { id: 'm-250', name: 'The Long Middle', requiredMiles: 250, description: 'Past the excitement, into the part that actually counts.' },
  { id: 'm-500', name: 'Halfway Marker', requiredMiles: 500, description: 'The stone by the road that tells you it is closer ahead than behind.' },
  { id: 'm-1000', name: 'The Thousand', requiredMiles: 1000, description: 'Four digits. There is no casual way to walk one thousand miles.' },
  { id: 'm-1500', name: 'Fifteen Hundred', requiredMiles: 1500, description: 'Past the end of the route and still moving.' },
  { id: 'm-2500', name: 'The Far Count', requiredMiles: 2500, description: 'A number that stops being a goal and starts being a fact about you.' },
];
