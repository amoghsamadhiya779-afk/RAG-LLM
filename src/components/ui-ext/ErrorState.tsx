import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";

export function ErrorState({
  error,
  onRetry,
  className,
  title = "Something went wrong",
}: {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
  title?: string;
}) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unknown error";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <AlertTriangle className="mb-3 h-6 w-6 text-destructive" />
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      ) : null}
    </div>
  );
}
