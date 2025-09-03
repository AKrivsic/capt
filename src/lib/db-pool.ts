import "server-only";
import { PrismaClient } from "@prisma/client";

// Connection pool configuration
const POOL_SIZE = 10;

class DatabasePool {
  private pool: PrismaClient[] = [];
  private available: PrismaClient[] = [];
  private inUse: Set<PrismaClient> = new Set();
  private isPooler: boolean = false;

  constructor() {
    // Detekuj, jestli používáme pooler
    this.isPooler = process.env.DATABASE_URL?.includes('pooler.supabase.com') || false;
    console.log(`Database pool initialized with ${this.isPooler ? 'pooler' : 'direct'} connection`);
    
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
        // Přidej pooler kompatibilitu
        __internal: {
          engine: {
            enableEngineDebugMode: false,
            enableQueryEngineQueryLogging: false,
            // Přidej pooler-specific nastavení
            enableEngineQueryLogging: false,
            // Vypni prepared statement cache pro pooler
            enablePreparedStatementCache: false,
          },
        },
        // Přidej connection pooling nastavení
        datasourceUrl: process.env.DATABASE_URL,
        // Přidej pooler kompatibilitu
        clientExtensions: {
          query: {
            // Vypni prepared statements pro pooler
            usePreparedStatements: false,
          },
        },
        // Přidej pooler-specific nastavení
        ...(this.isPooler && {
          // Pro pooler: vypni prepared statements úplně
          __internal: {
            engine: {
              enablePreparedStatementCache: false,
              enableEngineQueryLogging: false,
            },
          },
        }),
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
      
      // Použij nejjednodušší query pro pooler kompatibilitu
      // Vypni prepared statements úplně
      await client.$queryRawUnsafe('SELECT 1');
      
      this.releaseClient(client);
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      
      // Pokud je to prepared statement error, zkus reconnect
      if (error?.code === 'P2010' || 
          error?.message?.includes('prepared statement') ||
          error?.message?.includes('statement "s0"')) {
        console.warn("Prepared statement error detected, attempting reconnect...");
        await this.reconnectPool();
        return this.healthCheck();
      }
      
      return false;
    }
  }

  private async reconnectPool() {
    try {
      // Zavři všechny klienty
      await this.close();
      
      // Vytvoř nový pool
      this.initializePool();
      
      console.log("Database pool reconnected successfully");
    } catch (error) {
      console.error("Failed to reconnect database pool:", error);
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
    // Přidej detailní error logging
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    const errorCode = (error as any)?.code;
    
    console.error("Database health check error:", {
      message: errorMessage,
      code: errorCode,
      error: error
    });
    
    return { 
      ok: false, 
      error: `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`
    };
  }
}
