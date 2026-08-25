import { useSyncExternalStore } from 'react';

/** Subscribes to a media query. useSyncExternalStore keeps it correct across
 *  concurrent renders without an effect that flashes the wrong layout first. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false, // server/prerender: assume the narrow layout
  );
}
