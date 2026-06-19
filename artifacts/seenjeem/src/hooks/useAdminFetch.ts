import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";
import { API_BASE } from "@/lib/apiBase";

export function useAdminFetch() {
  const { token } = useAuth();

  const adminFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options?.headers,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الخادم");
      return data;
    },
    [token]
  );

  return adminFetch;
}
