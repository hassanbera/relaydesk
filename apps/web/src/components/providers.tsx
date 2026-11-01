"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
const ClockContext = createContext(0);
export const useClock = () => useContext(ClockContext);
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: (count, error) =>
              !(error instanceof ApiError && error.status < 500) && count < 1,
            refetchOnWindowFocus: true,
          },
          mutations: { retry: false },
        },
      }),
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const expired = () => {
      client.clear();
      window.location.assign("/login");
    };
    window.addEventListener("relaydesk:unauthorized", expired);
    return () => {
      clearInterval(timer);
      window.removeEventListener("relaydesk:unauthorized", expired);
    };
  }, [client]);
  return (
    <QueryClientProvider client={client}>
      <ClockContext.Provider value={now}>{children}</ClockContext.Provider>
    </QueryClientProvider>
  );
}
