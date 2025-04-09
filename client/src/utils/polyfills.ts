/**
 * Polyfills for older browsers
 * This file adds support for modern features in older browsers
 */

// Check if the browser needs polyfills
const needsPolyfills = () => {
  return (
    !window.fetch ||
    !window.Promise ||
    !window.Symbol ||
    !window.Object.assign ||
    !window.Array.from ||
    !window.IntersectionObserver ||
    !window.ResizeObserver ||
    !window.requestAnimationFrame ||
    !window.CustomEvent ||
    typeof window.NodeList.prototype.forEach !== 'function'
  );
};

// Load polyfills dynamically if needed
export const loadPolyfills = () => {
  if (!needsPolyfills()) {
    return Promise.resolve();
  }

  const polyfills = [];

  // Fetch API polyfill
  if (!window.fetch) {
    polyfills.push(import('whatwg-fetch/fetch'));
  }

  // Promise polyfill
  if (!window.Promise) {
    polyfills.push(import('promise-polyfill/src/polyfill'));
  }

  // Symbol polyfill
  if (!window.Symbol) {
    polyfills.push(import('core-js/features/symbol'));
  }

  // Object.assign polyfill
  if (!window.Object.assign) {
    polyfills.push(import('core-js/features/object/assign'));
  }

  // Array.from polyfill
  if (!window.Array.from) {
    polyfills.push(import('core-js/features/array/from'));
  }

  // IntersectionObserver polyfill
  if (!window.IntersectionObserver) {
    polyfills.push(import('intersection-observer'));
  }

  // ResizeObserver polyfill
  if (!window.ResizeObserver) {
    polyfills.push(import('resize-observer-polyfill'));
  }

  // requestAnimationFrame polyfill
  if (!window.requestAnimationFrame) {
    polyfills.push(
      new Promise((resolve) => {
        // Simple polyfill for requestAnimationFrame
        window.requestAnimationFrame = function(callback) {
          return window.setTimeout(callback, 1000 / 60);
        };
        window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
        };
        resolve();
      })
    );
  }

  // CustomEvent polyfill
  if (!window.CustomEvent || typeof window.CustomEvent !== 'function') {
    polyfills.push(
      new Promise((resolve) => {
        window.CustomEvent = function(event, params) {
          params = params || { bubbles: false, cancelable: false, detail: null };
          const evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
          return evt;
        };
        window.CustomEvent.prototype = window.Event.prototype;
        resolve();
      })
    );
  }

  // NodeList.forEach polyfill
  if (typeof window.NodeList.prototype.forEach !== 'function') {
    polyfills.push(
      new Promise((resolve) => {
        window.NodeList.prototype.forEach = Array.prototype.forEach;
        resolve();
      })
    );
  }

  return Promise.all(polyfills);
};export const addLegacyBrowserSupport = () => {
  // Create a style element
  const style = document.createElement('style');
  
  // Add CSS fixes for older browsers
  style.textContent = `
    /* IE11 flexbox fixes */
    @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
      .flex {
        display: -ms-flexbox;
        display: flex;
      }
      .flex-row {
        -ms-flex-direction: row;
        flex-direction: row;
      }
      .flex-col {
        -ms-flex-direction: column;
        flex-direction: column;
      }
      .items-center {
        -ms-flex-align: center;
        align-items: center;
      }
      .justify-center {
        -ms-flex-pack: center;
        justify-content: center;
      }
      .justify-between {
        -ms-flex-pack: justify;
        justify-content: space-between;
      }
      .flex-1 {
        -ms-flex: 1 1 0%;
        flex: 1 1 0%;
      }
      .flex-auto {
        -ms-flex: 1 1 auto;
        flex: 1 1 auto;
      }
      .flex-grow {
        -ms-flex-positive: 1;
        flex-grow: 1;
      }
      .flex-shrink {
        -ms-flex-negative: 1;
        flex-shrink: 1;
      }
      .flex-wrap {
        -ms-flex-wrap: wrap;
        flex-wrap: wrap;
      }
    }

    /* Edge RTL fixes */
    @supports (-ms-ime-align: auto) {
      .rtl .edge-rtl-fix {
        direction: rtl !important;
        text-align: right !important;
      }
      .rtl .edge-rtl-reverse {
        -ms-flex-direction: row-reverse;
        flex-direction: row-reverse;
      }
    }

    /* Safari flexbox fixes */
    @media not all and (min-resolution:.001dpcm) {
      @supports (-webkit-appearance:none) {
        .safari-flex-fix {
          display: -webkit-flex;
          display: flex;
          -webkit-flex-direction: row;
          flex-direction: row;
        }
        .rtl .safari-flex-fix {
          -webkit-flex-direction: row-reverse;
          flex-direction: row-reverse;
        }
      }
    }
  `;
  
  // Append the style element to the head
  document.head.appendChild(style);
};

// Initialize polyfills and CSS fixes
export const initBrowserSupport = async () => {
  try {
    // Load polyfills if needed
    await loadPolyfills();
    
    // Add CSS fixes for older browsers
    addLegacyBrowserSupport();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize browser support:', error);
    return false;
  }
};
