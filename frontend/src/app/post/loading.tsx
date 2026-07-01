export default function PostLoading() {
  return (
    <div className="container-page py-10 min-h-dvh flex items-center justify-center">
      <div className="w-full max-w-3xl glass-card p-8 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded mb-8" />
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-surface rounded" />
            <div className="h-10 w-full bg-surface/50 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-surface rounded" />
            <div className="h-32 w-full bg-surface/50 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 w-full bg-surface/50 rounded" />
            <div className="h-10 w-full bg-surface/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
