import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
export function useAppForeground() {
  const [active, setActive] = useState(document.visibilityState !== "hidden");
  useEffect(() => {
    let disposed = false;
    let nativeActive = true;
    const visibility = () => {
      if (!disposed)
        setActive(nativeActive && document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", visibility);
    const subscription = App.addListener("appStateChange", (state) => {
      nativeActive = state.isActive;
      visibility();
    });
    void subscription.catch(() => {});
    visibility();
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      void subscription.then((s) => s.remove()).catch(() => {});
    };
  }, []);
  return active;
}
