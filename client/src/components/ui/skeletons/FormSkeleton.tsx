import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  fields?: number;
  columns?: 1 | 2;
  hasButtons?: boolean;
}

export function FormSkeleton({ 
  fields = 6, 
  columns = 1,
  hasButtons = true 
}: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Form header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Form fields */}
      <div className={`grid ${columns === 2 ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'} space-y-4 md:space-y-0`}>
        {Array(fields).fill(0).map((_, i) => (
          <div key={`field-${i}`} className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      {/* Form buttons */}
      {hasButtons && (
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      )}
    </div>
  );
}