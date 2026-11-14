import { mobileReturnRoute } from "./mobile-return";
import { readGuestToken } from "./guest-session";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
let registration: Promise<void> | null = null;
export function registerPush(): Promise<void> {
  if (!Capacitor.isNativePlatform())
    return Promise.reject(
      new Error(
        "Mobile push enrollment is available in the Android or iOS app. In-app notifications remain available here.",
      ),
    );
  if (registration) return registration;
  registration = (async () => {
    const config = await customFetch<{ android: boolean; ios: boolean }>(
      "/api/notification-devices/config",
    );
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    if (!config[platform])
      throw new Error(
        "Mobile push needs external service configuration. In-app notifications are available.",
      );
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted")
      throw new Error("Notification permission was not granted");
    await new Promise<void>((resolve, reject) => {
      const handles: Array<{ remove: () => Promise<void> }> = [];
      const cleanup = () => {
        clearTimeout(timer);
        for (const handle of handles) void handle.remove();
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            "Device registration timed out. Check native push configuration.",
          ),
        );
      }, 15000);
      void (async () => {
        handles.push(
          await PushNotifications.addListener("registration", async (token) => {
            try {
              await customFetch("/api/notification-devices", {
                method: "POST",
                body: JSON.stringify({ token: token.value, platform }),
              });
              localStorage.setItem("rocoeats-push-token", token.value);
              cleanup();
              resolve();
            } catch (error) {
              cleanup();
              reject(error);
            }
          }),
        );
        handles.push(
          await PushNotifications.addListener("registrationError", () => {
            cleanup();
            reject(
              new Error(
                "Native push registration failed. Check Firebase/APNs setup.",
              ),
            );
          }),
        );
        await PushNotifications.register();
      })().catch((error) => {
        cleanup();
        reject(error);
      });
    });
  })().finally(() => {
    registration = null;
  });
  return registration;
}
export async function unregisterPush() {
  const token = localStorage.getItem("rocoeats-push-token");
  // A device that was never enrolled may have no Firebase app configuration.
  if (!token) return;
  try {
    await customFetch("/api/notification-devices", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    });
  } finally {
    localStorage.removeItem("rocoeats-push-token");
    if (Capacitor.isNativePlatform())
      await PushNotifications.unregister().catch(() => {});
  }
}
export function MobileLifecycle() {
  const {isSignedIn}=useAuth();
  const signedIn=useRef(isSignedIn);signedIn.current=isSignedIn;
  const [, navigate] = useLocation();
  const client = useQueryClient();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];
    const retain = async (
      promise: Promise<{ remove: () => Promise<void> }>,
    ) => {
      const handle = await promise;
      if (disposed) await handle.remove();
      else handles.push(handle);
    };
    void retain(
      App.addListener("appStateChange", (state) => {
        if (state.isActive) void client.invalidateQueries();
      }),
    );
    const returnToApp=async(raw:string)=>{
      const route=mobileReturnRoute(raw,!!readGuestToken()&&!signedIn.current);if(!route)return;
      await Browser.close().catch(()=>{});if(disposed)return;
      navigate(route);void client.invalidateQueries();
    };
    void retain(App.addListener("appUrlOpen",event=>returnToApp(event.url)));
    void App.getLaunchUrl().then(result=>{if(result&&!disposed)void returnToApp(result.url);}).catch(()=>{});
    void retain(
      PushNotifications.addListener(
        "pushNotificationReceived",
        () => void client.invalidateQueries({ queryKey: ["notifications"] }),
      ),
    );
    void retain(
      PushNotifications.addListener("pushNotificationActionPerformed", () => {
        navigate("/notifications");
        void client.invalidateQueries();
      }),
    );
    return () => {
      disposed = true;
      for (const handle of handles) void handle.remove();
    };
  }, [client, navigate]);
  return null;
}
