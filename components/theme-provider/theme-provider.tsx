"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

interface ThemeContextType {
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  autoRotate?: boolean;
  interval?: number;
}

export function ThemeProvider({
  children,
  autoRotate = true,
  interval = 6000,
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState("cat");

  useEffect(() => {
    if (!autoRotate) return;

    const themes = ["cat", "dragon", "snake"];
    let currentIndex = 0;

    const themeInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % themes.length;
      setCurrentTheme(themes[currentIndex]);
    }, interval);

    return () => clearInterval(themeInterval);
  }, [autoRotate, interval]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
