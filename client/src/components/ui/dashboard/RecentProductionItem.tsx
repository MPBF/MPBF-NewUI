import { CalendarDays, Users, Package, Clock, MoreVertical, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/utils/language";

interface RecentProductionItemProps {
  jobOrderId: string;
  status: "completed" | "in-progress" | "pending";
  date: Date;
  customer: string;
  productCategory: string;
  operator: string;
}

export default function RecentProductionItem({ 
  jobOrderId, 
  status, 
  date, 
  customer, 
  productCategory, 
  operator 
}: RecentProductionItemProps) {
  // Status style mapping
  const statusStyles = {
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      borderColor: "border-green-200",
      icon: "text-green-500"
    },
    "in-progress": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      borderColor: "border-yellow-200",
      icon: "text-yellow-500"
    },
    pending: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      borderColor: "border-slate-200",
      icon: "text-slate-400"
    }
  };
  
  // Format date to string
  const formattedDate = format(date, "MMM d, yyyy");
  const formattedTime = format(date, "h:mm a");
  
  // Get RTL status
  const { isRtl, t } = useLanguage();
  
  // Get status style
  const currentStatus = statusStyles[status];
  
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-3 w-full"
    >
      <div className={`border rounded-xl ${currentStatus.borderColor} overflow-hidden bg-white hover:shadow-md transition-all duration-200 w-full`}>
        <div className={`flex px-4 py-3 items-center justify-between border-b border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-2 flex-row-reverse' : 'space-x-2'}`}>
            <div className={`w-2 h-2 rounded-full ${currentStatus.bg}`}></div>
            <h3 className="text-sm font-semibold text-slate-800">{jobOrderId}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center text-xs text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Clock className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
              {formattedTime}
            </div>
            <div className="cursor-pointer p-1 rounded-full hover:bg-slate-100">
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full ${currentStatus.bg} ${isRtl ? 'ml-3' : 'mr-3'}`}>
                <Users className={`h-4 w-4 ${currentStatus.icon}`} />
              </div>
              <div className={`flex flex-col ${isRtl ? 'items-end text-right' : ''}`}>
                <span className="text-xs text-slate-500">{isRtl ? 'العميل' : 'Customer'}</span>
                <span className="text-sm font-medium text-slate-800">{customer}</span>
              </div>
            </div>
            
            <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full ${currentStatus.bg} ${isRtl ? 'ml-3' : 'mr-3'}`}>
                <Package className={`h-4 w-4 ${currentStatus.icon}`} />
              </div>
              <div className={`flex flex-col ${isRtl ? 'items-end text-right' : ''}`}>
                <span className="text-xs text-slate-500">{isRtl ? 'المنتج' : 'Product'}</span>
                <span className="text-sm font-medium text-slate-800">{productCategory}</span>
              </div>
            </div>
            
            <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full ${currentStatus.bg} ${isRtl ? 'ml-3' : 'mr-3'}`}>
                <CalendarDays className={`h-4 w-4 ${currentStatus.icon}`} />
              </div>
              <div className={`flex flex-col ${isRtl ? 'items-end text-right' : ''}`}>
                <span className="text-xs text-slate-500">{isRtl ? 'المشغل' : 'Operator'}</span>
                <span className="text-sm font-medium text-slate-800">{operator}</span>
              </div>
            </div>
          </div>
          
          <div className={`mt-3 pt-3 border-t border-slate-100 flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
            <Link href={`/production/joborders/${jobOrderId.split('-')[1]}`}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`text-xs px-3 py-1 rounded-full ${currentStatus.bg} ${currentStatus.text} font-medium flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {isRtl ? (
                  <>
                    عرض التفاصيل
                    <ChevronLeft className="h-3 w-3 mr-1" />
                  </>
                ) : (
                  <>
                    View Details
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
