import { createContext, useContext } from "react";
import type { ThemePresetKey } from "./presets";

export interface ThemePresetContextValue {
    preset: ThemePresetKey;
    setPreset: (preset: ThemePresetKey) => void;
}

export const ThemePresetContext = createContext<ThemePresetContextValue | null>(null);

export const useThemePreset = () => {
    const context = useContext(ThemePresetContext);
    if (!context) {
        throw new Error("useThemePreset must be used within a ThemePresetProvider");
    }
    return context;
};
