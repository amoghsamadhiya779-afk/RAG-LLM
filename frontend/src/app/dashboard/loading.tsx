export default function DashboardLoading() {
  return (
    <div className="container-page py-10 min-h-[80vh] flex flex-col gap-8">
      <div>
        <div className="h-8 w-48 bg-surface rounded animate-pulse" />
        <div className="mt-2 h-4 w-96 bg-surface/50 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass-card h-[400px] animate-pulse" />
      </div>
    </div>
  );
}
