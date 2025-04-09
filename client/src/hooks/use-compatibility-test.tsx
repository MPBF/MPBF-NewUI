/**
 * Browser compatibility testing utility
 * Tests the application across different browsers and devices
 */

import { useEffect, useState } from 'react';
import { getBrowserInfo } from '../utils/browser';

// Define the browsers we want to test
const BROWSERS_TO_TEST = [
  'chrome',
  'firefox',
  'safari',
  'edge',
  'opera',
  'samsung',
  'ie'
];

// Define the devices we want to test
const DEVICES_TO_TEST = [
  'desktop',
  'tablet',
  'mobile'
];

// Define the features we want to test
const FEATURES_TO_TEST = [
  'flexbox',
  'grid',
  'css-variables',
  'object-fit',
  'position-sticky',
  'webp',
  'touch-events',
  'pointer-events',
  'intersection-observer',
  'resize-observer',
  'rtl-support'
];

export interface CompatibilityTestResult {
  browser: string;
  browserVersion: string;
  device: string;
  os: string;
  features: Record<string, boolean>;
  rtlSupport: boolean;
  touchSupport: boolean;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  timestamp: string;
}

/**
 * Hook to test browser compatibility
 * @returns The compatibility test results
 */
export function useCompatibilityTest() {
  const [results, setResults] = useState<CompatibilityTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runTests = async () => {
      try {
        setIsLoading(true);
        
        // Get browser info
        const browserInfo = getBrowserInfo();
        
        // Test features
        const featureResults: Record<string, boolean> = {};
        
        // Test flexbox support
        featureResults['flexbox'] = CSS.supports('display', 'flex');
        
        // Test grid support
        featureResults['grid'] = CSS.supports('display', 'grid');
        
        // Test CSS variables support
        featureResults['css-variables'] = CSS.supports('--test', '0');
        
        // Test object-fit support
        featureResults['object-fit'] = CSS.supports('object-fit', 'cover');
        
        // Test position: sticky support
        featureResults['position-sticky'] = CSS.supports('position', 'sticky');
        
        // Test WebP support
        const webpSupport = await testWebPSupport();
        featureResults['webp'] = webpSupport;
        
        // Test touch events
        featureResults['touch-events'] = 'ontouchstart' in window;
        
        // Test pointer events
        featureResults['pointer-events'] = CSS.supports('pointer-events', 'none');
        
        // Test Intersection Observer
        featureResults['intersection-observer'] = 'IntersectionObserver' in window;
        
        // Test Resize Observer
        featureResults['resize-observer'] = 'ResizeObserver' in window;
        
        // Test RTL support
        featureResults['rtl-support'] = testRTLSupport();
        
        // Compile results
        const testResults: CompatibilityTestResult = {
          browser: browserInfo.browser,
          browserVersion: browserInfo.version,
          device: browserInfo.isMobile ? 'mobile' : (browserInfo.isTablet ? 'tablet' : 'desktop'),
          os: browserInfo.os,
          features: featureResults,
          rtlSupport: featureResults['rtl-support'],
          touchSupport: featureResults['touch-events'],
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio || 1,
          timestamp: new Date().toISOString()
        };
        
        setResults(testResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error during compatibility testing');
      } finally {
        setIsLoading(false);
      }
    };
    
    runTests();
  }, []);
  
  return { results, isLoading, error };
}

/**
 * Test WebP support
 * @returns Promise that resolves to true if WebP is supported, false otherwise
 */
function testWebPSupport(): Promise<boolean> {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = () => resolve(true);
    webP.onerror = () => resolve(false);
    webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * Test RTL support
 * @returns True if RTL is supported, false otherwise
 */
function testRTLSupport(): boolean {
  // Create a test element
  const testEl = document.createElement('div');
  testEl.style.position = 'absolute';
  testEl.style.visibility = 'hidden';
  testEl.style.width = '10px';
  testEl.style.height = '10px';
  testEl.dir = 'rtl';
  
  // Append to body
  document.body.appendChild(testEl);
  
  // Test if RTL properties are applied correctly
  const computedStyle = window.getComputedStyle(testEl);
  const hasRTLSupport = computedStyle.direction === 'rtl';
  
  // Clean up
  document.body.removeChild(testEl);
  
  return hasRTLSupport;
}

/**
 * Component to display compatibility test results
 */
export function CompatibilityTestResults({ results }: { results: CompatibilityTestResult | null }) {
  if (!results) {
    return <div>No compatibility test results available</div>;
  }
  
  return (
    <div className="compatibility-test-results">
      <h2>Browser Compatibility Test Results</h2>
      
      <div className="result-section">
        <h3>Browser Information</h3>
        <ul>
          <li><strong>Browser:</strong> {results.browser} {results.browserVersion}</li>
          <li><strong>Device Type:</strong> {results.device}</li>
          <li><strong>Operating System:</strong> {results.os}</li>
          <li><strong>Viewport:</strong> {results.viewportWidth}x{results.viewportHeight} (Pixel Ratio: {results.pixelRatio})</li>
        </ul>
      </div>
      
      <div className="result-section">
        <h3>Feature Support</h3>
        <ul>
          {Object.entries(results.features).map(([feature, supported]) => (
            <li key={feature}>
              <strong>{feature}:</strong> {supported ? '✅ Supported' : '❌ Not Supported'}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="result-section">
        <h3>Critical Features</h3>
        <ul>
          <li>
            <strong>RTL Support:</strong> {results.rtlSupport ? '✅ Supported' : '❌ Not Supported'}
          </li>
          <li>
            <strong>Touch Support:</strong> {results.touchSupport ? '✅ Supported' : '❌ Not Supported'}
          </li>
        </ul>
      </div>
      
      <div className="result-footer">
        <p>Test conducted on: {new Date(results.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}
