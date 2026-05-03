const Bull = require('bull');

const queues = new Map();

function getPipelineQueue(slug) {
  if (queues.has(slug)) return queues.get(slug);

  const queue = new Bull(`pipeline_${slug}`, {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    },
  });

  queue.on('error', (err) => {
    console.error(`[queue:${slug}] Error:`, err.message);
  });

  queue.on('failed', (job, err) => {
    console.error(`[queue:${slug}] Job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message);
  });

  queues.set(slug, queue);
  return queue;
}

async function closeAllQueues() {
  for (const [slug, queue] of queues) {
    await queue.close();
    queues.delete(slug);
  }
}

module.exports = { getPipelineQueue, closeAllQueues };
