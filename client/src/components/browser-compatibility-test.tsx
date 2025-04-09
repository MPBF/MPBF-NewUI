import React, { useEffect, useState } from 'react';
import { useCompatibilityTest, CompatibilityTestResult } from '../hooks/use-compatibility-test';
import { useLanguage } from '../utils/language';

export function BrowserCompatibilityTest() {
  const { results, isLoading, error } = useCompatibilityTest();
  const { t, isRtl } = useLanguage();
  const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([]);
  
  useEffect(() => {
    if (results) {
      const issues: string[] = [];
      
      // Check for critical feature support
      if (!results.features['flexbox']) {
        issues.push(t('flexboxNotSupported', { fallback: 'Flexbox layout is not supported in this browser' }));
      }
      
      if (!results.features['css-variables']) {
        issues.push(t('cssVarsNotSupported', { fallback: 'CSS Variables are not supported in this browser' }));
      }
      
      if (isRtl && !results.rtlSupport) {
        issues.push(t('rtlNotSupported', { fallback: 'Right-to-left text direction is not fully supported in this browser' }));
      }
      
      if (results.device === 'mobile' && !results.touchSupport) {
        issues.push(t('touchNotSupported', { fallback: 'Touch events are not properly supported on this device' }));
      }
      
      setCompatibilityIssues(issues);
    }
  }, [results, isRtl, t]);
  
  if (isLoading) {
    return <div className="p-4 text-center">{t('loading', { fallback: 'Loading...' })}</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">{t('testError', { fallback: 'Error running compatibility tests' })}: {error}</div>;
  }
  
  if (!results) {
    return <div className="p-4">{t('noResults', { fallback: 'No compatibility results available' })}</div>;
  }
  
  return (
    <div className={`p-4 ${isRtl ? 'rtl' : 'ltr'}`}>
      <h2 className="text-xl font-bold mb-4">{t('browserCompatibility', { fallback: 'Browser Compatibility' })}</h2>
      
      {compatibilityIssues.length > 0 ? (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <h3 className="font-bold text-yellow-800">{t('compatibilityIssues', { fallback: 'Compatibility Issues Detected' })}</h3>
          <ul className="list-disc pl-5 mt-2">
            {compatibilityIssues.map((issue, index) => (
              <li key={index} className="text-yellow-800">{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
          <p className="text-green-800">{t('compatibilitySuccess', { fallback: 'Your browser is fully compatible with this application' })}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-bold mb-2">{t('browserInfo', { fallback: 'Browser Information' })}</h3>
          <ul className="space-y-1">
            <li><strong>{t('browser', { fallback: 'Browser' })}:</strong> {results.browser} {results.browserVersion}</li>
            <li><strong>{t('device', { fallback: 'Device' })}:</strong> {results.device}</li>
            <li><strong>{t('os', { fallback: 'Operating System' })}:</strong> {results.os}</li>
            <li><strong>{t('viewport', { fallback: 'Viewport' })}:</strong> {results.viewportWidth}x{results.viewportHeight}</li>
            <li><strong>{t('pixelRatio', { fallback: 'Pixel Ratio' })}:</strong> {results.pixelRatio}</li>
          </ul>
        </div>
        
        <div className="border rounded p-3">
          <h3 className="font-bold mb-2">{t('criticalFeatures', { fallback: 'Critical Features' })}</h3>
          <ul className="space-y-1">
            <li>
              <strong>{t('rtlSupport', { fallback: 'RTL Support' })}:</strong> 
              {results.rtlSupport 
                ? <span className="text-green-600"> ✓ {t('supported', { fallback: 'Supported' })}</span> 
                : <span className="text-red-600"> ✗ {t('notSupported', { fallback: 'Not Supported' })}</span>}
            </li>
            <li>
              <strong>{t('touchSupport', { fallback: 'Touch Support' })}:</strong> 
              {results.touchSupport 
                ? <span className="text-green-600"> ✓ {t('supported', { fallback: 'Supported' })}</span> 
                : <span className="text-red-600"> ✗ {t('notSupported', { fallback: 'Not Supported' })}</span>}
            </li>
            <li>
              <strong>{t('flexbox', { fallback: 'Flexbox' })}:</strong> 
              {results.features['flexbox'] 
                ? <span className="text-green-600"> ✓ {t('supported', { fallback: 'Supported' })}</span> 
                : <span className="text-red-600"> ✗ {t('notSupported', { fallback: 'Not Supported' })}</span>}
            </li>
            <li>
              <strong>{t('grid', { fallback: 'CSS Grid' })}:</strong> 
              {results.features['grid'] 
                ? <span className="text-green-600"> ✓ {t('supported', { fallback: 'Supported' })}</span> 
                : <span className="text-red-600"> ✗ {t('notSupported', { fallback: 'Not Supported' })}</span>}
            </li>
            <li>
              <strong>{t('cssVariables', { fallback: 'CSS Variables' })}:</strong> 
              {results.features['css-variables'] 
                ? <span className="text-green-600"> ✓ {t('supported', { fallback: 'Supported' })}</span> 
                : <span className="text-red-600"> ✗ {t('notSupported', { fallback: 'Not Supported' })}</span>}
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-4 border rounded p-3">
        <h3 className="font-bold mb-2">{t('allFeatures', { fallback: 'All Features' })}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(results.features).map(([feature, supported]) => (
            <div key={feature} className={`p-2 rounded ${supported ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="font-medium">{feature}:</span> 
              {supported 
                ? <span className="text-green-600"> ✓</span> 
                : <span className="text-red-600"> ✗</span>}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        {t('testTimestamp', { fallback: 'Test conducted on' })}: {new Date(results.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
