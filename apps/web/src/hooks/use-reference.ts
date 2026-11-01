"use client";
import { useQuery } from "@tanstack/react-query";
import { api, keys } from "@/lib/api";
import type { Reference } from "@/lib/types";
export function useReference() {
  return useQuery({
    queryKey: keys.reference,
    queryFn: () => api<Reference>("/reference"),
    staleTime: 60000,
  });
}
