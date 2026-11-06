import { useSyncExternalStore } from "react";
import { dutyIntent } from "../lib/duty-intent";
export function useDutyIntent(userId: string | null) {
  return useSyncExternalStore(
    dutyIntent.subscribe,
    () => dutyIntent.get(userId),
    () => false,
  );
}
