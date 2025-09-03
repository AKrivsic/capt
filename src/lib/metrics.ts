import "server-only";

// Metrics storage (in-memory for now, can be extended to Redis/DB)
interface MetricData {
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  times: number[];
  lastReset: number;
}

interface MemoryMetric {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  timestamp: number;
}

class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();
  private memoryMetrics: MemoryMetric[] = [];
  private coldStartTime: number = Date.now();
  private isColdStart: boolean = true;

  constructor() {
    // Reset metrics every hour
    setInterval(() => this.resetMetrics(), 60 * 60 * 1000);
    
    // Collect memory metrics every 30 seconds
    setInterval(() => this.collectMemoryMetrics(), 30 * 1000);
  }

  private resetMetrics() {
    this.metrics.clear();
    this.memoryMetrics = [];
  }

  private collectMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.memoryMetrics.push({
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      timestamp: Date.now(),
    });

    // Keep only last 1000 memory samples
    if (this.memoryMetrics.length > 1000) {
      this.memoryMetrics = this.memoryMetrics.slice(-1000);
    }
  }

  recordRequest(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, {
        count: 0,
        totalTime: 0,
        minTime: duration,
        maxTime: duration,
        times: [],
        lastReset: Date.now(),
      });
    }

    const metric = this.metrics.get(endpoint)!;
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.times.push(duration);

    // Keep only last 1000 samples for percentiles
    if (metric.times.length > 1000) {
      metric.times = metric.times.slice(-1000);
    }

    // Mark as warm after first request
    if (this.isColdStart) {
      this.isColdStart = false;
    }
  }

  getMetrics(endpoint?: string) {
    if (endpoint) {
      return this.metrics.get(endpoint);
    }

    const result: Record<string, {
      count: number;
      avgTime: number;
      minTime: number;
      maxTime: number;
      p50: number;
      p95: number;
      p99: number;
      lastReset: string;
    }> = {};
    
    for (const [key, metric] of this.metrics) {
      const sortedTimes = [...metric.times].sort((a, b) => a - b);
      const p50Index = Math.floor(sortedTimes.length * 0.5);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);

      result[key] = {
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        minTime: metric.minTime,
        maxTime: metric.maxTime,
        p50: sortedTimes[p50Index] || 0,
        p95: sortedTimes[p95Index] || 0,
        p99: sortedTimes[p99Index] || 0,
        lastReset: new Date(metric.lastReset).toISOString(),
      };
    }

    return result;
  }

  getMemoryMetrics() {
    if (this.memoryMetrics.length === 0) return null;

    const latest = this.memoryMetrics[this.memoryMetrics.length - 1];
    const oldest = this.memoryMetrics[0];
    
    return {
      current: {
        rss: this.formatBytes(latest.rss),
        heapUsed: this.formatBytes(latest.heapUsed),
        heapTotal: this.formatBytes(latest.heapTotal),
        external: this.formatBytes(latest.external),
      },
      trend: {
        rssChange: this.formatBytes(latest.rss - oldest.rss),
        heapUsedChange: this.formatBytes(latest.heapUsed - oldest.heapUsed),
        samples: this.memoryMetrics.length,
        timeSpan: `${Math.round((latest.timestamp - oldest.timestamp) / 1000)}s`,
      },
      coldStart: {
        isColdStart: this.isColdStart,
        uptime: Date.now() - this.coldStartTime,
      },
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Middleware function for automatic metrics collection
  middleware(endpoint: string) {
    return async <T>(fn: () => Promise<T>) => {
      const start = Date.now();
      try {
        const result = await fn();
        this.recordRequest(endpoint, Date.now() - start);
        return result;
      } catch (error) {
        this.recordRequest(endpoint, Date.now() - start);
        throw error;
      }
    };
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Convenience function for wrapping API routes
export function withMetrics<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  return metrics.middleware(endpoint)(fn);
}

// Export types for external use
export type { MetricData, MemoryMetric };
