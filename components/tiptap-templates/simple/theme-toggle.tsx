"use client"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"
import { useEffect, useState, useSyncExternalStore } from "react"

export function ThemeToggle() {
  const isDarkMode = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", callback)
      return () => mediaQuery.removeEventListener("change", callback)
    },
    () =>
      !!document.querySelector('meta[name="color-scheme"][content="dark"]') ||
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  )

  const [localIsDarkMode, setLocalIsDarkMode] = useState<boolean | null>(null)
  const activeDarkMode = localIsDarkMode ?? isDarkMode

  useEffect(() => {
    document.documentElement.classList.toggle("dark", activeDarkMode)
  }, [activeDarkMode])

  const toggleDarkMode = () => setLocalIsDarkMode(!activeDarkMode)

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${activeDarkMode ? "light" : "dark"} mode`}
      variant="ghost"
    >
      {activeDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
