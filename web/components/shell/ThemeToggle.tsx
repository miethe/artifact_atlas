"use client";

/**
 * ThemeToggle — light/dark/system switcher (DM-4).
 * Only mounted by TopBar when the `dark-mode` flag is on. Persists the
 * preference to localStorage and updates `data-theme` on <html> live,
 * including reacting to OS-level changes while "system" is selected.
 */

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl, type SegmentOption } from "@/components/ui";
import {
  applyTheme,
  getStoredThemePreference,
  resolveTheme,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: SegmentOption<ThemePreference>[] = [
  { value: "light", label: "Light", ariaLabel: "Light theme", icon: <Sun className="w-3.5 h-3.5" /> },
  { value: "dark", label: "Dark", ariaLabel: "Dark theme", icon: <Moon className="w-3.5 h-3.5" /> },
  { value: "system", label: "System", ariaLabel: "Match system theme", icon: <Monitor className="w-3.5 h-3.5" /> },
];

export function ThemeToggle() {
  const [pref, setPref] = React.useState<ThemePreference>("system");

  React.useEffect(() => {
    setPref(getStoredThemePreference());
  }, []);

  React.useEffect(() => {
    if (pref !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.dataset.theme = resolveTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [pref]);

  function handleChange(next: ThemePreference) {
    setPref(next);
    applyTheme(next);
  }

  return (
    <SegmentedControl<ThemePreference>
      value={pref}
      onChange={handleChange}
      options={OPTIONS}
      size="xs"
      iconOnly
      label="Theme"
    />
  );
}
