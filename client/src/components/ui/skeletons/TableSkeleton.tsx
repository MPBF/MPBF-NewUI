import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  hasActions = true 
}: TableSkeletonProps) {
  return (
    <div className="w-full space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[150px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      
      {/* Table header skeleton */}
      <div className="border rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 bg-muted/5">
          {Array(columns).fill(0).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-5 w-full" />
          ))}
          {hasActions && <Skeleton className="h-5 w-20 ml-auto" />}
        </div>
        
        {/* Table rows skeleton */}
        <div className="divide-y">
          {Array(rows).fill(0).map((_, rowIndex) => (
            <div 
              key={`row-${rowIndex}`} 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"
            >
              {Array(columns).fill(0).map((_, colIndex) => (
                <Skeleton 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  className="h-5 w-full" 
                />
              ))}
              {hasActions && (
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-[100px]" />
        <div className="flex space-x-1">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={`page-${i}`} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}