const fs = require('fs');
const path = require('path');
const { prisma } = require('./index');

function schemaName(influencerId) {
  return `schema_${influencerId.replace(/-/g, '_')}`;
}

/**
 * Run a callback inside a transaction scoped to the influencer's schema.
 * Uses SET LOCAL so the search_path resets automatically when the transaction ends.
 */
async function withTenantSchema(influencerId, callback) {
  const schema = schemaName(influencerId);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}", public`);
    return callback(tx);
  });
}

/**
 * Create the tenant schema and its tables for a new influencer account.
 * Reads prisma/tenant-schema.sql from the project root and substitutes {schema_name}.
 */
async function createTenantSchema(influencerId) {
  const schema = schemaName(influencerId);
  // Check local apps/api/prisma/ first (Railway), then fall back to repo root prisma/
  const localSql  = path.join(__dirname, '..', 'prisma', 'tenant-schema.sql');
  const rootSql   = path.join(process.cwd(), 'prisma', 'tenant-schema.sql');
  const sqlPath   = fs.existsSync(localSql) ? localSql : rootSql;
  const sqlTemplate = fs.readFileSync(sqlPath, 'utf8');
  const sql = sqlTemplate.replace(/\{schema_name\}/g, schema);

  // Split on semicolons, execute each non-empty statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }

  console.log(`[tenant] Schema created: ${schema}`);
}

/**
 * Raw query helpers that prepend SET LOCAL search_path inside a transaction.
 */
async function tenantQuery(influencerId, sql, params = []) {
  return withTenantSchema(influencerId, async (tx) => {
    return tx.$queryRawUnsafe(sql, ...params);
  });
}

async function tenantExecute(influencerId, sql, params = []) {
  return withTenantSchema(influencerId, async (tx) => {
    return tx.$executeRawUnsafe(sql, ...params);
  });
}

module.exports = { withTenantSchema, createTenantSchema, tenantQuery, tenantExecute, schemaName };
