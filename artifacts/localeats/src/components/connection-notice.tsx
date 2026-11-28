import { useSyncExternalStore } from 'react';
const subscribe = (notify: () => void) => {
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  return () => { window.removeEventListener('online', notify); window.removeEventListener('offline', notify); };
};
export function ConnectionNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  return online ? null : <p className="roco-notice" role="status">You’re offline. Your cart stays on this device. Account and address loading will resume when you reconnect.</p>;
}
