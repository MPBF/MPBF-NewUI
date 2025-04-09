import React from 'react';
import { useLanguage } from '../../utils/language';
import { containsArabic, getTextDirection, formatMixedContent } from '../../utils/arabic-text';

interface DirectionalTextProps {
  children: React.ReactNode;
  className?: string;
  forceDirection?: 'rtl' | 'ltr';
}

/**
 * A component that automatically sets the correct text direction
 * based on the content language
 */
export function DirectionalText({ 
  children, 
  className = '',
  forceDirection
}: DirectionalTextProps) {
  const { isRtl } = useLanguage();
  
  // If children is not a string, just render with current language direction
  if (typeof children !== 'string') {
    return (
      <span className={className} dir={isRtl ? 'rtl' : 'ltr'}>
        {children}
      </span>
    );
  }
  
  // Determine text direction based on content or forced direction
  const direction = forceDirection || getTextDirection(children);
  
  // Apply special formatting for mixed content
  const formattedContent = containsArabic(children) && !isRtl ? 
    formatMixedContent(children) : 
    children;
  
  return (
    <span 
      className={`${className} ${direction === 'rtl' ? 'rtl-text' : 'ltr-text'}`} 
      dir={direction}
    >
      {formattedContent}
    </span>
  );
}

/**
 * A component that ensures numbers are displayed correctly in both LTR and RTL contexts
 */
export function DirectionalNumber({ 
  value, 
  className = '' 
}: { 
  value: number | string; 
  className?: string 
}) {
  const { isRtl, formatNumber } = useLanguage();
  
  const displayValue = typeof value === 'number' ? 
    formatNumber(value) : 
    value;
  
  return (
    <span className={`force-ltr-numbers ${className}`} dir="ltr">
      {displayValue}
    </span>
  );
}
