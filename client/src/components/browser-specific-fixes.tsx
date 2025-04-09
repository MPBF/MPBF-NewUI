import React from 'react';
import { useLanguage } from '../utils/language';
import { getBrowserInfo } from '../utils/browser';

export function BrowserSpecificFixes() {
  const { isRtl } = useLanguage();
  const browserInfo = getBrowserInfo();
  
  // Apply browser-specific CSS classes to the body element
  React.useEffect(() => {
    // Add browser-specific classes
    document.body.classList.add(`browser-${browserInfo.browser.toLowerCase()}`);
    document.body.classList.add(`os-${browserInfo.os.toLowerCase().replace(/\s+/g, '-')}`);
    
    if (browserInfo.isMobile) {
      document.body.classList.add('touch-device');
    }
    
    if (browserInfo.isTablet) {
      document.body.classList.add('tablet-device');
    }
    
    // Apply specific fixes for known browser issues
    if (browserInfo.browser === 'Safari') {
      document.body.classList.add('safari-fixes');
      
      // Safari has issues with flexbox in RTL mode
      if (isRtl) {
        document.body.classList.add('safari-rtl-fixes');
      }
    }
    
    if (browserInfo.browser === 'Firefox') {
      document.body.classList.add('firefox-fixes');
      
      // Firefox has issues with RTL text alignment
      if (isRtl) {
        document.body.classList.add('firefox-rtl-fixes');
      }
    }
    
    if (browserInfo.browser === 'Edge') {
      document.body.classList.add('edge-fixes');
    }
    
    if (browserInfo.browser === 'IE') {
      document.body.classList.add('ie-fixes');
      // Add polyfill script for IE if needed
      if (!window.fetch) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.min.js';
        document.head.appendChild(script);
      }
    }
    
    // Clean up function
    return () => {
      document.body.classList.remove(`browser-${browserInfo.browser.toLowerCase()}`);
      document.body.classList.remove(`os-${browserInfo.os.toLowerCase().replace(/\s+/g, '-')}`);
      document.body.classList.remove('touch-device');
      document.body.classList.remove('tablet-device');
      document.body.classList.remove('safari-fixes');
      document.body.classList.remove('safari-rtl-fixes');
      document.body.classList.remove('firefox-fixes');
      document.body.classList.remove('firefox-rtl-fixes');
      document.body.classList.remove('edge-fixes');
      document.body.classList.remove('ie-fixes');
    };
  }, [browserInfo, isRtl]);
  
  // This component doesn't render anything visible
  return null;
}
