import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/utils/language';

export interface Stage {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  description?: string;
}

export interface WorkflowVisualizationProps {
  stages: Stage[];
  animationDuration?: number;
  showLabels?: boolean;
  interactive?: boolean;
  direction?: 'horizontal' | 'vertical';
  onStageClick?: (stage: Stage) => void;
  className?: string;
}

export function WorkflowVisualization({
  stages,
  animationDuration = 0.5,
  showLabels = true,
  interactive = false,
  direction = 'horizontal',
  onStageClick,
  className
}: WorkflowVisualizationProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [activeStage, setActiveStage] = useState<string | null>(null);
  
  const isHorizontal = direction === 'horizontal';
  
  const getStatusColor = (status: Stage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-300';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getLineColor = (index: number) => {
    // If all previous stages are completed, the line should be colored
    const allPreviousCompleted = stages
      .slice(0, index)
      .every(stage => stage.status === 'completed' || stage.status === 'in-progress');
    
    if (allPreviousCompleted) {
      if (stages[index].status === 'in-progress') {
        return 'bg-gradient-to-r from-blue-500 to-gray-300';
      } else if (stages[index].status === 'completed') {
        return 'bg-green-500';
      } else {
        return 'bg-gray-300';
      }
    }
    
    return 'bg-gray-300';
  };
  
  const handleStageClick = (stage: Stage) => {
    if (interactive) {
      setActiveStage(activeStage === stage.id ? null : stage.id);
      
      if (onStageClick) {
        onStageClick(stage);
      } else {
        // Default behavior - show toast with stage info
        toast({
          title: stage.label,
          description: stage.description || 
            (language === 'english' 
              ? `Status: ${stage.status}` 
              : `الحالة: ${
                stage.status === 'completed' ? 'مكتمل' : 
                stage.status === 'in-progress' ? 'قيد التنفيذ' : 
                stage.status === 'failed' ? 'فشل' : 'معلق'
              }`),
          variant: 'default',
        });
      }
    }
  };
  
  const stageVariants = {
    initial: {
      scale: 0,
      opacity: 0,
    },
    animate: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: animationDuration * 0.5,
        ease: 'easeOut',
      },
    }),
  };
  
  const lineVariants = {
    initial: {
      scaleX: isHorizontal ? 0 : 1,
      scaleY: isHorizontal ? 1 : 0,
      opacity: 0,
    },
    animate: (i: number) => ({
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1 + animationDuration * 0.25,
        duration: animationDuration * 0.5,
        ease: 'easeOut',
      },
    }),
  };
  
  const labelVariants = {
    initial: {
      y: 10,
      opacity: 0,
    },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1 + animationDuration * 0.5,
        duration: animationDuration * 0.25,
        ease: 'easeOut',
      },
    }),
  };
  
  return (
    <div className={cn(
      'workflow-visualization',
      isHorizontal ? 'flex flex-col' : 'flex',
      className
    )}>
      <div className={cn(
        'workflow-stages relative',
        isHorizontal ? 'flex items-center justify-between w-full' : 'flex flex-col items-center justify-between h-full'
      )}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            {/* Stage */}
            <div className={cn(
              'workflow-stage relative flex flex-col items-center',
              interactive && 'cursor-pointer',
              isHorizontal ? 'pb-10' : 'pr-10'
            )}>
              <motion.div
                className={cn(
                  'rounded-full border-2 border-white shadow-md w-12 h-12 flex items-center justify-center z-10',
                  getStatusColor(stage.status),
                  activeStage === stage.id && 'ring-2 ring-offset-2 ring-blue-400'
                )}
                variants={stageVariants}
                initial="initial"
                animate="animate"
                custom={index}
                onClick={() => handleStageClick(stage)}
                whileHover={interactive ? { scale: 1.1 } : {}}
                whileTap={interactive ? { scale: 0.95 } : {}}
              >
                {stage.status === 'completed' && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {stage.status === 'in-progress' && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-white animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                  </svg>
                )}
                {stage.status === 'failed' && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-white"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                )}
              </motion.div>
              
              {/* Label */}
              {showLabels && (
                <motion.div
                  className={cn(
                    'mt-2 text-center whitespace-nowrap',
                    isHorizontal ? 'absolute bottom-0' : 'absolute right-0'
                  )}
                  variants={labelVariants}
                  initial="initial"
                  animate="animate"
                  custom={index}
                >
                  <div className="font-medium">{stage.label}</div>
                  <StatusBadge status={stage.status} size="sm" />
                </motion.div>
              )}
            </div>
            
            {/* Connector Line */}
            {index < stages.length - 1 && (
              <motion.div
                className={cn(
                  'z-0',
                  isHorizontal 
                    ? 'h-1 flex-grow mx-1' 
                    : 'w-1 flex-grow my-1',
                  getLineColor(index + 1),
                )}
                variants={lineVariants}
                initial="initial"
                animate="animate"
                custom={index}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}