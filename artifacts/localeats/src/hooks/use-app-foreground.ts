import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
export function useAppForeground() {
  const [active, setActive] = useState(document.visibilityState !== "hidden");
  useEffect(() => {
    let disposed = false;
    const visibility = () => setActive(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", visibility);
    const subscription = App.addListener("appStateChange", (state) => {
      if (!disposed) setActive(state.isActive);
    });
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      void subscription.then((s) => s.remove()).catch(() => {});
    };
  }, []);
  return active;
}
