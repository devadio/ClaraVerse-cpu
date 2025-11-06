/**
 * Mock Electron API implementations for web environment
 *
 * These mocks provide graceful fallbacks when running in a browser,
 * allowing the app to function without Electron while notifying users
 * about desktop-only features.
 */

const createDesktopPromptEvent = (feature: string, method: string) => {
  window.dispatchEvent(new CustomEvent('show-desktop-prompt', {
    detail: {
      feature,
      method,
      message: `The "${method}" feature requires the desktop app for full functionality.`
    }
  }));
};

// Mock window.electron API
export const mockElectronAPI = {
  getAppVersion: async () => {
    return '0.0.0-web';
  },
  getPlatform: async () => {
    return 'web';
  },
  getSystemInfo: async () => {
    return {
      platform: 'web',
      arch: navigator.userAgent.includes('x64') ? 'x64' : 'unknown',
      version: 'N/A',
      memory: (navigator as any).deviceMemory || 'Unknown',
      cpus: navigator.hardwareConcurrency || 1
    };
  },
  checkForUpdates: async () => {
    createDesktopPromptEvent('updates', 'checkForUpdates');
    return null;
  },
  getUpdateInfo: async () => {
    return null;
  },
  onUpdateAvailable: () => {},
  onUpdateDownloaded: () => {},
  onDownloadProgress: () => {},
  closeApp: () => {
    createDesktopPromptEvent('app', 'closeApp');
  },
  hideToTray: () => {
    createDesktopPromptEvent('app', 'hideToTray');
  },
  showFromTray: () => {
    createDesktopPromptEvent('app', 'showFromTray');
  },
  copyToClipboard: (text: string) => {
    // Use browser clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      createDesktopPromptEvent('clipboard', 'copyToClipboard');
    }
  },
  readFromClipboard: async () => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        createDesktopPromptEvent('clipboard', 'readFromClipboard');
        return '';
      }
    }
    createDesktopPromptEvent('clipboard', 'readFromClipboard');
    return '';
  }
};

// Mock window.electronAPI (Docker/Container management)
export const mockElectronAPIService = {
  getContainers: async () => {
    createDesktopPromptEvent('docker', 'getContainers');
    return [];
  },
  containerAction: async () => {
    createDesktopPromptEvent('docker', 'containerAction');
    return { success: false, message: 'Docker management requires desktop app' };
  },
  createContainer: async () => {
    createDesktopPromptEvent('docker', 'createContainer');
    return { success: false, message: 'Docker management requires desktop app' };
  },
  checkDockerServices: async () => {
    createDesktopPromptEvent('docker', 'checkDockerServices');
    return { available: false, message: 'Desktop app required' };
  },
  getServicesStatus: async () => {
    return {
      n8n: { running: false, available: false },
      comfyui: { running: false, available: false },
      python: { running: false, available: false }
    };
  },
  getServicePorts: async () => {
    return { n8n: null, comfyui: null, python: null };
  },
  comfyuiStart: async () => {
    createDesktopPromptEvent('comfyui', 'start');
    return { success: false };
  },
  comfyuiStop: async () => {
    createDesktopPromptEvent('comfyui', 'stop');
    return { success: false };
  },
  comfyuiStatus: async () => {
    return { running: false, available: false };
  },
  onBackendStatus: () => {},
  onPythonStatus: () => {}
};

// Mock window.llamaSwap API
export const mockLlamaSwapAPI = {
  startService: async () => {
    createDesktopPromptEvent('llamaSwap', 'startService');
    return { success: false, message: 'LlamaSwap requires desktop app' };
  },
  stopService: async () => {
    createDesktopPromptEvent('llamaSwap', 'stopService');
    return { success: false };
  },
  restartService: async () => {
    createDesktopPromptEvent('llamaSwap', 'restartService');
    return { success: false };
  },
  getStatus: async () => {
    return {
      running: false,
      available: false,
      port: null,
      version: null
    };
  },
  getModels: async () => {
    createDesktopPromptEvent('llamaSwap', 'getModels');
    return [];
  },
  getApiUrl: async () => {
    return null;
  },
  onProgressUpdate: () => {}
};

// Mock window.modelManager API
export const mockModelManagerAPI = {
  searchHuggingFace: async () => {
    createDesktopPromptEvent('modelManager', 'searchHuggingFace');
    return [];
  },
  downloadModel: async () => {
    createDesktopPromptEvent('modelManager', 'downloadModel');
    return { success: false, message: 'Model downloads require desktop app' };
  },
  getLocalModels: async () => {
    createDesktopPromptEvent('modelManager', 'getLocalModels');
    return [];
  },
  deleteModel: async () => {
    createDesktopPromptEvent('modelManager', 'deleteModel');
    return { success: false };
  },
  stopDownload: async () => {
    return { success: false };
  },
  onDownloadProgress: () => {},
  onDownloadStarted: () => {},
  onDownloadCompleted: () => {},
  getCustomModelPaths: async () => {
    createDesktopPromptEvent('modelManager', 'getCustomModelPaths');
    return [];
  },
  setCustomModelPath: async () => {
    createDesktopPromptEvent('modelManager', 'setCustomModelPath');
    return { success: false };
  },
  scanCustomPathModels: async () => {
    createDesktopPromptEvent('modelManager', 'scanCustomPathModels');
    return [];
  }
};

// Mock window.mcpService API
export const mockMCPServiceAPI = {
  getServers: async () => {
    createDesktopPromptEvent('mcpService', 'getServers');
    return [];
  },
  addServer: async () => {
    createDesktopPromptEvent('mcpService', 'addServer');
    return { success: false, message: 'MCP Service requires desktop app' };
  },
  removeServer: async () => {
    createDesktopPromptEvent('mcpService', 'removeServer');
    return { success: false };
  },
  startServer: async () => {
    createDesktopPromptEvent('mcpService', 'startServer');
    return { success: false };
  },
  stopServer: async () => {
    createDesktopPromptEvent('mcpService', 'stopServer');
    return { success: false };
  },
  getServerStatus: async () => {
    return { running: false, available: false };
  },
  testServer: async () => {
    createDesktopPromptEvent('mcpService', 'testServer');
    return { success: false };
  },
  getTemplates: async () => {
    return [];
  }
};

// Mock window.windowManager API
export const mockWindowManagerAPI = {
  toggleFullscreen: async () => {
    // Try to use browser fullscreen API
    if (document.fullscreenEnabled) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    } else {
      createDesktopPromptEvent('windowManager', 'toggleFullscreen');
    }
  },
  getFullscreenStatus: async () => {
    return !!document.fullscreenElement;
  },
  getFullscreenStartupPreference: async () => {
    const pref = localStorage.getItem('fullscreen-startup');
    return pref === 'true';
  },
  setFullscreenStartupPreference: async (enabled: boolean) => {
    localStorage.setItem('fullscreen-startup', String(enabled));
  }
};

// Mock window.featureConfig API
export const mockFeatureConfigAPI = {
  getFeatureConfig: async () => {
    const stored = localStorage.getItem('feature-config');
    return stored ? JSON.parse(stored) : {};
  },
  updateFeatureConfig: async (config: any) => {
    localStorage.setItem('feature-config', JSON.stringify(config));
    return { success: true };
  },
  resetFeatureConfig: async () => {
    localStorage.removeItem('feature-config');
    return { success: true };
  }
};

// Mock window.developerLogs API
export const mockDeveloperLogsAPI = {
  read: async () => {
    createDesktopPromptEvent('developerLogs', 'read');
    return 'Developer logs are only available in the desktop app.';
  },
  getFiles: async () => {
    createDesktopPromptEvent('developerLogs', 'getFiles');
    return [];
  },
  clear: async () => {
    createDesktopPromptEvent('developerLogs', 'clear');
    return { success: false };
  }
};

// Mock window.electronScreenShare API
export const mockElectronScreenShareAPI = {
  getDesktopSources: async () => {
    createDesktopPromptEvent('screenShare', 'getDesktopSources');
    return [];
  },
  getScreenAccessStatus: async () => {
    return { hasAccess: false };
  },
  requestScreenAccess: async () => {
    createDesktopPromptEvent('screenShare', 'requestScreenAccess');
    return { granted: false };
  }
};

/**
 * Initialize mock APIs when running in web environment
 */
export const initializeMockAPIs = () => {
  if (typeof window === 'undefined') return;

  // Only add mocks if the real APIs don't exist
  if (!window.electron) {
    (window as any).electron = mockElectronAPI;
  }
  if (!window.electronAPI) {
    (window as any).electronAPI = mockElectronAPIService;
  }
  if (!window.llamaSwap) {
    (window as any).llamaSwap = mockLlamaSwapAPI;
  }
  if (!window.modelManager) {
    (window as any).modelManager = mockModelManagerAPI;
  }
  if (!window.mcpService) {
    (window as any).mcpService = mockMCPServiceAPI;
  }
  if (!window.windowManager) {
    (window as any).windowManager = mockWindowManagerAPI;
  }
  if (!window.featureConfig) {
    (window as any).featureConfig = mockFeatureConfigAPI;
  }
  if (!window.developerLogs) {
    (window as any).developerLogs = mockDeveloperLogsAPI;
  }
  if (!window.electronScreenShare) {
    (window as any).electronScreenShare = mockElectronScreenShareAPI;
  }

  console.log('🌐 Running in web mode - Electron APIs mocked');
};

export default {
  mockElectronAPI,
  mockElectronAPIService,
  mockLlamaSwapAPI,
  mockModelManagerAPI,
  mockMCPServiceAPI,
  mockWindowManagerAPI,
  mockFeatureConfigAPI,
  mockDeveloperLogsAPI,
  mockElectronScreenShareAPI,
  initializeMockAPIs
};
