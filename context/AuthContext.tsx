"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  role: string;
  onboarding: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  currentChoosed: string; 
  setCurrentChoosed: (val: string) => void;

};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentChoosed, setCurrentChoosed] = useState<string>("")

  useEffect(() => {
    try {
      const cookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("user-info="))
        ?.split("=")[1];

      if (cookie) {
        setUser(JSON.parse(decodeURIComponent(cookie)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, currentChoosed, setCurrentChoosed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};