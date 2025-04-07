import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Card } from "./card";
import { cardHoverProps } from "../../utils/animations";

interface AnimatedCardProps {
  className?: string;
  children?: React.ReactNode;
  motionProps?: HTMLMotionProps<"div">;
  interactive?: boolean;
  [key: string]: any; // For any additional Card props
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, motionProps, interactive = true, children, ...props }, ref) => {
    return (
      <motion.div
        {...(interactive ? cardHoverProps : {})}
        {...motionProps}
        style={{ transformOrigin: "center" }}
      >
        <Card ref={ref} className={className} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };