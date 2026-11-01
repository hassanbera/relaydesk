"use client";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@relaydesk/contracts";
import { api, keys } from "@/lib/api";
export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: () => api<User>("/auth/me"),
    retry: false,
  });
}
