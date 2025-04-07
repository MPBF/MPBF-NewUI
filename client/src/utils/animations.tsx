import { MotionProps } from "framer-motion";

// Fade in animation for elements appearing on the page
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

// Scale up animation for elements appearing on the page
export const scaleUp = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

// Animation for items in a list (staggered entrance)
export const listItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: "spring", stiffness: 400, damping: 40 }
};

// Animation for sidebar items
export const sidebarItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

// Hover animation for cards
export const cardHoverProps: MotionProps = {
  whileHover: { 
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  whileTap: { scale: 0.98 }
};

// Button press animation
export const buttonTapProps: MotionProps = {
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 500, damping: 30 }
};

// Slide in from right animation (for modals/dialogs)
export const slideFromRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

// Slide in from left animation
export const slideFromLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

// Slide in from bottom animation (for drawers/bottom sheets)
export const slideFromBottom = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

// Staggered container animation for list items
export const staggeredContainer = (staggerChildren = 0.05) => ({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren
    }
  },
  exit: { opacity: 0 }
});

// Pulse animation (for notifications/badges)
export const pulse = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

// Subtle hover animation for interactive elements
export const subtleHoverProps: MotionProps = {
  whileHover: { 
    scale: 1.03,
    transition: { duration: 0.2 }
  }
};

// Page transition animation
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 }
};