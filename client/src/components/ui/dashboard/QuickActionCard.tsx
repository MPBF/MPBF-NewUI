import { ReactNode } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/utils/language";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color?: string;
}

export default function QuickActionCard({ 
  title, 
  description, 
  icon, 
  href, 
  color = "teal" 
}: QuickActionCardProps) {
  // Define color variations
  const colorMappings = {
    blue: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      text: "text-blue-600",
      hover: "group-hover:bg-blue-100"
    },
    green: {
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      text: "text-green-600",
      hover: "group-hover:bg-green-100"
    },
    purple: {
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      text: "text-purple-600",
      hover: "group-hover:bg-purple-100"
    },
    amber: {
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      text: "text-amber-600",
      hover: "group-hover:bg-amber-100"
    },
    cyan: {
      bg: "bg-cyan-50",
      iconBg: "bg-cyan-100",
      text: "text-cyan-600",
      hover: "group-hover:bg-cyan-100"
    },
    teal: {
      bg: "bg-teal-50",
      iconBg: "bg-teal-100",
      text: "text-teal-600",
      hover: "group-hover:bg-teal-100"
    }
  };

  // Get RTL status
  const { isRtl } = useLanguage();
  
  const colorVariant = colorMappings[color as keyof typeof colorMappings] || colorMappings.teal;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="group w-full"
    >
      <Link href={href} className="focus:outline-none block w-full">
        <div className={`relative rounded-xl border border-gray-200 ${colorVariant.bg} px-5 py-4 shadow-sm transition-all duration-200 flex flex-col hover:shadow-md w-full`}>
          <div className={`flex items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 ${colorVariant.iconBg} rounded-full p-2 shadow-sm transition-all duration-200 ${colorVariant.hover}`}>
              {icon}
            </div>
            <motion.div 
              className={`${colorVariant.text} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
              initial={{ x: isRtl ? 5 : -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRtl ? 5 : -5, opacity: 0 }}
            >
              {isRtl ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </motion.div>
          </div>
          <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
            <h3 className={`text-base font-medium ${colorVariant.text} mb-1`}>{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
