import "server-only";

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log context interface
export interface LogContext {
  requestId?: string;
  userId?: string;
  affiliateId?: string;
  plan?: string;
  ip?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: any;
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
}

class StructuredLogger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Development: human-readable format
      const levelStr = LogLevel[entry.level];
      const contextStr = Object.keys(entry.context).length > 0 
        ? ` | ${JSON.stringify(entry.context, null, 2)}`
        : "";
      const errorStr = entry.error ? ` | Error: ${entry.error.message}` : "";
      
      return `[${entry.timestamp}] ${levelStr}: ${entry.message}${contextStr}${errorStr}`;
    } else {
      // Production: JSON format for log aggregation
      return JSON.stringify({
        ...entry,
        level: LogLevel[entry.level],
        timestamp: entry.timestamp,
      });
    }
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);
    
    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }

    // TODO: Send to external logging service (Sentry, DataDog, etc.)
    if (level >= LogLevel.ERROR && process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }
  }

  // Public logging methods
  debug(message: string, context: LogContext = {}) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: LogContext = {}) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Request logging helpers
  logRequest(
    endpoint: string,
    method: string,
    context: LogContext = {}
  ) {
    this.info(`Request started: ${method} ${endpoint}`, {
      ...context,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });
  }

  logRequestComplete(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    context: LogContext = {}
  ) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Request completed: ${method} ${endpoint}`, {
      ...context,
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }

  logError(
    endpoint: string,
    method: string,
    error: Error,
    context: LogContext = {}
  ) {
    this.error(`Request failed: ${method} ${endpoint}`, {
      ...context,
      endpoint,
      method,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, error);
  }

  // Business logic logging
  logGeneration(
    userId: string | null,
    plan: string,
    platform: string,
    outputs: string[],
    context: LogContext = {}
  ) {
    this.info("Content generation started", {
      ...context,
      userId,
      plan,
      platform,
      outputs,
      timestamp: new Date().toISOString(),
    });
  }

  logUsageLimit(
    userId: string | null,
    plan: string,
    limit: number,
    current: number,
    context: LogContext = {}
  ) {
    this.warn("Usage limit reached", {
      ...context,
      userId,
      plan,
      limit,
      current,
      timestamp: new Date().toISOString(),
    });
  }

  logPayment(
    userId: string,
    plan: string,
    amount: number,
    currency: string,
    context: LogContext = {}
  ) {
    this.info("Payment processed", {
      ...context,
      userId,
      plan,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });
  }

  logWebhook(
    source: string,
    eventId: string,
    eventType: string,
    success: boolean,
    context: LogContext = {}
  ) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Webhook processed: ${source} ${eventType}`, {
      ...context,
      source,
      eventId,
      eventType,
      success,
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton instance
export const logger = new StructuredLogger();

// Convenience function for creating request context
export function createRequestContext(
  requestId: string,
  userId?: string,
  affiliateId?: string,
  plan?: string,
  ip?: string
): LogContext {
  return {
    requestId,
    userId,
    affiliateId,
    plan,
    ip,
  };
}

// Export types
export type { LogContext, LogEntry };
