/**
 * FarmPilot Idempotency Management Service
 * Guarantees exactly-once execution for financial, field task, and report mutations.
 * Protects against duplicate submissions caused by rural mobile network reconnects.
 */

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map(); // key -> { status, statusCode, headers, body, createdAt }

export class IdempotencyManager {
  /**
   * Check if a request has already been processed or is currently in-flight
   */
  static check(key) {
    if (!key) return null;
    const record = cache.get(key);
    if (!record) return null;

    if (Date.now() - record.createdAt > IDEMPOTENCY_TTL_MS) {
      cache.delete(key);
      return null;
    }

    return record;
  }

  /**
   * Mark a request as in-flight
   */
  static start(key, requestHash = '') {
    if (!key) return;
    cache.set(key, {
      status: 'IN_FLIGHT',
      requestHash,
      createdAt: Date.now()
    });
  }

  /**
   * Store the final response for an idempotency key
   */
  static complete(key, statusCode, body) {
    if (!key) return;
    cache.set(key, {
      status: 'COMPLETED',
      statusCode,
      body,
      createdAt: Date.now()
    });
  }

  /**
   * Clear expired idempotency entries
   */
  static prune() {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.createdAt > IDEMPOTENCY_TTL_MS) {
        cache.delete(k);
      }
    }
  }

  static getStats() {
    return {
      activeKeysCount: cache.size,
      ttlHours: IDEMPOTENCY_TTL_MS / (3600 * 1000)
    };
  }
}
