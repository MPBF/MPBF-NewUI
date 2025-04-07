import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Button, ButtonProps } from "./button";
import { buttonTapProps } from "../../utils/animations";

interface AnimatedButtonProps extends ButtonProps {
  withHoverScale?: boolean;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, withHoverScale = true, children, ...props }, ref) => {
    return (
      <motion.div
        {...buttonTapProps}
        whileHover={withHoverScale ? { scale: 1.02 } : undefined}
      >
        <Button ref={ref} className={className} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };