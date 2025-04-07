import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/utils/language';

type StatusType = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const { language } = useLanguage();
  
  const getStatusClasses = (status: StatusType) => {
    switch(status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'in-progress':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'pending':
        return 'bg-gray-400 hover:bg-gray-500';
      case 'failed':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };
  
  const getStatusLabel = (status: StatusType) => {
    if (language === 'english') {
      switch(status) {
        case 'completed':
          return 'Completed';
        case 'in-progress':
          return 'In Progress';
        case 'pending':
          return 'Pending';
        case 'failed':
          return 'Failed';
        default:
          return 'Unknown';
      }
    } else {
      // Arabic
      switch(status) {
        case 'completed':
          return 'مكتمل';
        case 'in-progress':
          return 'قيد التنفيذ';
        case 'pending':
          return 'معلق';
        case 'failed':
          return 'فشل';
        default:
          return 'غير معروف';
      }
    }
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };
  
  return (
    <Badge 
      className={cn(
        getStatusClasses(status),
        sizeClasses[size],
        'font-medium border-0',
        className
      )}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}