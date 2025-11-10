import { useRef, useEffect, useState } from 'react';

/**
 * Performance optimization utilities for ClaraVerse
 *
 * These utilities help reduce CPU/memory usage on low-end hardware like i3 processors
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * Use this for expensive operations like API calls, search, diagram rendering
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 * Use this for scroll handlers, resize handlers, animation updates
 *
 * @param func - Function to throttle
 * @param wait - Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastTime: number;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      lastTime = Date.now();
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

/**
 * Hook for lazy loading heavy components
 * Only loads the component when it becomes visible in viewport
 *
 * @param ref - Ref to the element to observe
 * @returns Whether the element is visible
 */
export function useLazyLoad(ref: React.RefObject<HTMLElement>): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before element is visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isVisible;
}

/**
 * Request deduplication cache
 * Prevents duplicate API calls for the same data
 */
class RequestCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private ttl: number;

  constructor(ttl: number = 60000) {
    // 1 minute default TTL
    this.ttl = ttl;
  }

  /**
   * Get cached data or execute fetch function
   */
  async fetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Execute new request
    const request = fetchFn();
    this.pendingRequests.set(key, request);

    try {
      const data = await request;
      this.cache.set(key, { data, timestamp: Date.now() });
      this.pendingRequests.delete(key);
      return data;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  /**
   * Clear cache for a specific key or all keys
   */
  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global request cache instance
export const requestCache = new RequestCache(60000); // 1 minute TTL

// Auto-cleanup every 5 minutes
setInterval(() => {
  requestCache.cleanup();
}, 300000);

/**
 * Hook for detecting if user's device is low-end
 * Can be used to conditionally disable expensive features
 */
export function useIsLowEndDevice(): boolean {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    // Check various performance indicators
    const checkPerformance = () => {
      // Check number of CPU cores
      const cores = navigator.hardwareConcurrency || 2;

      // Check memory (if available)
      const memory = (navigator as any).deviceMemory || 4;

      // Check connection (if available)
      const connection = (navigator as any).connection;
      const isSlow =
        connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g');

      // Consider low-end if: <= 4 cores OR <= 4GB RAM OR slow connection
      const isLowEndDevice = cores <= 4 || memory <= 4 || isSlow;

      setIsLowEnd(isLowEndDevice);
    };

    checkPerformance();
  }, []);

  return isLowEnd;
}

/**
 * Memoization helper for expensive computations
 * Caches results based on input parameters
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * React hook version of memoize
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  func: T,
  deps: React.DependencyList
): T {
  const funcRef = useRef(func);
  const cacheRef = useRef(new Map<string, ReturnType<T>>());

  useEffect(() => {
    funcRef.current = func;
    cacheRef.current.clear(); // Clear cache when dependencies change
  }, deps);

  const memoizedFunc = useRef(((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }

    const result = funcRef.current(...args);
    cacheRef.current.set(key, result);

    // Limit cache size
    if (cacheRef.current.size > 50) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    return result;
  }) as T);

  return memoizedFunc.current;
}

export default {
  debounce,
  throttle,
  useLazyLoad,
  requestCache,
  useIsLowEndDevice,
  memoize,
  useMemoizedCallback,
};
