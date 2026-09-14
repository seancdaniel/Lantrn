import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/state/theme';
import { ToastProvider } from '@/state/toast';
import { StoreProvider } from '@/state/store';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Dashboard } from '@/pages/Dashboard';
import { ActivityPage } from '@/pages/ActivityPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { CharactersPage } from '@/pages/CharactersPage';
import { CharacterPage } from '@/pages/CharacterPage';
import { MapPage } from '@/pages/MapPage';
import { MilestonesPage } from '@/pages/MilestonesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { FriendsPage } from '@/pages/FriendsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { NotFound } from '@/pages/NotFound';

/**
 * Clean URLs on a real host, hash routing everywhere else.
 *
 * The standalone bundle is served from a single opaque path (an artifact, a
 * file:// page, an embed) where history routing has nothing to rewrite against,
 * so that build keeps the hash. Vercel gets `/characters`, backed by the rewrite
 * in vercel.json.
 */
const Router = import.meta.env.MODE === 'standalone' ? HashRouter : BrowserRouter;
export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <ToastProvider>
          <Router>
            <AppShell>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/characters" element={<CharactersPage />} />
                  <Route path="/characters/:id" element={<CharacterPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/milestones" element={<MilestonesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </AppShell>
          </Router>
        </ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
