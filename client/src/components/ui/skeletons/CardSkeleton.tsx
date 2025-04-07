import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  header?: boolean;
  footer?: boolean;
  rows?: number;
}

export function CardSkeleton({ 
  header = true, 
  footer = true,
  rows = 4 
}: CardSkeletonProps) {
  return (
    <div className="border rounded-lg shadow-sm">
      {header && (
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-[250px]" />
        </div>
      )}
      <div className="p-4 space-y-4">
        {Array(rows).fill(0).map((_, i) => (
          <div key={`row-${i}`} className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {footer && (
        <div className="p-4 border-t flex justify-end space-x-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      )}
    </div>
  );
}