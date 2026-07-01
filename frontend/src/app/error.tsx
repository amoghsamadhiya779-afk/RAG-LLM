"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("App Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mb-8 text-muted-foreground">
        We encountered an unexpected error while rendering this page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
