"use client";
import { createContext, useContext, useState } from "react";

const SettingsContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
}>({ activeTab: "profile", setActiveTab: () => {} });

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("profile");
  return (
    <SettingsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SettingsContext.Provider>
  );
}