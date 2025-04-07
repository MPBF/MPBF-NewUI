import React from "react";

interface LogoProps {
  size?: "small" | "medium" | "large" | "extra-large";
  className?: string;
}

export function Logo({ size = "medium", className = "" }: LogoProps) {
  const sizesMap = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16",
    "extra-large": "h-32 w-32",
  };

  const sizeClass = sizesMap[size];

  return (
    <div className={`${className} flex items-center`}>
      <img 
        src="/FactoryLogoHPNGWg.png" 
        alt="Modern Plastic Bag Factory Logo" 
        className={`${sizeClass} object-contain`} 
        onError={(e) => {
          // Fallback to the static assets directory if the image fails to load
          const target = e.target as HTMLImageElement;
          target.src = "/attached_assets/FactoryLogoHPNGWg.png";
        }}
      />
    </div>
  );
}