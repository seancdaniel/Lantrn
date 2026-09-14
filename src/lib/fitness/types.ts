/**
 * Fitness source abstraction.
 *
 * Every reading the app consumes arrives through a FitnessProvider, so adding a real
 * platform later means implementing this interface and registering it — no page,
 * component or store touches a vendor SDK directly.
 *
 * Nothing in this file simulates a connection. Providers that are not implemented
 * report `status: 'unavailable'` and refuse to connect.
 */

export interface DailyReading {
  /** ISO date, YYYY-MM-DD */
  date: string;
  steps: number;
  /** Distance in miles when the source measures it; otherwise derived from stride. */
  miles?: number;
  activeMinutes?: number;
  /** Only ever populated by a source that actually measures it. */
  calories?: number | null;
}

export type ProviderStatus = 'connected' | 'disconnected' | 'unavailable';

export interface ProviderCapabilities {
  steps: boolean;
  distance: boolean;
  activeMinutes: boolean;
  calories: boolean;
  backgroundSync: boolean;
}

export interface FitnessProvider {
  id: string;
  name: string;
  /** Why this source is not connectable yet, shown verbatim in Settings. */
  note: string;
  capabilities: ProviderCapabilities;
  status(): ProviderStatus;
  /** Resolves once a session exists. Providers without an implementation reject. */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  /** Inclusive date range. */
  fetchRange(fromIso: string, toIso: string): Promise<DailyReading[]>;
}

export class ProviderUnavailableError extends Error {
  constructor(providerName: string) {
    super(`${providerName} is not connected in this build.`);
    this.name = 'ProviderUnavailableError';
  }
}
