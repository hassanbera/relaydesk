"use client";
import { ErrorState } from "@/components/common";
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="standalone-message">
      <ErrorState error={error} retry={reset} />
    </main>
  );
}
