import { nativeStep } from '../lib/native-startup';
import { useEffect, useRef } from 'react';
import { useState } from "react";
import { useAuth } from "@clerk/react";
import { Capacitor } from "@capacitor/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { registerPush, unregisterPush } from "../lib/mobile";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { accountStatus } from "../lib/account-entry";
import { PushNotifications } from "@capacitor/push-notifications";
import { App } from "@capacitor/app";

async function readPushStatus<T>(operation: (signal: AbortSignal) => Promise<T>, signal: AbortSignal): Promise<T> {
  const controller = new AbortController();
  try { return await nativeStep('NATIVE_PUSH_STATUS_TIMEOUT', () => operation(controller.signal), signal); }
  finally { controller.abort(); }
}

function savedDevice() {
  try {
    const id = localStorage.getItem("rocoeats-push-device-id");
    return id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ? id
      : null;
  } catch {
    return null;
  }
}
function hasLegacyRegistration() {
  try {
    return !!(localStorage.getItem("rocoeats-push-token") || localStorage.getItem("rocoeats-push-pending-token"));
  } catch {
    return false;
  }
}
export function PushPreferences() {
  const { userId } = useAuth();
  const enrollment = useRef<AbortController | null>(null);
  const native = Capacitor.isNativePlatform(),
    platform = Capacitor.getPlatform();
  const [deviceId, setDeviceId] = useState(savedDevice);
  const app = useQuery({
    queryKey: ["push-native-app"],
    queryFn: ({signal}) => readPushStatus(async () => (await App.getInfo()).id, signal),
    enabled: native,
    retry: false,
  });
  const permission = useQuery({
    queryKey: ["push-permission", userId],
    queryFn: ({signal}) => readPushStatus(async () => (await PushNotifications.checkPermissions()).receive, signal),
    enabled: native && !!userId,
    retry: false,
  });
  const config = useQuery({
    queryKey: ["push-configuration", userId],
    queryFn: ({signal}) => readPushStatus(requestSignal =>
      customFetch<{ android: boolean; ios: boolean }>(
        "/api/notification-devices/config", {signal:requestSignal},
      ), signal),
    enabled: native && !!userId,
    retry: false,
  });
  const status = useQuery({
    queryKey: ["push-registration", userId, deviceId],
    queryFn: ({signal}) => readPushStatus(requestSignal =>
      customFetch<{ registered: true; platform: string; appId: string }>(
        `/api/notification-devices/${deviceId}`, {signal:requestSignal},
      ), signal),
    enabled: native && !!userId && !!deviceId,
    retry: false,
    refetchOnMount: "always",
  });
  const enroll = useMutation({
    mutationFn: () => {
      if (!userId || !enrollment.current || enrollment.current.signal.aborted) throw new Error('Sign in before enrolling this device.');
      return registerPush({signal:enrollment.current.signal});
    },
    onSuccess: async () => {
      const id = savedDevice();
      setDeviceId(id);
      if (id === deviceId) await status.refetch();
    },
  });
  useEffect(() => {
    const controller = new AbortController(); enrollment.current=controller;
    enroll.reset();
    return () => { controller.abort(); if (enrollment.current===controller) enrollment.current=null; };
  },[userId,enroll.reset]);
  const disable = useMutation({
    mutationFn: unregisterPush,
    onSuccess: () => {
      setDeviceId(null);
      enroll.reset();
    },
  });
  if (!native)
    return (
      <section className="roco-card" aria-label="Notification delivery">
        <h2>Notification delivery</h2>
        <p>
          Updates appear in your in-app inbox. System push notifications require
          the Android or iOS app.
        </p>
      </section>
    );
  const configured =
    platform === "android"
      ? config.data?.android
      : platform === "ios"
        ? config.data?.ios
        : false;
  const registered =
    status.data?.registered &&
    status.data.platform === platform &&
    status.data.appId === app.data &&
    !status.isError;
  const absent = accountStatus(status.error) === 404;
  return (
    <section className="roco-card" aria-label="Notification delivery">
      <h2>Notification delivery</h2>
      <p>
        {permission.isPending
          ? "Checking device notification permission…"
          : permission.isError
            ? "Device notification permission could not be checked."
            : permission.data === "granted"
              ? "Device notification permission is granted."
              : permission.data === "denied"
                ? "Notifications are blocked in device settings. Allow notifications for this app, then refresh status."
                : "Device notification permission has not been granted."}
      </p>
      <button
        className="roco-button"
        disabled={
          config.isFetching || permission.isFetching || status.isFetching || app.isFetching
        }
        onClick={() => {
          void app.refetch();
          void config.refetch();
          void permission.refetch();
          if (deviceId) void status.refetch();
        }}
      >
        Refresh notification status
      </button>
      {app.isError && <p role="alert">App identity could not be checked. Refresh notification status before registering this device.</p>}
      {config.isPending ? (
        <p role="status">Checking push configuration…</p>
      ) : config.isError ? (
        <p role="alert">
          Push configuration could not be checked.{" "}
          <button className="roco-button" onClick={() => void config.refetch()}>
            Retry push configuration
          </button>
        </p>
      ) : !configured ? (
        <p role="status">
          Push delivery is not configured for this platform. In-app updates
          remain available; do not rely on background offer alerts yet.
        </p>
      ) : (
        <>
          <p role="status">
            {status.isFetching
              ? "Checking this device registration…"
              : registered
                ? "This device is registered to your current account for test push updates. Receipt has not been verified."
                : "This device registration is unconfirmed. Enable notifications to register it with your current account."}
          </p>
          {status.isError && !absent && (
            <p role="alert">
              Device registration could not be checked.{" "}
              <button
                className="roco-button"
                onClick={() => void status.refetch()}
              >
                Retry device registration
              </button>
            </p>
          )}
          <button
            className="roco-button primary"
            disabled={enroll.isPending || disable.isPending || app.isPending || app.isError}
            onClick={() => enroll.mutate()}
          >
            {enroll.isPending
              ? "Registering device…"
              : registered
                ? "Refresh mobile push registration"
                : "Enable mobile push notifications"}
          </button>
          {enroll.isSuccess && !deviceId && (
            <p role="status">
              Enrollment finished, but this server has not confirmed the device.
              Do not assume push delivery is working.
            </p>
          )}
        </>
      )}
      {(deviceId || hasLegacyRegistration() || disable.isError) && (
        <button
          className="roco-button"
          disabled={disable.isPending || enroll.isPending}
          onClick={() => disable.mutate()}
        >
          Disable push for this device
        </button>
      )}
      {disable.isSuccess && (
        <p role="status">Push registration removed for this device.</p>
      )}
      {(enroll.error || disable.error) && (
        <p role="alert">
          {disable.error
            ? "Could not confirm push removal. Retry before assuming this device is unregistered."
            : enroll.error?.message}
        </p>
      )}
      <p>
        Notification permission, server registration and actual delivery are
        separate checks. Background location notification permission does not
        enroll this device for delivery offers. Check the in-app inbox if alerts
        are unavailable.
      </p>
    </section>
  );
}
