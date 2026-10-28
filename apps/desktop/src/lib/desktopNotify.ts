import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { isTauri } from './platform';

/** System notification via the OS (desktop app only; a no-op in the browser). Failures never reach the user. */
export async function notifyDesktop(title: string, body: string): Promise<void> {
  if (!isTauri()) return;
  try {
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === 'granted';
    if (granted) sendNotification({ title, body });
  } catch {
    // notifications are best effort
  }
}
