import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  type RunningAgentsDisplayMode,
  getStoredRunningAgentsDisplayMode,
  setStoredRunningAgentsDisplayMode,
} from "../lib/displayPrefs";

interface DisplayPreferencesContextValue {
  runningAgentsDisplayMode: RunningAgentsDisplayMode;
  setRunningAgentsDisplayMode: (mode: RunningAgentsDisplayMode) => void;
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null);

export function useDisplayPreferences(): DisplayPreferencesContextValue {
  const ctx = useContext(DisplayPreferencesContext);
  if (!ctx) throw new Error("useDisplayPreferences must be used within DisplayPreferencesProvider");
  return ctx;
}

interface DisplayPreferencesProviderProps {
  children: ReactNode;
}

export function DisplayPreferencesProvider({ children }: DisplayPreferencesProviderProps) {
  const [runningAgentsDisplayMode, setModeState] = useState<RunningAgentsDisplayMode>("count");

  useEffect(() => {
    setModeState(getStoredRunningAgentsDisplayMode());
  }, []);

  const setRunningAgentsDisplayMode = useCallback((mode: RunningAgentsDisplayMode) => {
    setStoredRunningAgentsDisplayMode(mode);
    setModeState(mode);
  }, []);

  const value: DisplayPreferencesContextValue = {
    runningAgentsDisplayMode,
    setRunningAgentsDisplayMode,
  };

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
    </DisplayPreferencesContext.Provider>
  );
}
