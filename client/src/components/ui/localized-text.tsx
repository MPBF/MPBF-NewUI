import React from 'react';
import { useLanguage } from '../../utils/language';

interface LocalizedTextProps {
  en: string;
  ar: string;
  className?: string;
}

/**
 * A component that displays text in the current language
 * Automatically switches between English and Arabic based on the current language setting
 */
export function LocalizedText({ en, ar, className = '' }: LocalizedTextProps) {
  const { language, isRtl } = useLanguage();
  
  return (
    <span className={`bidi-isolate ${className}`}>
      {language === 'arabic' ? ar : en}
    </span>
  );
}

/**
 * A component that displays a number formatted according to the current language
 */
export function LocalizedNumber({ value, className = '' }: { value: number; className?: string }) {
  const { formatNumber } = useLanguage();
  
  return (
    <span className={`force-ltr-numbers ${className}`}>
      {formatNumber(value)}
    </span>
  );
}

/**
 * A component that displays a date formatted according to the current language
 */
export function LocalizedDate({ value, className = '' }: { value: Date | string; className?: string }) {
  const { formatDate } = useLanguage();
  
  return (
    <span className={className}>
      {formatDate(value)}
    </span>
  );
}

/**
 * A component that displays currency formatted according to the current language
 */
export function LocalizedCurrency({ 
  value, 
  currency = 'SAR',
  className = '' 
}: { 
  value: number; 
  currency?: string;
  className?: string 
}) {
  const { formatCurrency } = useLanguage();
  
  return (
    <span className={`force-ltr-numbers ${className}`}>
      {formatCurrency(value, currency)}
    </span>
  );
}
