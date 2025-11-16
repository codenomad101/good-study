/**
 * Developer Tools Detection Utility
 * Detects if browser developer tools are open using multiple techniques
 */

let devToolsOpen = false;
let detectionInterval: NodeJS.Timeout | null = null;
let resizeHandler: (() => void) | null = null;
let focusHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;
let hasReloaded = false; // Prevent multiple reloads

// Multiple detection techniques
function detectDevTools(): boolean {
  // Technique 1: Window size detection (most reliable)
  // When dev tools are open, inner dimensions are smaller than outer
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  
  // Threshold: if difference is more than 160px, likely dev tools
  if (widthDiff > 160 || heightDiff > 160) {
    return true;
  }

  // Technique 2: Console detection using timing
  try {
    const start = performance.now();
    // This will be slower if console is open
    console.log('%c', '');
    const end = performance.now();
    if (end - start > 1) {
      return true;
    }
  } catch (e) {
    // Ignore errors
  }

  // Technique 3: Debugger detection
  let detected = false;
  const element = document.createElement('div');
  Object.defineProperty(element, 'id', {
    get: function() {
      detected = true;
      return 'devtools-detector';
    }
  });
  
  // Access the property - if dev tools are open, this triggers
  const check = element.id;
  if (detected) {
    return true;
  }

  return false;
}

export function startDevToolsDetection(
  onDetected: () => void,
  checkInterval: number = 500,
  options: { checkOnce?: boolean; allowReload?: boolean; blockUntilClosed?: boolean } = {}
): void {
  const { checkOnce = false, allowReload = true, blockUntilClosed = false } = options;

  // Check immediately on load (with small delay to ensure page is ready)
  setTimeout(() => {
    if (detectDevTools()) {
      devToolsOpen = true;
      if (blockUntilClosed) {
        // For blocking mode, call onDetected immediately
        onDetected();
      } else if (allowReload && !hasReloaded) {
        hasReloaded = true;
        onDetected();
        return;
      }
    }
  }, 100);

  // If checkOnce is true, only check once and don't set up continuous monitoring
  if (checkOnce && !blockUntilClosed) {
    return;
  }

  // Continuous monitoring
  detectionInterval = setInterval(() => {
    const isOpen = detectDevTools();
    if (isOpen) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        if (blockUntilClosed) {
          // Always notify when dev tools open in blocking mode
          onDetected();
        } else if (allowReload && !hasReloaded) {
          hasReloaded = true;
          onDetected();
        }
      } else if (blockUntilClosed) {
        // In blocking mode, continuously check and notify
        onDetected();
      }
    } else {
      if (devToolsOpen && blockUntilClosed) {
        // Dev tools were closed - notify that it's safe to proceed
        devToolsOpen = false;
      } else {
        devToolsOpen = false;
      }
    }
  }, checkInterval);

  // Monitor window resize (dev tools opening/closing changes window size)
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  
  resizeHandler = () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    // Check immediately on resize
    if (detectDevTools()) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        onDetected();
      }
    }
    
    // Also check for significant size changes
    const widthDiff = Math.abs(currentWidth - lastWidth);
    const heightDiff = Math.abs(currentHeight - lastHeight);
    
    if (widthDiff > 200 || heightDiff > 200) {
      if (detectDevTools()) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          onDetected();
        }
      }
    }
    
    lastWidth = currentWidth;
    lastHeight = currentHeight;
  };

  window.addEventListener('resize', resizeHandler);

  // Monitor focus (dev tools might steal focus)
  focusHandler = () => {
    setTimeout(() => {
      if (detectDevTools()) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          onDetected();
        }
      }
    }, 100);
  };

  window.addEventListener('focus', focusHandler);
  
  // Monitor visibility changes
  visibilityHandler = () => {
    setTimeout(() => {
      if (detectDevTools()) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          onDetected();
        }
      }
    }, 100);
  };

  document.addEventListener('visibilitychange', visibilityHandler);
}

export function stopDevToolsDetection(): void {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  
  if (focusHandler) {
    window.removeEventListener('focus', focusHandler);
    document.removeEventListener('visibilitychange', focusHandler);
    focusHandler = null;
  }
  
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  
  devToolsOpen = false;
}

export function resetDevToolsDetection(): void {
  hasReloaded = false;
  devToolsOpen = false;
}

export function isDevToolsOpen(): boolean {
  return devToolsOpen || detectDevTools();
}

// Advanced detection using debugger
export function detectDevToolsAdvanced(): boolean {
  let detected = false;
  
  // Create a debugger trap
  const element = document.createElement('div');
  Object.defineProperty(element, 'id', {
    get: function() {
      detected = true;
      return 'devtools-detector';
    }
  });
  
  // Access the property to trigger detection
  const check = element.id;
  
  // Also check console
  const start = performance.now();
  console.log('%c', '');
  const end = performance.now();
  
  return detected || (end - start > 1);
}

// Aggressive detection using debugger statement
// This will pause execution if dev tools are open
export function useDebuggerTrap(): void {
  setInterval(() => {
    // This will trigger a breakpoint if dev tools are open
    // eslint-disable-next-line no-debugger
    debugger;
  }, 1000);
}

// Reload page if dev tools detected
export function handleDevToolsDetected(action: 'reload' | 'redirect' | 'warn' = 'reload'): void {
  // Prevent multiple reloads
  if (hasReloaded) {
    return;
  }

  if (action === 'reload') {
    hasReloaded = true;
    // Clear any sensitive data
    sessionStorage.clear();
    // Reload the page
    window.location.reload();
  } else if (action === 'redirect') {
    hasReloaded = true;
    // Redirect to home
    window.location.href = '/';
  } else if (action === 'warn') {
    // Show warning (but this can be dismissed)
    alert('Developer tools detected. Please close them to continue.');
  }
}

