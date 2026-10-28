import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauri } from './platform';

export type UpdateCheck =
  | { status: 'none' }
  | { status: 'available'; version: string; update: Update }
  | { status: 'error' };

/** Ask the release feed for a newer version. Always resolves: a missing feed or key is just "no update". */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!isTauri()) return { status: 'none' };
  try {
    const update = await check();
    return update ? { status: 'available', version: update.version, update } : { status: 'none' };
  } catch {
    return { status: 'error' };
  }
}

/** Download, install, restart. */
export async function installUpdate(update: Update): Promise<void> {
  await update.downloadAndInstall();
  await relaunch();
}
