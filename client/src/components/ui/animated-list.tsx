import React from "react";
import { motion, Variants } from "framer-motion";
import { staggeredContainer, listItem } from "../../utils/animations";

interface AnimatedListProps {
  children: React.ReactNode;
  delay?: number; // Delay between each item in seconds
  className?: string;
  itemVariants?: Variants;
  containerVariants?: Variants;
}

export function AnimatedList({
  children,
  delay = 0.05,
  className = "",
  itemVariants = listItem,
  containerVariants = staggeredContainer(delay),
}: AnimatedListProps) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.li
          key={index}
          variants={itemVariants}
          style={{ listStyle: "none" }}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function AnimatedListItem({
  children,
  delay = 0,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.li
      variants={listItem}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
      style={{ listStyle: "none" }}
    >
      {children}
    </motion.li>
  );
}