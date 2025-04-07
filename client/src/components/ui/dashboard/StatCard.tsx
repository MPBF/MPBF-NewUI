import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/utils/language";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  shadowColor?: string;
  trend?: number;
  trendLabel?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  shadowColor = "shadow-teal-200",
  trend,
  trendLabel
}: StatCardProps) {
  // Get RTL status
  const { isRtl } = useLanguage();
  
  // Determine if trend is positive, negative, or neutral
  const trendIsPositive = trend && trend > 0;
  const trendIsNegative = trend && trend < 0;
  const trendColor = trendIsPositive ? "text-green-500" : trendIsNegative ? "text-red-500" : "text-gray-500";
  
  return (
    <motion.div 
      className={`bg-white overflow-hidden border border-gray-100 shadow-sm hover:shadow-md rounded-2xl ${shadowColor} transition-all duration-300 w-full`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <div className="p-5">
        <div className="flex flex-col">
          <div className={`flex justify-between items-center mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`${iconBgColor} rounded-full p-3 shadow-sm`}>
              {icon}
            </div>
            {trend !== undefined && (
              <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${trendColor} text-xs font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {trendIsPositive && <ArrowUp className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />}
                  {trendIsNegative && <ArrowUp className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'} transform rotate-180`} />}
                  {Math.abs(trend)}%
                </div>
                {trendLabel && (
                  <span className={`${isRtl ? 'mr-1' : 'ml-1'} text-xs text-gray-500`}>{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          
          <div className={`space-y-1 ${isRtl ? 'text-right' : ''}`}>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm font-medium text-gray-500">{title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
