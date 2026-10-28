import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { BrowserPage } from '../features/browser/BrowserPage';
import { HomePage } from '../features/home/HomePage';
import { ModulePage } from '../features/modules/ModulePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TasksPage } from '../features/tasks/TasksPage';
import { AppShell } from './AppShell';
import { RequireAuth } from './RequireAuth';
import { NotFoundPage } from './NotFoundPage';
import { UiKitPage } from './UiKitPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="browser" element={<BrowserPage />} />
        <Route path="m/:module/*" element={<ModulePage />} />
        <Route path="settings" element={<SettingsPage />} />
        {import.meta.env.DEV && <Route path="dev/ui" element={<UiKitPage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
