export default function Loading() {
  return (
    <div className="container-page py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
