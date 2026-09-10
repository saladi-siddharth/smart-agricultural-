/**
 * FarmPilot Integration Circuit Breaker
 * Protects platform stability against external service outages
 * (WeatherAPI, Gemini AI API, Mandi Market Rates).
 */

export const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation, calls proceed
  OPEN: 'OPEN',           // Outage detected, fast-fail to deterministic fallback
  HALF_OPEN: 'HALF_OPEN'  // Testing external service recovery
};

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.state = CircuitState.CLOSED;
    this.failureThreshold = options.failureThreshold || 3;
    this.successThreshold = options.successThreshold || 2;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000; // 30s before testing recovery

    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = null;
    this.totalRequests = 0;
    this.totalFallbacks = 0;
  }

  async execute(action, fallback) {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        console.log(`[CircuitBreaker:${this.name}] Testing recovery (OPEN -> HALF_OPEN)`);
        this.state = CircuitState.HALF_OPEN;
        this.consecutiveSuccesses = 0;
      } else {
        // Fast-fail to fallback
        this.totalFallbacks++;
        return fallback(new Error(`Circuit breaker [${this.name}] is OPEN (Service outage protected)`));
      }
    }

    try {
      const result = await action();

      // On successful call
      if (this.state === CircuitState.HALF_OPEN) {
        this.consecutiveSuccesses++;
        if (this.consecutiveSuccesses >= this.successThreshold) {
          console.log(`[CircuitBreaker:${this.name}] Service recovered (HALF_OPEN -> CLOSED)`);
          this.state = CircuitState.CLOSED;
          this.failureCount = 0;
        }
      } else if (this.state === CircuitState.CLOSED) {
        this.failureCount = 0;
      }

      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
        console.warn(`[CircuitBreaker:${this.name}] Tripped to OPEN state: ${err.message}`);
        this.state = CircuitState.OPEN;
      }

      this.totalFallbacks++;
      return fallback(err);
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      totalRequests: this.totalRequests,
      totalFallbacks: this.totalFallbacks
    };
  }
}

// Global registry of platform circuit breakers
export const circuitBreakers = {
  weather: new CircuitBreaker('WeatherAPI', { failureThreshold: 3, resetTimeoutMs: 20000 }),
  gemini: new CircuitBreaker('GeminiAI', { failureThreshold: 3, resetTimeoutMs: 30000 }),
  mandi: new CircuitBreaker('MandiPrices', { failureThreshold: 3, resetTimeoutMs: 45000 }),
  smtp: new CircuitBreaker('SmtpAlerts', { failureThreshold: 4, resetTimeoutMs: 60000 })
};
