import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Dashboard title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={`stat-${i}`} className="p-4 border rounded-lg shadow-sm">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      
      {/* Recent activities */}
      <div className="border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-[200px]" />
        </div>
        <div className="divide-y">
          {Array(5).fill(0).map((_, i) => (
            <div key={`activity-${i}`} className="p-4 flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-full max-w-[300px]" />
              </div>
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}