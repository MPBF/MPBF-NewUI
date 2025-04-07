import React from "react";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WasteDisplayProps {
  waste: number | null;
  percentage: number | null;
  stage?: "printing" | "cutting" | "total" | "job-order";
  minimal?: boolean;
  showIcon?: boolean;
}

export function WasteDisplay({ 
  waste, 
  percentage, 
  stage = "total", 
  minimal = false,
  showIcon = true
}: WasteDisplayProps) {
  // If we don't have waste data, don't render anything
  if (waste === null || percentage === null) {
    return null;
  }
  
  // Colors based on waste percentage
  const getColor = (percentage: number) => {
    if (percentage <= 5) return "bg-emerald-500 hover:bg-emerald-600";
    if (percentage <= 15) return "bg-yellow-500 hover:bg-yellow-600";
    if (percentage <= 30) return "bg-orange-500 hover:bg-orange-600";
    return "bg-red-500 hover:bg-red-600";
  };
  
  // Icon color based on waste percentage
  const getIconColor = (percentage: number) => {
    if (percentage <= 5) return "text-emerald-500";
    if (percentage <= 15) return "text-yellow-500";
    if (percentage <= 30) return "text-orange-500";
    return "text-red-500";
  };
  
  // Stage label
  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "printing":
        return "Printing";
      case "cutting":
        return "Cutting";
      case "total":
        return "Total";
      case "job-order":
        return "Job Order";
      default:
        return "";
    }
  };
  
  // Minimal display (just a badge with tooltip)
  if (minimal) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={getColor(percentage)}>
              {showIcon && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {waste.toFixed(2)} kg
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="font-medium">
            <p>{getStageLabel(stage)} waste: {waste.toFixed(2)} kg ({percentage.toFixed(2)}%)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Full display with stage label and waste info
  return (
    <div className="flex items-center">
      {showIcon && (
        <AlertCircle className={`h-4 w-4 mr-2 ${getIconColor(percentage)}`} />
      )}
      <span className="text-sm font-medium mr-2">
        {getStageLabel(stage)} Waste:
      </span>
      <Badge className={getColor(percentage)}>
        {waste.toFixed(2)} kg ({percentage.toFixed(2)}%)
      </Badge>
    </div>
  );
}