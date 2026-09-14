import type { DailyReading, FitnessProvider, ProviderCapabilities } from './types';
import { ProviderUnavailableError } from './types';

export * from './types';

const none: ProviderCapabilities = {
  steps: false, distance: false, activeMinutes: false, calories: false, backgroundSync: false,
};

/**
 * The only source implemented today. Readings come from what the user types in,
 * which is why calories is always null rather than an estimate.
 */
export const manualProvider: FitnessProvider = {
  id: 'manual',
  name: 'Manual entry',
  note: 'Type a step count or a distance. Available on every device, no permissions required.',
  capabilities: { steps: true, distance: true, activeMinutes: true, calories: false, backgroundSync: false },
  status: () => 'connected',
  connect: async () => {},
  disconnect: async () => {},
  fetchRange: async () => [] as DailyReading[],
};

/** Registered but deliberately not implemented. Each rejects rather than pretending. */
function pending(
  id: string,
  name: string,
  note: string,
  capabilities: Partial<ProviderCapabilities>,
): FitnessProvider {
  return {
    id,
    name,
    note,
    capabilities: { ...none, ...capabilities },
    status: () => 'unavailable',
    connect: async () => {
      throw new ProviderUnavailableError(name);
    },
    disconnect: async () => {},
    fetchRange: async () => {
      throw new ProviderUnavailableError(name);
    },
  };
}

export const providers: FitnessProvider[] = [
  manualProvider,
  pending('apple-health', 'Apple Health', 'Requires the native shell. HealthKit has no browser API.', {
    steps: true, distance: true, activeMinutes: true, calories: true, backgroundSync: true,
  }),
  pending('health-connect', 'Google Health Connect', 'Requires the Android shell and a Health Connect permission grant.', {
    steps: true, distance: true, activeMinutes: true, calories: true, backgroundSync: true,
  }),
  pending('fitbit', 'Fitbit', 'Web API is available and needs a registered OAuth client and a server-side token exchange.', {
    steps: true, distance: true, activeMinutes: true, calories: true, backgroundSync: true,
  }),
  pending('garmin', 'Garmin Connect', 'Needs an approved Health API partner key before it can be enabled.', {
    steps: true, distance: true, activeMinutes: true, calories: true, backgroundSync: true,
  }),
];

export const getProvider = (id: string) => providers.find((p) => p.id === id) ?? manualProvider;
