import { useState, useEffect, useCallback } from "react";

export type WizardKey =
  | "student-profile"
  | "student-schedule"
  | "student-settings"
  | "student-placement"
  | "student-notebook"
  | "teacher-students"
  | "teacher-student-detail";

// Central dictionary mapping semantic keys to their legacy localStorage keys (for backward compatibility)
const LEGACY_KEYS: Record<WizardKey, string> = {
  "student-profile": "student-profile-wizard-seen",
  "student-schedule": "student-schedule-wizard-seen",
  "student-settings": "student-settings-wizard-seen",
  "student-placement": "student-placement-wizard-seen",
  "student-notebook": "student-notebook-wizard-seen",
  "teacher-students": "teacher-students-wizard-seen",
  "teacher-student-detail": "teacher-student-detail-wizard-seen",
};

const STORAGE_KEY = "fluency-lab-wizards-seen";

function getSeenMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
}

function setSeenMap(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save wizard seen state to localStorage", e);
  }
}

export function useWizard(key: WizardKey, delay = 500) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check central storage
    const seenMap = getSeenMap();
    let hasSeen = seenMap[key];

    // 2. Check legacy storage if not found in central storage
    if (hasSeen === undefined) {
      const legacyKey = LEGACY_KEYS[key];
      hasSeen = localStorage.getItem(legacyKey) === "true";
      
      // Migrate to new central map
      if (hasSeen) {
        seenMap[key] = true;
        setSeenMap(seenMap);
      }
    }

    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [key, delay]);

  const completeWizard = useCallback(() => {
    setIsOpen(false);
    if (typeof window === "undefined") return;

    // Mark as seen in central storage
    const seenMap = getSeenMap();
    seenMap[key] = true;
    setSeenMap(seenMap);

    // Also set legacy key just in case other parts of the code look for it directly
    localStorage.setItem(LEGACY_KEYS[key], "true");
  }, [key]);

  return {
    isOpen,
    setIsOpen,
    completeWizard,
  };
}
