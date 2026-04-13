"use client";

import { useEffect } from "react";
import { subscribeToPushAction } from "../communication.actions";
import { PushPermissionVault } from "./PushPermissionVault";

/**
 * PushManager Component
 * Handles the registration of the Web Push subscription in the background.
 * It follows the "Thin Client" pattern by capturing user intention/permission 
 * and calling the Server Action to store the data.
 */
export function PushManager() {
    const registerPush = async () => {
        try {
            // Prevent execution on server or non-supported browsers
            if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
                return;
            }

            // Ensure service worker is ready
            const registration = await navigator.serviceWorker.ready;
            
            // Get current subscription
            let subscription = await registration.pushManager.getSubscription();
            
            // If no subscription, try to create one if permission is granted
            if (!subscription && Notification.permission === "granted") {
                const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                
                if (!publicKey) {
                    console.warn("[PushManager] NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing");
                    return;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                });
            }

            // If we have a subscription, sync it with our server
            if (subscription) {
                const json = subscription.toJSON();
                
                if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
                    await subscribeToPushAction({
                        endpoint: json.endpoint,
                        keys: {
                            p256dh: json.keys.p256dh,
                            auth: json.keys.auth,
                        }
                    });
                }
            }
        } catch (error) {
            console.error("[PushManager] Failed to register push subscription:", error);
        }
    };

    useEffect(() => {
        // We only auto-register if the user already granted permission.
        if (typeof window !== "undefined" && Notification.permission === "granted") {
            registerPush();
        }
    }, []);

    return <PushPermissionVault onGranted={registerPush} />;
}

/**
 * Helper to convert VAPID public key to required format for subscribe()
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
