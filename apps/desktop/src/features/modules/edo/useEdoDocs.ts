import { useEffect, useMemo } from 'react';
import type { PaletteDoc } from '../../../lib/palette';
import { useEdo } from './store';

/** Documents the command palette can search; loads the module data on first use. */
export function useEdoDocs(enabled: boolean): PaletteDoc[] {
  const data = useEdo((s) => s.data);
  const status = useEdo((s) => s.status);
  useEffect(() => {
    if (enabled && status === 'idle') void useEdo.getState().load();
  }, [enabled, status]);
  return useMemo(
    () => (data?.documents ?? []).map((d) => ({ id: d.id, number: d.number, title: d.title })),
    [data],
  );
}
