import mongoose, { Mongoose } from 'mongoose';

/**
 * Interface for managing cached database connection.
 * Prevents multiple connections during development by caching both
 * the active connection and any pending connection promises.
 */
interface CachedConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Extend the global namespace to include Mongoose cache.
 * This prevents TypeScript errors when accessing global.mongooseCache.
 */
declare global {
  var mongooseCache: CachedConnection;
}

/**
 * Initialize cached connection object.
 * Uses existing global cache or creates a new one to prevent multiple instances.
 */
let cached: CachedConnection = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

// Ensure global cache is set
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Establishes and caches a connection to MongoDB using Mongoose.
 *
 * Key features:
 * - Returns cached connection if already established
 * - Waits for pending connection promise to avoid duplicate connections
 * - Validates MongoDB URI from environment variable
 * - Handles connection errors gracefully
 *
 * @returns {Promise<Mongoose>} Promise resolving to the Mongoose instance
 * @throws {Error} If MONGODB_URI environment variable is not defined
 * @throws {Error} If MongoDB connection fails
 *
 * @example
 * ```typescript
 * import { connectDB } from '@/lib/mongodb';
 *
 * const db = await connectDB();
 * ```
 */
export async function connectDB(): Promise<Mongoose> {
  // Return existing connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // Wait for pending connection promise to avoid duplicate connections
  if (cached.promise) {
    return cached.promise;
  }

  // Validate MongoDB URI environment variable
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error(
      'MONGODB_URI environment variable is not defined. Please set it in your .env.local file.'
    );
  }

  /**
   * Create new connection promise and cache it.
   * This prevents other calls from attempting simultaneous connections.
   */
  cached.promise = mongoose
    .connect(mongodbUri, {
      // Optional: specify database name if multiple databases are used
      dbName: process.env.MONGODB_DB_NAME,
    })
    .then((mongooseInstance) => {
      return mongooseInstance;
    })
    .catch((error) => {
      // Clear promise on error to allow retry
      cached.promise = null;
      throw error;
    });

  try {
    // Await and cache the successful connection
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Clear promise on error to allow retry
    cached.promise = null;
    throw error;
  }
}

/**
 * Gracefully disconnects from MongoDB.
 *
 * Useful for:
 * - Cleaning up connections in tests
 * - Graceful shutdown of the application
 * - Preventing connection leaks
 *
 * @example
 * ```typescript
 * import { disconnectDB } from '@/lib/mongodb';
 *
 * await disconnectDB();
 * ```
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

/**
 * Checks if currently connected to MongoDB.
 *
 * @returns {boolean} True if connection exists, false otherwise
 */
export function isConnected(): boolean {
  return cached.conn !== null;
}
