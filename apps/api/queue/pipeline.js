const Redis = require('ioredis');
const { getPipelineQueue } = require('./index');
const agent1 = require('../agents/agent1-foundation');
const agent2 = require('../agents/agent2-layer');
const agent3 = require('../agents/agent3-cleanup');
const agent4 = require('../agents/agent4-finishing');
const { tenantExecute } = require('../db/tenant');

const AGENTS = {
  1: { fn: agent1, name: 'agent1-foundation' },
  2: { fn: agent2, name: 'agent2-layer' },
  3: { fn: agent3, name: 'agent3-cleanup' },
  4: { fn: agent4, name: 'agent4-finishing' },
};

let publisher = null;

function getPublisher() {
  if (!publisher) {
    publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return publisher;
}

async function publishLog(runId, agent, level, message) {
  const event = {
    agent,
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  await getPublisher().publish(`run:${runId}:logs`, JSON.stringify(event));
}

async function updateRunStatus(influencerId, runId, status, extra = {}) {
  const setClauses = ['status = $1'];
  const values = [status];
  let idx = 2;

  for (const [key, val] of Object.entries(extra)) {
    setClauses.push(`${key} = $${idx}`);
    values.push(typeof val === 'object' ? JSON.stringify(val) : val);
    idx++;
  }

  if (status === 'completed' || status === 'failed') {
    setClauses.push(`completed_at = $${idx}`);
    values.push(new Date().toISOString());
    idx++;
  }

  values.push(runId);
  const sql = `UPDATE runs SET ${setClauses.join(', ')} WHERE id = $${idx}`;
  await tenantExecute(influencerId, sql, values);
}

async function appendAgentLog(influencerId, runId, logEntry) {
  const sql = `UPDATE runs SET agent_log = agent_log || $1::jsonb WHERE id = $2`;
  await tenantExecute(influencerId, sql, [JSON.stringify(logEntry), runId]);
}

function startPipelineProcessors(slug) {
  const queue = getPipelineQueue(slug);

  queue.process(async (job) => {
    const { currentAgent, run_id, influencer_id } = job.data;
    const agentDef = AGENTS[currentAgent];

    if (!agentDef) {
      throw new Error(`Unknown agent index: ${currentAgent}`);
    }

    const logEntry = { agent: agentDef.name, started_at: new Date().toISOString() };

    await publishLog(run_id, agentDef.name, 'info', `Starting ${agentDef.name}`);

    let result;
    try {
      result = await agentDef.fn(job, { publishLog, updateRunStatus, appendAgentLog });
    } catch (err) {
      const errorCode = err.code || 'AGENT_ERROR';
      await publishLog(run_id, agentDef.name, 'error', `${agentDef.name} failed: ${err.message}`);
      await updateRunStatus(influencer_id, run_id, 'failed', { error_code: errorCode });
      await appendAgentLog(influencer_id, run_id, {
        ...logEntry,
        completed_at: new Date().toISOString(),
        status: 'error',
        error: err.message,
      });
      throw err;
    }

    await appendAgentLog(influencer_id, run_id, {
      ...logEntry,
      completed_at: new Date().toISOString(),
      status: 'ok',
    });

    await publishLog(run_id, agentDef.name, 'info', `${agentDef.name} completed`);

    if (currentAgent < 4) {
      const nextQueue = getPipelineQueue(slug);
      await nextQueue.add({ ...result, currentAgent: currentAgent + 1 });
      await publishLog(run_id, agentDef.name, 'info', `Queued agent ${currentAgent + 1}`);
    } else {
      await updateRunStatus(influencer_id, run_id, 'completed');
      await publishLog(run_id, agentDef.name, 'info', 'Pipeline completed successfully');
    }

    return result;
  });

  console.log(`[pipeline] Processors started for account: ${slug}`);
}

module.exports = { startPipelineProcessors, publishLog, updateRunStatus, appendAgentLog };
