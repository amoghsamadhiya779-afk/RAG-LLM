import { useRouter, useCanGoBack } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallback?: string;
  label?: string;
  className?: string;
}

export function BackButton({ fallback = "/", label = "Back", className }: BackButtonProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const onBack = () => {
    if (canGoBack) router.history.back();
    else router.navigate({ to: fallback });
  };

  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-border hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
