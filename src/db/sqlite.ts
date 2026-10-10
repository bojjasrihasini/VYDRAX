/**
 * VYTRIX SQLite Database Manager
 * Uses sql.js (WebAssembly SQLite) with persistent binary file backup to disk
 */

import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import {
  Brand,
  OfficialSocialAsset,
  OfficialApp,
  CandidateSocialProfile,
  CandidateApp,
  Finding,
  FindingEvidence,
  InvestigationNote,
  StatusHistoryItem,
  ScanJob,
  DataSource,
  FindingStatus,
} from '../types/index.ts';
import {
  SEED_BRANDS,
  SEED_OFFICIAL_SOCIAL,
  SEED_OFFICIAL_APPS,
  SEED_CANDIDATE_SOCIAL,
  SEED_CANDIDATE_APPS,
  SEED_DATA_SOURCES,
} from './seeds.ts';
import { evaluateSocialCandidate, evaluateAppCandidate } from '../detection/engine.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'vytrix.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS url_scans (
          id TEXT PRIMARY KEY,
          submitted_url TEXT NOT NULL,
          normalized_domain TEXT NOT NULL,
          protocol TEXT,
          risk_score INTEGER NOT NULL,
          verdict TEXT NOT NULL,
          confidence TEXT NOT NULL,
          key_reasons TEXT,
          full_result_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      return dbInstance;
    } catch (e) {
      console.warn('Existing SQLite file corrupted or unreadable. Initializing fresh DB.', e);
    }
  }

  dbInstance = new SQL.Database();
  initSchemaAndSeeds(dbInstance);
  saveDbToDisk();
  return dbInstance;
}

export function saveDbToDisk(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite DB to disk:', err);
  }
}

function initSchemaAndSeeds(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      website TEXT NOT NULL,
      logo_url TEXT,
      keywords TEXT,
      aliases TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS official_social_assets (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      account_url TEXT NOT NULL,
      username TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS official_apps (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      app_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      listing_url TEXT NOT NULL,
      package_id TEXT NOT NULL,
      developer_name TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidate_social_profiles (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      profile_url TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      followers INTEGER DEFAULT 0,
      source_type TEXT DEFAULT 'demo',
      associated_brand_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_apps (
      id TEXT PRIMARY KEY,
      app_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      listing_url TEXT NOT NULL,
      package_id TEXT NOT NULL,
      developer_name TEXT NOT NULL,
      icon_url TEXT,
      description TEXT,
      downloads TEXT,
      rating REAL,
      source_type TEXT DEFAULT 'demo',
      associated_brand_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      candidate_type TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      target_name TEXT NOT NULL,
      target_identifier TEXT NOT NULL,
      target_url TEXT NOT NULL,
      avatar_url TEXT,
      risk_score INTEGER NOT NULL,
      severity TEXT NOT NULL,
      name_similarity INTEGER NOT NULL,
      logo_similarity INTEGER,
      publisher_mismatch INTEGER DEFAULT 0,
      developer_name TEXT,
      status TEXT DEFAULT 'new',
      recommended_action TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finding_evidence (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      rule_code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      weight REAL NOT NULL,
      score_impact INTEGER NOT NULL,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investigation_notes (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      author TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scan_jobs (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      status TEXT NOT NULL,
      candidates_evaluated INTEGER DEFAULT 0,
      threats_found INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL,
      last_scan TEXT,
      error_message TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS url_scans (
      id TEXT PRIMARY KEY,
      submitted_url TEXT NOT NULL,
      normalized_domain TEXT NOT NULL,
      protocol TEXT,
      risk_score INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      confidence TEXT NOT NULL,
      key_reasons TEXT,
      full_result_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Insert Brands
  for (const b of SEED_BRANDS) {
    db.run(
      `INSERT INTO brands (id, name, description, website, logo_url, keywords, aliases, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.id,
        b.name,
        b.description,
        b.website,
        b.logo_url || null,
        JSON.stringify(b.keywords),
        JSON.stringify(b.aliases),
        b.created_at,
        b.updated_at,
      ]
    );
  }

  // Insert Official Social Assets
  for (const s of SEED_OFFICIAL_SOCIAL) {
    db.run(
      `INSERT INTO official_social_assets (id, brand_id, platform, account_url, username, is_verified, verified_by, verified_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.brand_id,
        s.platform,
        s.account_url,
        s.username,
        s.is_verified ? 1 : 0,
        s.verified_by || null,
        s.verified_at || null,
        s.created_at,
      ]
    );
  }

  // Insert Official Apps
  for (const a of SEED_OFFICIAL_APPS) {
    db.run(
      `INSERT INTO official_apps (id, brand_id, app_name, platform, listing_url, package_id, developer_name, is_verified, verified_by, verified_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.brand_id,
        a.app_name,
        a.platform,
        a.listing_url,
        a.package_id,
        a.developer_name,
        a.is_verified ? 1 : 0,
        a.verified_by || null,
        a.verified_at || null,
        a.created_at,
      ]
    );
  }

  // Insert Candidates Social
  for (const c of SEED_CANDIDATE_SOCIAL) {
    db.run(
      `INSERT INTO candidate_social_profiles (id, platform, username, display_name, profile_url, avatar_url, bio, followers, source_type, associated_brand_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.platform,
        c.username,
        c.display_name,
        c.profile_url,
        c.avatar_url || null,
        c.bio || null,
        c.followers || 0,
        c.source_type,
        c.associated_brand_id || null,
        c.created_at,
      ]
    );
  }

  // Insert Candidates Apps
  for (const a of SEED_CANDIDATE_APPS) {
    db.run(
      `INSERT INTO candidate_apps (id, app_name, platform, listing_url, package_id, developer_name, icon_url, description, downloads, rating, source_type, associated_brand_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.app_name,
        a.platform,
        a.listing_url,
        a.package_id,
        a.developer_name,
        a.icon_url || null,
        a.description || null,
        a.downloads || null,
        a.rating || null,
        a.source_type,
        a.associated_brand_id || null,
        a.created_at,
      ]
    );
  }

  // Insert Data Sources
  for (const ds of SEED_DATA_SOURCES) {
    db.run(
      `INSERT INTO data_sources (id, name, type, platform, status, last_scan, error_message, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ds.id, ds.name, ds.type, ds.platform, ds.status, ds.last_scan || null, ds.error_message || null, ds.description]
    );
  }

  // Run initial scan to populate findings using detection engine
  runInitialSeedScan(db);
}

function runInitialSeedScan(db: Database): void {
  const brand = SEED_BRANDS[0]; // Vytrix Financial
  const offSocial = SEED_OFFICIAL_SOCIAL.filter((s) => s.brand_id === brand.id);
  const offApps = SEED_OFFICIAL_APPS.filter((a) => a.brand_id === brand.id);

  let threatsFound = 0;

  // Process Social Candidates
  for (const cand of SEED_CANDIDATE_SOCIAL) {
    const result = evaluateSocialCandidate(cand, brand, offSocial);
    // Notice: Exact official account is excluded! (result.isExcludedAsOfficial is true)
    if (result.isThreat && !result.isExcludedAsOfficial) {
      threatsFound++;
      const findingId = `find-soc-${cand.id}`;
      const now = new Date().toISOString();
      const status: FindingStatus = threatsFound === 1 ? 'investigating' : 'new';

      db.run(
        `INSERT INTO findings (id, brand_id, candidate_type, candidate_id, platform, target_name, target_identifier, target_url, avatar_url, risk_score, severity, name_similarity, logo_similarity, publisher_mismatch, developer_name, status, recommended_action, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          findingId,
          brand.id,
          'social',
          cand.id,
          cand.platform,
          cand.display_name,
          `@${cand.username}`,
          cand.profile_url,
          cand.avatar_url || null,
          result.riskScore,
          result.severity,
          result.nameSimilarity,
          result.logoSimilarity ?? null,
          result.publisherMismatch ? 1 : 0,
          null,
          status,
          result.recommendedAction,
          cand.created_at,
          now,
        ]
      );

      // Insert Evidence
      for (let i = 0; i < result.evidence.length; i++) {
        const ev = result.evidence[i];
        db.run(
          `INSERT INTO finding_evidence (id, finding_id, rule_code, title, description, weight, score_impact)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`ev-${findingId}-${i}`, findingId, ev.rule_code, ev.title, ev.description, ev.weight, ev.score_impact]
        );
      }

      // Initial investigation note for the investigating case
      if (status === 'investigating') {
        db.run(
          `INSERT INTO investigation_notes (id, finding_id, author, note, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            `note-${findingId}-1`,
            findingId,
            'Senior SecOps Analyst',
            'Candidate flagged for brand impersonation and active phishing bio. Preparing DMCA notice for Instagram Trust & Safety.',
            now,
          ]
        );
        db.run(
          `INSERT INTO status_history (id, finding_id, old_status, new_status, changed_by, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `hist-${findingId}-1`,
            findingId,
            'new',
            'investigating',
            'Senior SecOps Analyst',
            'Assigned for rapid takedown assessment',
            now,
          ]
        );
      }
    }
  }

  // Process App Candidates
  for (const cand of SEED_CANDIDATE_APPS) {
    const result = evaluateAppCandidate(cand, brand, offApps);
    if (result.isThreat && !result.isExcludedAsOfficial) {
      threatsFound++;
      const findingId = `find-app-${cand.id}`;
      const now = new Date().toISOString();

      db.run(
        `INSERT INTO findings (id, brand_id, candidate_type, candidate_id, platform, target_name, target_identifier, target_url, avatar_url, risk_score, severity, name_similarity, logo_similarity, publisher_mismatch, developer_name, status, recommended_action, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          findingId,
          brand.id,
          'app',
          cand.id,
          cand.platform,
          cand.app_name,
          cand.package_id,
          cand.listing_url,
          cand.icon_url || null,
          result.riskScore,
          result.severity,
          result.nameSimilarity,
          result.logoSimilarity ?? null,
          result.publisherMismatch ? 1 : 0,
          cand.developer_name,
          'new',
          result.recommendedAction,
          cand.created_at,
          now,
        ]
      );

      for (let i = 0; i < result.evidence.length; i++) {
        const ev = result.evidence[i];
        db.run(
          `INSERT INTO finding_evidence (id, finding_id, rule_code, title, description, weight, score_impact)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`ev-${findingId}-${i}`, findingId, ev.rule_code, ev.title, ev.description, ev.weight, ev.score_impact]
        );
      }
    }
  }

  // Add initial scan job record
  db.run(
    `INSERT INTO scan_jobs (id, brand_id, scan_type, status, candidates_evaluated, threats_found, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'scan-initial-01',
      brand.id,
      'all',
      'completed',
      SEED_CANDIDATE_SOCIAL.length + SEED_CANDIDATE_APPS.length,
      threatsFound,
      '2026-04-09T20:00:00Z',
      '2026-04-09T20:00:04Z',
    ]
  );
}
