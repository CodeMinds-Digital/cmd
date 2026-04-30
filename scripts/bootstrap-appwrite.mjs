#!/usr/bin/env node
// Bootstrap an Appwrite project from appwrite.json.
// Idempotent — re-runs are safe; existing resources are skipped.
// Usage: node scripts/bootstrap-appwrite.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  Client,
  Databases,
  Storage,
  Teams,
  Permission,
  Role,
  DatabasesIndexType as IndexType,
  Compression,
} from 'node-appwrite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

function loadEnv() {
  const raw = readFileSync(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing env. Need NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);

const config = JSON.parse(readFileSync(resolve(repoRoot, 'appwrite.json'), 'utf8'));

const log = {
  step: (s) => console.log(`\n> ${s}`),
  ok: (s) => console.log(`  + ${s}`),
  skip: (s) => console.log(`  - ${s} (already exists)`),
};

const isExists = (e) => e?.code === 409 || /already exists/i.test(e?.message ?? '');

function parsePermissions(perms) {
  return (perms ?? []).map((p) => {
    const m = /^(read|create|update|delete)\("([^"]+)"\)$/.exec(p);
    if (!m) throw new Error(`Could not parse permission: ${p}`);
    const [, op, role] = m;
    let r;
    if (role === 'any') r = Role.any();
    else if (role === 'users') r = Role.users();
    else if (role.startsWith('team:')) r = Role.team(role.slice(5));
    else throw new Error(`Unknown role: ${role}`);
    return Permission[op](r);
  });
}

async function ensureDatabase(db) {
  log.step(`Database ${db.$id}`);
  try {
    await databases.get(db.$id);
    log.skip(db.$id);
  } catch (e) {
    if (e?.code !== 404) throw e;
    await databases.create(db.$id, db.name, db.enabled ?? true);
    log.ok(`created ${db.$id}`);
  }
}

async function ensureCollection(coll) {
  log.step(`Collection ${coll.$id}`);
  try {
    await databases.getCollection(coll.databaseId, coll.$id);
    log.skip(coll.$id);
  } catch (e) {
    if (e?.code !== 404) throw e;
    await databases.createCollection(
      coll.databaseId,
      coll.$id,
      coll.name,
      parsePermissions(coll.$permissions),
      coll.documentSecurity ?? false,
      coll.enabled ?? true,
    );
    log.ok(`created ${coll.$id}`);
  }
}

/**
 * Cache of existing attribute keys per collection so we can skip already-
 * existing attributes without round-tripping for each. Necessary because
 * Appwrite v1.9 evaluates row-size budget on createAttribute *before* the
 * "already exists" check, so re-running bootstrap on a near-full collection
 * fails with `attribute_limit_exceeded` even though the attribute exists.
 */
const attributeCache = new Map();
async function existingAttributeKeys(databaseId, collectionId) {
  const cacheKey = `${databaseId}:${collectionId}`;
  if (attributeCache.has(cacheKey)) return attributeCache.get(cacheKey);
  try {
    const list = await databases.listAttributes(databaseId, collectionId);
    const keys = new Set(list.attributes.map((a) => a.key));
    attributeCache.set(cacheKey, keys);
    return keys;
  } catch {
    const empty = new Set();
    attributeCache.set(cacheKey, empty);
    return empty;
  }
}

async function ensureAttribute(databaseId, collectionId, attr) {
  const { key, type, required = false, array = false } = attr;

  // Pre-check: if the attribute already exists, skip without calling create.
  const existing = await existingAttributeKeys(databaseId, collectionId);
  if (existing.has(key)) {
    log.skip(`attr ${key}`);
    return;
  }

  try {
    if (type === 'string') {
      if (attr.format === 'email') {
        await databases.createEmailAttribute(databaseId, collectionId, key, required, attr.default, array);
      } else if (attr.format === 'url') {
        await databases.createUrlAttribute(databaseId, collectionId, key, required, attr.default, array);
      } else {
        await databases.createStringAttribute(databaseId, collectionId, key, attr.size ?? 255, required, attr.default, array);
      }
    } else if (type === 'integer') {
      await databases.createIntegerAttribute(databaseId, collectionId, key, required, attr.min, attr.max, attr.default, array);
    } else if (type === 'boolean') {
      await databases.createBooleanAttribute(databaseId, collectionId, key, required, attr.default, array);
    } else if (type === 'datetime') {
      await databases.createDatetimeAttribute(databaseId, collectionId, key, required, attr.default, array);
    } else {
      throw new Error(`Unsupported attribute type: ${type}`);
    }
    log.ok(`attr ${key} (${type}${attr.format ? `:${attr.format}` : ''}${array ? '[]' : ''})`);
    // Update cache so subsequent calls reflect this new attribute.
    existing.add(key);
  } catch (e) {
    if (isExists(e)) {
      log.skip(`attr ${key}`);
      existing.add(key);
    } else throw e;
  }
}

async function ensureIndex(databaseId, collectionId, idx) {
  try {
    const type =
      idx.type === 'unique' ? IndexType.Unique :
      idx.type === 'fulltext' ? IndexType.Fulltext :
      IndexType.Key;
    await databases.createIndex(databaseId, collectionId, idx.key, type, idx.attributes, idx.orders);
    log.ok(`index ${idx.key}`);
  } catch (e) {
    if (isExists(e)) log.skip(`index ${idx.key}`);
    else throw e;
  }
}

async function ensureBucket(b) {
  log.step(`Bucket ${b.$id}`);
  try {
    await storage.getBucket(b.$id);
    log.skip(b.$id);
  } catch (e) {
    if (e?.code !== 404) throw e;
    await storage.createBucket(
      b.$id,
      b.name,
      parsePermissions(b.$permissions),
      false,
      b.enabled ?? true,
      b.maximumFileSize,
      b.allowedFileExtensions,
      b.compression === 'gzip' ? Compression.Gzip : Compression.None,
      b.encryption ?? false,
      b.antivirus ?? true,
    );
    log.ok(`created ${b.$id}`);
  }
}

async function ensureTeam(t) {
  log.step(`Team ${t.$id}`);
  try {
    await teams.get(t.$id);
    log.skip(t.$id);
  } catch (e) {
    if (e?.code !== 404) throw e;
    await teams.create(t.$id, t.name);
    log.ok(`created ${t.$id} (${t.name})`);
  }
}

console.log(`Project:  ${PROJECT_ID}`);
console.log(`Endpoint: ${ENDPOINT}`);

for (const db of config.databases ?? []) {
  await ensureDatabase(db);
}
for (const coll of config.collections ?? []) {
  await ensureCollection(coll);
  for (const attr of coll.attributes ?? []) {
    await ensureAttribute(coll.databaseId, coll.$id, attr);
  }
  if (coll.indexes?.length) {
    await new Promise((r) => setTimeout(r, 2000));
    for (const idx of coll.indexes) {
      await ensureIndex(coll.databaseId, coll.$id, idx);
    }
  }
}
for (const bucket of config.buckets ?? []) {
  await ensureBucket(bucket);
}
for (const team of config.teams ?? []) {
  await ensureTeam(team);
}

console.log('\nBootstrap complete');
