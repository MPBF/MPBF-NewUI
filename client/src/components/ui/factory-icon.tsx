import React from "react";
import { Logo } from "./logo";

interface FactoryIconProps {
  size?: "small" | "medium" | "large" | "extra-large";
  className?: string;
}

export function FactoryIcon({ size = "medium", className = "" }: FactoryIconProps) {
  // Use the Logo component with a stylish container around it
  return (
    <div className={`${className} relative`}>
      <div className="absolute inset-0 bg-blue-300 rounded-full blur-xl opacity-30 animate-pulse"></div>
      <div className="relative bg-white rounded-full p-3 shadow-lg">
        <Logo size={size} />
      </div>
    </div>
  );
}