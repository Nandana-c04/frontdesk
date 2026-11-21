"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserInfo } from "@/types";

type UserContextType = {
  currentUser: UserInfo | null;
  users: UserInfo[];
  setCurrentUser: (user: UserInfo) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  setCurrentUser: () => {},
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: UserInfo[]) => {
        setUsers(data);
        // Default to the first agent
        const defaultUser = data.find((u) => u.role === "AGENT") ?? data[0];
        if (defaultUser) setCurrentUser(defaultUser);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, users, setCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

