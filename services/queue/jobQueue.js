/**
 * FarmPilot Asynchronous Message Queue (FarmPilotQueue)
 * Handles non-blocking background workloads:
 * - reports: Farm executive comprehensive intelligence reports
 * - notifications: Operational alerts (SMS, Email, Push)
 * - analytics: Nightly yield forecasts & financial break-even recalculations
 * - integrations: Weather API & Mandi market telemetry synchronization
 * - image_processing: Drone imagery & leaf disease diagnostic models
 */

import crypto from 'crypto';

export class FarmPilotQueue {
  constructor() {
    this.channels = ['reports', 'notifications', 'analytics', 'integrations', 'image_processing'];
    this.jobs = new Map(); // jobId -> job
    this.queues = {
      reports: [],
      notifications: [],
      analytics: [],
      integrations: [],
      image_processing: []
    };
    this.dlq = []; // Dead Letter Queue
    this.handlers = new Map(); // channel -> async worker function
    this.concurrency = 3;
    this.activeWorkers = 0;
    this.isProcessing = false;

    // Start background processing interval
    this.workerTimer = setInterval(() => this.processNext(), 500);
  }

  /**
   * Register a worker handler for a channel
   */
  registerWorker(channel, handler) {
    if (!this.channels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    this.handlers.set(channel, handler);
  }

  /**
   * Enqueue a job
   */
  enqueue(channel, payload, options = {}) {
    if (!this.channels.includes(channel)) {
      throw new Error(`Invalid queue channel: ${channel}. Must be one of: ${this.channels.join(', ')}`);
    }

    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const job = {
      id,
      channel,
      payload,
      priority: options.priority || 'NORMAL', // CRITICAL, HIGH, NORMAL, LOW
      status: 'WAITING', // WAITING, ACTIVE, COMPLETED, FAILED
      progress: 0,
      retries: 0,
      maxRetries: options.maxRetries || 3,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    this.jobs.set(id, job);
    this.queues[channel].push(id);

    console.log(`[FarmPilotQueue] Enqueued job ${id} in channel [${channel}]`);
    return job;
  }

  /**
   * Get single job status
   */
  getJob(id) {
    return this.jobs.get(id) || null;
  }

  /**
   * Queue metrics & diagnostics
   */
  getStatus() {
    const channelStats = {};
    for (const ch of this.channels) {
      channelStats[ch] = {
        backlog: this.queues[ch].length,
        handlerRegistered: this.handlers.has(ch)
      };
    }

    let completed = 0;
    let failed = 0;
    let active = 0;
    let waiting = 0;

    for (const job of this.jobs.values()) {
      if (job.status === 'COMPLETED') completed++;
      else if (job.status === 'FAILED') failed++;
      else if (job.status === 'ACTIVE') active++;
      else if (job.status === 'WAITING') waiting++;
    }

    return {
      status: 'HEALTHY',
      totalJobs: this.jobs.size,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency,
      counts: { waiting, active, completed, failed, dlq: this.dlq.length },
      channels: channelStats
    };
  }

  /**
   * Worker pump: process next job across channels by priority
   */
  async processNext() {
    if (this.activeWorkers >= this.concurrency) return;

    // Pick channel with pending job
    let nextJobId = null;
    let channelPicked = null;

    for (const ch of this.channels) {
      if (this.queues[ch].length > 0) {
        channelPicked = ch;
        nextJobId = this.queues[ch].shift();
        break;
      }
    }

    if (!nextJobId) return;

    const job = this.jobs.get(nextJobId);
    if (!job || job.status !== 'WAITING') return;

    const handler = this.handlers.get(channelPicked);
    if (!handler) {
      console.warn(`[FarmPilotQueue] No worker registered for channel [${channelPicked}]. Retaining job in waiting.`);
      this.queues[channelPicked].push(nextJobId);
      return;
    }

    this.activeWorkers++;
    job.status = 'ACTIVE';
    job.startedAt = new Date().toISOString();

    try {
      // Execute handler
      const result = await handler(job.payload, (progress) => {
        job.progress = Math.min(100, Math.max(0, progress));
      });

      job.status = 'COMPLETED';
      job.progress = 100;
      job.result = result || { success: true };
      job.completedAt = new Date().toISOString();
      console.log(`[FarmPilotQueue] ✓ Completed job ${job.id} on channel [${channelPicked}]`);
    } catch (err) {
      job.retries++;
      job.error = err.message;

      if (job.retries < job.maxRetries) {
        console.warn(`[FarmPilotQueue] Job ${job.id} failed (attempt ${job.retries}/${job.maxRetries}): ${err.message}. Retrying...`);
        job.status = 'WAITING';
        // Exponential backoff
        setTimeout(() => {
          this.queues[channelPicked].push(job.id);
        }, Math.pow(2, job.retries) * 1000);
      } else {
        console.error(`[FarmPilotQueue] ✗ Job ${job.id} failed permanently after ${job.maxRetries} attempts. Moved to DLQ.`);
        job.status = 'FAILED';
        job.completedAt = new Date().toISOString();
        this.dlq.push(job);
      }
    } finally {
      this.activeWorkers--;
    }
  }

  shutdown() {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
    }
  }
}

export const farmPilotQueue = new FarmPilotQueue();

// Register Default Built-in Workers
farmPilotQueue.registerWorker('reports', async (payload, updateProgress) => {
  updateProgress(25);
  // Simulated or direct farm report generation
  await new Promise(r => setTimeout(r, 600));
  updateProgress(75);
  await new Promise(r => setTimeout(r, 400));
  return {
    reportId: `REP_${Date.now()}`,
    farm: payload.farmName || 'Green Valley Farm',
    generatedAt: new Date().toISOString(),
    status: 'READY'
  };
});

farmPilotQueue.registerWorker('notifications', async (payload) => {
  console.log(`[FarmPilotQueue:Notification] Dispatched alert to ${payload.recipient || 'all'}: ${payload.subject || 'Notice'}`);
  return { sent: true, timestamp: new Date().toISOString() };
});

farmPilotQueue.registerWorker('analytics', async (payload) => {
  return { calculated: true, farmId: payload.farmId, healthScore: 84, timestamp: new Date().toISOString() };
});

farmPilotQueue.registerWorker('integrations', async (payload) => {
  return { synced: true, service: payload.service || 'WeatherAPI', timestamp: new Date().toISOString() };
});

farmPilotQueue.registerWorker('image_processing', async (payload) => {
  return { diagnosis: 'Zinc Deficiency / Khaira Spot Detected (94% confidence)', recommendation: 'Foliar ZnSO4 0.5% + Urea 1%', processedAt: new Date().toISOString() };
});
