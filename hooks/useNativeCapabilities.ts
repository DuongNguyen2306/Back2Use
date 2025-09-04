// hooks/useNativeCapabilities.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

// 👉 Import types từ file build để khớp version expo-notifications bạn đang dùng
import type {
    NotificationBehavior,
    NotificationTriggerInput,
    TimeIntervalTriggerInput,
} from "expo-notifications/build/Notifications.types";

type CamPerm = "granted" | "denied" | "undetermined";

// Handler đúng kiểu NotificationBehavior (SDK mới yêu cầu 5 field)
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureNotifPerm() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  }
  return true;
}

export function useNativeCapabilities() {
  const [isNative] = useState<boolean>(Platform.OS !== "web");
  const [cameraPermission, setCameraPermission] = useState<CamPerm>("undetermined");

  useEffect(() => {
    // Camera permission: xin trực tiếp ở component scanner (expo-camera)
    setCameraPermission("undetermined");
    ensureNotifPerm().catch(() => {});
  }, []);

  const requestPermissions = async () => {
    // Nếu cần, xin quyền camera ở component bằng useCameraPermissions()
    await ensureNotifPerm();
  };

  // Không dùng chụp ảnh ở hook này (để tránh thêm dependency)
  const takePicture = async (): Promise<string | null> => null;
  const scanQRCode  = async (): Promise<string | null> => null;

  const scheduleNotification = async (title: string, body: string, delayMs = 0) => {
    const ok = await ensureNotifPerm();
    if (!ok) return;

    let trigger: NotificationTriggerInput = null;

    if (delayMs > 0) {
      const seconds = Math.max(1, Math.ceil(delayMs / 1000));
      // Một số phiên bản expo-notifications yêu cầu enum cho "type".
      // Để tránh xung đột type giữa các version, ta cast an toàn:
      const timeTrigger = {
        type: "timeInterval",
        seconds,
        repeats: false,
      } as unknown as TimeIntervalTriggerInput;

      trigger = timeTrigger as unknown as NotificationTriggerInput;
    }

    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger,
    });
  };

  const storeData = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  };
  const getData = async (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key);
  };
  const removeData = async (key: string) => {
    await AsyncStorage.removeItem(key);
  };

  return {
    isNative,
    cameraPermission,
    takePicture,
    scanQRCode,
    scheduleNotification,
    storeData,
    getData,
    removeData,
    requestPermissions,
  };
}
