function Shimmer({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
  }
  
  // ─── Orders ───────────────────────────────────────────────────────────────────
  
  export function OrdersPageSkeleton() {
    return (
      <div className="flex gap-5 h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 space-y-3 overflow-hidden">
          <div className="flex gap-2 shrink-0">
            <Shimmer className="flex-1 h-9" />
            <Shimmer className="w-24 h-9" />
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="border-b border-border px-5 py-3.5 flex gap-6">
              {["w-20", "w-16", "w-14", "w-16", "w-24"].map((w, i) => (
                <Shimmer key={i} className={`h-3 ${w}`} />
              ))}
            </div>
            <div className="divide-y divide-border flex-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-6">
                  <div className="space-y-1.5 flex-shrink-0 w-28">
                    <Shimmer className="h-3.5 w-full" />
                    <Shimmer className="h-2.5 w-3/4" />
                  </div>
                  <Shimmer className="h-3 w-20 flex-shrink-0" />
                  <Shimmer className="h-5 w-16 rounded-full ml-auto flex-shrink-0" />
                  <Shimmer className="h-3 w-16 flex-shrink-0 hidden md:block" />
                  <Shimmer className="h-3 w-24 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // ─── POS ──────────────────────────────────────────────────────────────────────
  
  export function POSPageSkeleton() {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
          <div className="flex gap-2 shrink-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <Shimmer key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <Shimmer className="h-10 w-full shrink-0" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <Shimmer className="h-32 w-full rounded-none" />
                <div className="p-3 space-y-2">
                  <Shimmer className="h-3.5 w-3/4" />
                  <Shimmer className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-80 bg-card border-l border-border p-4 flex flex-col gap-3 shrink-0">
          <Shimmer className="h-6 w-24" />
          <div className="space-y-3 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="h-10 w-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-3 w-3/4" />
                  <Shimmer className="h-2.5 w-1/2" />
                </div>
                <Shimmer className="h-6 w-16 flex-shrink-0" />
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-4/5" />
            <Shimmer className="h-11 w-full rounded-xl mt-2" />
          </div>
        </div>
      </div>
    )
  }
  
  // ─── Dashboard ────────────────────────────────────────────────────────────────
  
  export function DashboardPageSkeleton() {
    return (
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-7 w-32" />
              <Shimmer className="h-2.5 w-20" />
            </div>
          ))}
        </div>
        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <Shimmer className="h-4 w-32 mb-5" />
          <Shimmer className="h-52 w-full" />
        </div>
        {/* Two-col charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-2xl p-5">
            <Shimmer className="h-4 w-28 mb-5" />
            <Shimmer className="h-40 w-full" />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <Shimmer className="h-4 w-28 mb-5" />
            <Shimmer className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }
  
  // ─── Kitchen ──────────────────────────────────────────────────────────────────
  
  export function KitchenPageSkeleton() {
    return (
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
            <Shimmer className="h-3 w-20" />
            <div className="space-y-2 border-t border-border pt-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Shimmer className="h-3 w-32" />
                  <Shimmer className="h-3 w-6" />
                </div>
              ))}
            </div>
            <Shimmer className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }
  
  // ─── Inventory ────────────────────────────────────────────────────────────────
  
  export function InventoryPageSkeleton() {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Shimmer className="flex-1 h-9" />
          <Shimmer className="w-28 h-9" />
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 flex gap-6">
            {["w-32", "w-16", "w-20", "w-20", "w-16"].map((w, i) => (
              <Shimmer key={i} className={`h-3 ${w}`} />
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-6">
                <Shimmer className="h-3.5 w-36 flex-shrink-0" />
                <Shimmer className="h-3 w-12 flex-shrink-0" />
                <Shimmer className="h-5 w-20 rounded-full flex-shrink-0" />
                <Shimmer className="h-3 w-16 flex-shrink-0 ml-auto" />
                <Shimmer className="h-3 w-16 flex-shrink-0" />
                <Shimmer className="h-7 w-20 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // ─── Menu ─────────────────────────────────────────────────────────────────────
  
  export function MenuPageSkeleton() {
    return (
      <div className="space-y-5">
        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-8 w-24 rounded-full" />
          ))}
          <Shimmer className="h-8 w-32 rounded-full ml-auto" />
        </div>
        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <Shimmer className="h-36 w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Shimmer className="h-3.5 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
                <div className="flex gap-2 pt-1">
                  <Shimmer className="h-6 flex-1 rounded-lg" />
                  <Shimmer className="h-6 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }