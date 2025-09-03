import "server-only";
import { PrismaClient } from "@prisma/client";

// Connection pool configuration
const POOL_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class DatabasePool {
  private pool: PrismaClient[] = [];
  private available: PrismaClient[] = [];
  private inUse: Set<PrismaClient> = new Set();

  constructor() {
    this.initializePool();
  }

  private initializePool() {
    for (let i = 0; i < POOL_SIZE; i++) {
      const client = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        // Connection pool settings
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
      
      this.pool.push(client);
      this.available.push(client);
    }
  }

  async getClient(): Promise<PrismaClient> {
    // Wait for available client
    while (this.available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const client = this.available.pop()!;
    this.inUse.add(client);
    
    return client;
  }

  releaseClient(client: PrismaClient) {
    if (this.inUse.has(client)) {
      this.inUse.delete(client);
      this.available.push(client);
    }
  }

  async withClient<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      return await operation(client);
    } finally {
      this.releaseClient(client);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.$queryRaw`SELECT 1`;
      this.releaseClient(client);
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  async close() {
    for (const client of this.pool) {
      await client.$disconnect();
    }
    this.pool = [];
    this.available = [];
    this.inUse.clear();
  }
}

// Singleton instance
export const dbPool = new DatabasePool();

// Convenience function for database operations
export async function withDb<T>(operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  return dbPool.withClient(operation);
}

// Health check function
export async function checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const isHealthy = await dbPool.healthCheck();
    return { ok: isHealthy };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : "Unknown database error" 
    };
  }
}
