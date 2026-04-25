"use client";

import { useState, useEffect } from "react";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const syncPermission = () => {
        setPermission((prev) => {
          if (Notification.permission !== prev) {
            return Notification.permission;
          }
          return prev;
        });
      };

      syncPermission();
      const interval = setInterval(syncPermission, 2000);
      return () => clearInterval(interval);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return "denied";
  };

  return {
    permission,
    requestPermission,
  };
}
