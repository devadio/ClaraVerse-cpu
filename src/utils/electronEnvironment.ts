/**
 * Electron Environment Detection and Compatibility Layer
 *
 * This utility provides environment detection and graceful fallbacks
 * for running the app in both Electron and web browser environments.
 */

/**
 * Checks if the app is running in Electron environment
 */
export const isElectron = (): boolean => {
  // Check if we're in a browser environment first
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Electron-specific properties
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf(' electron/') > -1) {
    return true;
  }

  // Check for window.electron API
  if (window.electron) {
    return true;
  }

  // Check for process (Electron exposes this)
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    return true;
  }

  return false;
};

/**
 * Checks if a specific Electron API is available
 */
export const hasElectronAPI = (apiName: keyof Window): boolean => {
  return isElectron() && typeof window[apiName] !== 'undefined';
};

/**
 * Gets the environment type
 */
export const getEnvironment = (): 'electron' | 'web' => {
  return isElectron() ? 'electron' : 'web';
};

/**
 * Safe way to call Electron IPC with fallback
 */
export const safeElectronCall = async <T>(
  apiPath: string,
  fallbackValue?: T,
  showDesktopPrompt: boolean = true
): Promise<T | undefined> => {
  if (!isElectron()) {
    if (showDesktopPrompt) {
      // Dispatch a custom event to show desktop app promotion
      window.dispatchEvent(new CustomEvent('show-desktop-prompt', {
        detail: {
          feature: apiPath,
          message: 'This feature requires the desktop app'
        }
      }));
    }
    return fallbackValue;
  }

  try {
    // Parse the API path (e.g., "electron.getAppVersion" or "llamaSwap.startService")
    const [namespace, method] = apiPath.split('.');
    const api = (window as any)[namespace];

    if (!api || typeof api[method] !== 'function') {
      console.warn(`Electron API ${apiPath} not available`);
      return fallbackValue;
    }

    return await api[method]();
  } catch (error) {
    console.error(`Error calling Electron API ${apiPath}:`, error);
    return fallbackValue;
  }
};

/**
 * Feature availability checker
 */
export const featureAvailability = {
  // Core features
  isDockerAvailable: () => hasElectronAPI('electronAPI'),
  isModelManagementAvailable: () => hasElectronAPI('modelManager'),
  isLlamaSwapAvailable: () => hasElectronAPI('llamaSwap'),
  isComfyUIAvailable: () => hasElectronAPI('electronAPI'),
  isMCPServiceAvailable: () => hasElectronAPI('mcpService'),

  // System features
  isFileSystemAccessAvailable: () => isElectron(),
  isClipboardAvailable: () => hasElectronAPI('electron'),
  isScreenShareAvailable: () => hasElectronAPI('electronScreenShare'),
  isSystemInfoAvailable: () => hasElectronAPI('electron'),

  // Service features
  isWatchdogAvailable: () => isElectron(),
  isWidgetServiceAvailable: () => isElectron(),
  isAutoUpdateAvailable: () => hasElectronAPI('electron'),

  // Get all unavailable features
  getUnavailableFeatures: (): string[] => {
    if (isElectron()) return [];

    return [
      'Docker Container Management',
      'Local Model Management',
      'LlamaSwap Service',
      'ComfyUI Integration',
      'MCP Service',
      'File System Access',
      'Screen Sharing',
      'System Diagnostics',
      'Watchdog Service',
      'Widget Service',
      'Auto Updates',
      'Background Services'
    ];
  }
};

/**
 * Environment information
 */
export const getEnvironmentInfo = () => {
  return {
    isElectron: isElectron(),
    environment: getEnvironment(),
    platform: isElectron() ? process.platform : 'web',
    userAgent: navigator.userAgent,
    availableAPIs: {
      electron: hasElectronAPI('electron'),
      electronAPI: hasElectronAPI('electronAPI'),
      llamaSwap: hasElectronAPI('llamaSwap'),
      modelManager: hasElectronAPI('modelManager'),
      mcpService: hasElectronAPI('mcpService'),
      windowManager: hasElectronAPI('windowManager'),
      featureConfig: hasElectronAPI('featureConfig'),
      electronScreenShare: hasElectronAPI('electronScreenShare'),
    }
  };
};

export default {
  isElectron,
  hasElectronAPI,
  getEnvironment,
  safeElectronCall,
  featureAvailability,
  getEnvironmentInfo
};
