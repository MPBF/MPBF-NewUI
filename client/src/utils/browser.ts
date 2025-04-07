/**
 * Browser detection and responsive layout utilities
 */

/**
 * Detect the browser type
 * @returns The browser name or 'unknown'
 */
export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.indexOf('edge') > -1) return 'edge';
  if (userAgent.indexOf('edg') > -1) return 'edge-chromium';
  if (userAgent.indexOf('opr') > -1 || userAgent.indexOf('opera') > -1) return 'opera';
  if (userAgent.indexOf('chrome') > -1) return 'chrome';
  if (userAgent.indexOf('safari') > -1) return 'safari';
  if (userAgent.indexOf('firefox') > -1) return 'firefox';
  if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) return 'ie';
  
  return 'unknown';
}

/**
 * Check if the user is on a mobile device
 * @returns True if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
}

/**
 * Check if the user is on a tablet device
 * @returns True if the user is on a tablet device
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
}

/**
 * Get the device type based on user agent and screen size
 * @returns The device type: 'mobile', 'tablet', or 'desktop'
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  // Check by user agent first
  if (isMobileDevice() && !isTabletDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  
  // Fallback to screen size detection
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  
  return 'desktop';
}

/**
 * Apply browser-specific CSS classes to the document body
 * This helps target specific browser issues with CSS
 */
export function applyBrowserClasses(): void {
  if (typeof document === 'undefined') return;
  
  const browser = detectBrowser();
  const deviceType = getDeviceType();
  
  // Remove any existing browser classes
  document.body.classList.remove(
    'browser-chrome', 
    'browser-firefox', 
    'browser-safari', 
    'browser-edge',
    'browser-ie',
    'browser-opera',
    'device-mobile',
    'device-tablet',
    'device-desktop'
  );
  
  // Add current browser class
  document.body.classList.add(`browser-${browser}`);
  
  // Add device type class
  document.body.classList.add(`device-${deviceType}`);
}

/**
 * Initialize browser detection and apply appropriate classes
 * Call this once when the application loads
 */
export function initBrowserDetection(): void {
  applyBrowserClasses();
  
  // Update classes on resize
  if (typeof window !== 'undefined') {
    let resizeTimer: ReturnType<typeof setTimeout>;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        applyBrowserClasses();
      }, 250);
    });
  }
}