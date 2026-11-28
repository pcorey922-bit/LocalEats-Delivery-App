import apps from "../../../../config/native-audiences.json";
export const nativePushAppIds = [
  apps.customer.id,
  `${apps.customer.id}.staging`,
  apps.driver.id,
  `${apps.driver.id}.staging`,
] as const;
export function nativePushTopic(appId: string) {
  if (!nativePushAppIds.includes(appId))
    throw Error("Unsupported native push app identity");
  return appId;
}
