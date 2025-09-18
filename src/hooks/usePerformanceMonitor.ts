import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
}

export const usePerformanceMonitor = (componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log performance metrics in development
      if (renderTime > 16) { // More than one frame (16ms at 60fps)
        // Performance monitoring - render time exceeded threshold
      }

      // Check memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        if (memoryUsage > 100) { // More than 100MB
          // Performance monitoring - high memory usage detected
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    isSlowRender: (renderTime: number) => renderTime > 16
  };
};

export default usePerformanceMonitor;
