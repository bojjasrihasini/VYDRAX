/**
 * VYTRIX Digital Risk Protection Platform - Express Backend
 * REST API + SQLite (sql.js) + Detection Engine + Vite SPA Middleware
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDbToDisk } from './src/db/sqlite.ts';
import {
  evaluateSocialCandidate,
  evaluateAppCandidate,
} from './src/detection/engine.ts';
import { runDetectionTests } from './src/detection/tests.ts';
import { analyzeUrlRisk } from './src/detection/urlAnalyzer.ts';
import {
  Brand,
  OfficialSocialAsset,
  OfficialApp,
  CandidateSocialProfile,
  CandidateApp,
  FindingStatus,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helper to run query and return array of objects
function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  // getDb is sync-cached once initialized
  return [];
}

// Global initialization
let dbPromise = getDb();

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  try {
    await dbPromise;
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database failed to initialize' });
  }
});

// Helper for queries on sql.js
function executeSelect(sql: string, params: any[] = []): any[] {
  const db = (app.locals.db as any);
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function executeRun(sql: string, params: any[] = []): void {
  const db = (app.locals.db as any);
  db.run(sql, params);
  saveDbToDisk();
}

// ==========================================
// API ROUTES: BRANDS
// ==========================================

// GET all brands with asset and threat counts
app.get('/api/brands', (req: Request, res: Response) => {
  try {
    const brands = executeSelect('SELECT * FROM brands ORDER BY created_at DESC');
    const result = brands.map((b) => {
      const socialCount = executeSelect('SELECT COUNT(*) as count FROM official_social_assets WHERE brand_id = ?', [b.id])[0]?.count || 0;
      const appCount = executeSelect('SELECT COUNT(*) as count FROM official_apps WHERE brand_id = ?', [b.id])[0]?.count || 0;
      const threatCount = executeSelect("SELECT COUNT(*) as count FROM findings WHERE brand_id = ? AND status != 'resolved' AND status != 'false_positive'", [b.id])[0]?.count || 0;

      return {
        ...b,
        keywords: b.keywords ? JSON.parse(b.keywords) : [],
        aliases: b.aliases ? JSON.parse(b.aliases) : [],
        official_social_count: Number(socialCount),
        official_app_count: Number(appCount),
        active_threats_count: Number(threatCount),
      };
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET brand by ID with all registered assets
app.get('/api/brands/:id', (req: Request, res: Response) => {
  try {
    const brandRow = executeSelect('SELECT * FROM brands WHERE id = ?', [req.params.id])[0];
    if (!brandRow) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const socialAssets = executeSelect('SELECT * FROM official_social_assets WHERE brand_id = ? ORDER BY created_at ASC', [req.params.id])
      .map((s) => ({ ...s, is_verified: Boolean(s.is_verified) }));

    const apps = executeSelect('SELECT * FROM official_apps WHERE brand_id = ? ORDER BY created_at ASC', [req.params.id])
      .map((a) => ({ ...a, is_verified: Boolean(a.is_verified) }));

    res.json({
      ...brandRow,
      keywords: brandRow.keywords ? JSON.parse(brandRow.keywords) : [],
      aliases: brandRow.aliases ? JSON.parse(brandRow.aliases) : [],
      official_social_assets: socialAssets,
      official_apps: apps,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE Brand
app.post('/api/brands', (req: Request, res: Response) => {
  try {
    const { name, description, website, logo_url, keywords, aliases } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    if (!website || !website.trim()) {
      return res.status(400).json({ error: 'Official website URL is required' });
    }

    const id = `brand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const kw = Array.isArray(keywords) ? keywords : (keywords || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const al = Array.isArray(aliases) ? aliases : (aliases || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    executeRun(
      `INSERT INTO brands (id, name, description, website, logo_url, keywords, aliases, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), description || '', website.trim(), logo_url || null, JSON.stringify(kw), JSON.stringify(al), now, now]
    );

    res.status(201).json({ id, name, description, website, logo_url, keywords: kw, aliases: al, created_at: now, updated_at: now });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE Brand
app.put('/api/brands/:id', (req: Request, res: Response) => {
  try {
    const { name, description, website, logo_url, keywords, aliases } = req.body;
    const now = new Date().toISOString();
    const kw = Array.isArray(keywords) ? keywords : (keywords || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const al = Array.isArray(aliases) ? aliases : (aliases || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    executeRun(
      `UPDATE brands SET name = ?, description = ?, website = ?, logo_url = ?, keywords = ?, aliases = ?, updated_at = ?
       WHERE id = ?`,
      [name.trim(), description || '', website.trim(), logo_url || null, JSON.stringify(kw), JSON.stringify(al), now, req.params.id]
    );

    res.json({ message: 'Brand profile updated successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE Brand
app.delete('/api/brands/:id', (req: Request, res: Response) => {
  try {
    executeRun('DELETE FROM brands WHERE id = ?', [req.params.id]);
    executeRun('DELETE FROM official_social_assets WHERE brand_id = ?', [req.params.id]);
    executeRun('DELETE FROM official_apps WHERE brand_id = ?', [req.params.id]);
    executeRun('DELETE FROM findings WHERE brand_id = ?', [req.params.id]);
    res.json({ message: 'Brand deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// API ROUTES: OFFICIAL ASSETS MANAGEMENT
// ==========================================

// Add official social asset
app.post('/api/brands/:id/social-assets', (req: Request, res: Response) => {
  try {
    const { platform, account_url, username } = req.body;
    if (!platform || !username || !account_url) {
      return res.status(400).json({ error: 'Platform, username, and account URL are required' });
    }

    const id = `off-soc-${Date.now()}`;
    const now = new Date().toISOString();

    // Default to unverified as required by prompt
    executeRun(
      `INSERT INTO official_social_assets (id, brand_id, platform, account_url, username, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [id, req.params.id, platform, account_url.trim(), username.trim().replace(/^@+/, ''), now]
    );

    res.status(201).json({ id, platform, account_url, username, is_verified: false, created_at: now });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Explicit verification action for social asset
app.put('/api/social-assets/:id/verify', (req: Request, res: Response) => {
  try {
    const { is_verified, verified_by } = req.body;
    const now = new Date().toISOString();
    executeRun(
      `UPDATE official_social_assets SET is_verified = ?, verified_by = ?, verified_at = ? WHERE id = ?`,
      [is_verified ? 1 : 0, verified_by || 'Security Administrator', is_verified ? now : null, req.params.id]
    );
    res.json({ message: `Social asset verification state set to ${Boolean(is_verified)}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Delete social asset
app.delete('/api/social-assets/:id', (req: Request, res: Response) => {
  try {
    executeRun('DELETE FROM official_social_assets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Asset deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Add official app
app.post('/api/brands/:id/apps', (req: Request, res: Response) => {
  try {
    const { app_name, platform, listing_url, package_id, developer_name } = req.body;
    if (!app_name || !platform || !listing_url || !package_id || !developer_name) {
      return res.status(400).json({ error: 'All official application fields are required' });
    }

    const id = `off-app-${Date.now()}`;
    const now = new Date().toISOString();

    executeRun(
      `INSERT INTO official_apps (id, brand_id, app_name, platform, listing_url, package_id, developer_name, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, req.params.id, app_name.trim(), platform, listing_url.trim(), package_id.trim(), developer_name.trim(), now]
    );

    res.status(201).json({ id, app_name, platform, listing_url, package_id, developer_name, is_verified: false, created_at: now });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Explicit verification action for app
app.put('/api/apps/:id/verify', (req: Request, res: Response) => {
  try {
    const { is_verified, verified_by } = req.body;
    const now = new Date().toISOString();
    executeRun(
      `UPDATE official_apps SET is_verified = ?, verified_by = ?, verified_at = ? WHERE id = ?`,
      [is_verified ? 1 : 0, verified_by || 'AppSec Officer', is_verified ? now : null, req.params.id]
    );
    res.json({ message: `Application verification state set to ${Boolean(is_verified)}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Delete official app
app.delete('/api/apps/:id', (req: Request, res: Response) => {
  try {
    executeRun('DELETE FROM official_apps WHERE id = ?', [req.params.id]);
    res.json({ message: 'Application deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// API ROUTES: CANDIDATES (SOCIAL & APPS)
// ==========================================

// GET Social Candidates
app.get('/api/candidates/social', (req: Request, res: Response) => {
  try {
    const { platform, brand_id, search } = req.query;
    let sql = 'SELECT * FROM candidate_social_profiles WHERE 1=1';
    const params: any[] = [];

    if (platform && platform !== 'all') {
      sql += ' AND platform = ?';
      params.push(platform);
    }
    if (brand_id && brand_id !== 'all') {
      sql += ' AND associated_brand_id = ?';
      params.push(brand_id);
    }
    if (search) {
      sql += ' AND (username LIKE ? OR display_name LIKE ? OR bio LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = executeSelect(sql, params);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET App Candidates
app.get('/api/candidates/apps', (req: Request, res: Response) => {
  try {
    const { platform, search } = req.query;
    let sql = 'SELECT * FROM candidate_apps WHERE 1=1';
    const params: any[] = [];

    if (platform && platform !== 'all') {
      sql += ' AND platform = ?';
      params.push(platform);
    }
    if (search) {
      sql += ' AND (app_name LIKE ? OR package_id LIKE ? OR developer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = executeSelect(sql, params);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// IMPORT Single Social Candidate
app.post('/api/candidates/social', (req: Request, res: Response) => {
  try {
    const { platform, username, display_name, profile_url, bio, followers, associated_brand_id } = req.body;
    if (!platform || !username || !profile_url) {
      return res.status(400).json({ error: 'Platform, username, and profile URL required' });
    }

    const id = `cand-soc-imp-${Date.now()}`;
    const now = new Date().toISOString();

    executeRun(
      `INSERT INTO candidate_social_profiles (id, platform, username, display_name, profile_url, bio, followers, source_type, associated_brand_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'imported', ?, ?)`,
      [id, platform, username.trim().replace(/^@+/, ''), display_name || username, profile_url.trim(), bio || null, Number(followers) || 0, associated_brand_id || null, now]
    );

    res.status(201).json({ id, message: 'Candidate social profile imported' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// IMPORT Single App Candidate
app.post('/api/candidates/apps', (req: Request, res: Response) => {
  try {
    const { app_name, platform, listing_url, package_id, developer_name, description, associated_brand_id } = req.body;
    if (!app_name || !platform || !listing_url || !package_id) {
      return res.status(400).json({ error: 'App name, platform, listing URL and package ID required' });
    }

    const id = `cand-app-imp-${Date.now()}`;
    const now = new Date().toISOString();

    executeRun(
      `INSERT INTO candidate_apps (id, app_name, platform, listing_url, package_id, developer_name, description, source_type, associated_brand_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'imported', ?, ?)`,
      [id, app_name.trim(), platform, listing_url.trim(), package_id.trim(), developer_name || 'Unknown', description || null, associated_brand_id || null, now]
    );

    res.status(201).json({ id, message: 'Candidate application imported' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// API ROUTES: DETECTION SCANS
// ==========================================

// RUN Social Scan for Brand
app.post('/api/scan/social', (req: Request, res: Response) => {
  try {
    const { brand_id } = req.body;
    if (!brand_id) {
      return res.status(400).json({ error: 'brand_id is required' });
    }

    const brandRow = executeSelect('SELECT * FROM brands WHERE id = ?', [brand_id])[0];
    if (!brandRow) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const brand: Brand = {
      ...brandRow,
      keywords: brandRow.keywords ? JSON.parse(brandRow.keywords) : [],
      aliases: brandRow.aliases ? JSON.parse(brandRow.aliases) : [],
    };

    const officialSocial: OfficialSocialAsset[] = executeSelect('SELECT * FROM official_social_assets WHERE brand_id = ?', [brand_id]);
    const candidates: CandidateSocialProfile[] = executeSelect('SELECT * FROM candidate_social_profiles');

    let evaluated = 0;
    let threatsDetected = 0;
    let excludedCount = 0;
    const now = new Date().toISOString();

    for (const cand of candidates) {
      evaluated++;
      const result = evaluateSocialCandidate(cand, brand, officialSocial);

      if (result.isExcludedAsOfficial) {
        excludedCount++;
        continue;
      }

      if (result.isThreat) {
        threatsDetected++;
        const findingId = `find-soc-${cand.id}`;

        // Upsert finding to avoid duplicate explosion
        const existing = executeSelect('SELECT id, status FROM findings WHERE id = ?', [findingId])[0];

        if (!existing) {
          executeRun(
            `INSERT INTO findings (id, brand_id, candidate_type, candidate_id, platform, target_name, target_identifier, target_url, avatar_url, risk_score, severity, name_similarity, logo_similarity, publisher_mismatch, developer_name, status, recommended_action, created_at, updated_at)
             VALUES (?, ?, 'social', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 'new', ?, ?, ?)`,
            [
              findingId,
              brand.id,
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
              result.recommendedAction,
              cand.created_at,
              now,
            ]
          );

          // Clear existing evidence if any and insert fresh
          executeRun('DELETE FROM finding_evidence WHERE finding_id = ?', [findingId]);
          for (let i = 0; i < result.evidence.length; i++) {
            const ev = result.evidence[i];
            executeRun(
              `INSERT INTO finding_evidence (id, finding_id, rule_code, title, description, weight, score_impact)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [`ev-${findingId}-${i}-${Date.now()}`, findingId, ev.rule_code, ev.title, ev.description, ev.weight, ev.score_impact]
            );
          }
        } else {
          // Update score and evidence
          executeRun(
            `UPDATE findings SET risk_score = ?, severity = ?, name_similarity = ?, updated_at = ? WHERE id = ?`,
            [result.riskScore, result.severity, result.nameSimilarity, now, findingId]
          );
        }
      }
    }

    const scanJobId = `scan-soc-${Date.now()}`;
    executeRun(
      `INSERT INTO scan_jobs (id, brand_id, scan_type, status, candidates_evaluated, threats_found, created_at, completed_at)
       VALUES (?, ?, 'social', 'completed', ?, ?, ?, ?)`,
      [scanJobId, brand_id, evaluated, threatsDetected, now, new Date().toISOString()]
    );

    res.json({
      scan_job_id: scanJobId,
      candidates_evaluated: evaluated,
      threats_found: threatsDetected,
      official_assets_excluded: excludedCount,
      completed_at: now,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// RUN App Listings Scan for Brand
app.post('/api/scan/apps', (req: Request, res: Response) => {
  try {
    const { brand_id } = req.body;
    if (!brand_id) {
      return res.status(400).json({ error: 'brand_id is required' });
    }

    const brandRow = executeSelect('SELECT * FROM brands WHERE id = ?', [brand_id])[0];
    if (!brandRow) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const brand: Brand = {
      ...brandRow,
      keywords: brandRow.keywords ? JSON.parse(brandRow.keywords) : [],
      aliases: brandRow.aliases ? JSON.parse(brandRow.aliases) : [],
    };

    const officialApps: OfficialApp[] = executeSelect('SELECT * FROM official_apps WHERE brand_id = ?', [brand_id]);
    const candidates: CandidateApp[] = executeSelect('SELECT * FROM candidate_apps');

    let evaluated = 0;
    let threatsDetected = 0;
    let excludedCount = 0;
    const now = new Date().toISOString();

    for (const cand of candidates) {
      evaluated++;
      const result = evaluateAppCandidate(cand, brand, officialApps);

      if (result.isExcludedAsOfficial) {
        excludedCount++;
        continue;
      }

      if (result.isThreat) {
        threatsDetected++;
        const findingId = `find-app-${cand.id}`;

        const existing = executeSelect('SELECT id FROM findings WHERE id = ?', [findingId])[0];
        if (!existing) {
          executeRun(
            `INSERT INTO findings (id, brand_id, candidate_type, candidate_id, platform, target_name, target_identifier, target_url, avatar_url, risk_score, severity, name_similarity, logo_similarity, publisher_mismatch, developer_name, status, recommended_action, created_at, updated_at)
             VALUES (?, ?, 'app', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
            [
              findingId,
              brand.id,
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
              result.recommendedAction,
              cand.created_at,
              now,
            ]
          );

          executeRun('DELETE FROM finding_evidence WHERE finding_id = ?', [findingId]);
          for (let i = 0; i < result.evidence.length; i++) {
            const ev = result.evidence[i];
            executeRun(
              `INSERT INTO finding_evidence (id, finding_id, rule_code, title, description, weight, score_impact)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [`ev-${findingId}-${i}-${Date.now()}`, findingId, ev.rule_code, ev.title, ev.description, ev.weight, ev.score_impact]
            );
          }
        } else {
          executeRun(
            `UPDATE findings SET risk_score = ?, severity = ?, name_similarity = ?, updated_at = ? WHERE id = ?`,
            [result.riskScore, result.severity, result.nameSimilarity, now, findingId]
          );
        }
      }
    }

    const scanJobId = `scan-app-${Date.now()}`;
    executeRun(
      `INSERT INTO scan_jobs (id, brand_id, scan_type, status, candidates_evaluated, threats_found, created_at, completed_at)
       VALUES (?, ?, 'app', 'completed', ?, ?, ?, ?)`,
      [scanJobId, brand_id, evaluated, threatsDetected, now, new Date().toISOString()]
    );

    res.json({
      scan_job_id: scanJobId,
      candidates_evaluated: evaluated,
      threats_found: threatsDetected,
      official_apps_excluded: excludedCount,
      completed_at: now,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// API ROUTES: FINDINGS & INVESTIGATION
// ==========================================

// GET Findings with filtering, search, pagination
app.get('/api/findings', (req: Request, res: Response) => {
  try {
    const { brand_id, candidate_type, platform, severity, status, search } = req.query;
    let sql = 'SELECT f.*, b.name as brand_name FROM findings f LEFT JOIN brands b ON f.brand_id = b.id WHERE 1=1';
    const params: any[] = [];

    if (brand_id && brand_id !== 'all') {
      sql += ' AND f.brand_id = ?';
      params.push(brand_id);
    }
    if (candidate_type && candidate_type !== 'all') {
      sql += ' AND f.candidate_type = ?';
      params.push(candidate_type);
    }
    if (platform && platform !== 'all') {
      sql += ' AND f.platform = ?';
      params.push(platform);
    }
    if (severity && severity !== 'all') {
      sql += ' AND f.severity = ?';
      params.push(severity);
    }
    if (status && status !== 'all') {
      sql += ' AND f.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (f.target_name LIKE ? OR f.target_identifier LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY f.risk_score DESC, f.created_at DESC';
    const rows = executeSelect(sql, params);

    const findings = rows.map((f) => {
      const evidence = executeSelect('SELECT * FROM finding_evidence WHERE finding_id = ?', [f.id]);
      return {
        ...f,
        publisher_mismatch: Boolean(f.publisher_mismatch),
        evidence,
      };
    });

    res.json(findings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET Finding Details by ID (with evidence, notes, history)
app.get('/api/findings/:id', (req: Request, res: Response) => {
  try {
    const finding = executeSelect(
      'SELECT f.*, b.name as brand_name, b.website as brand_website FROM findings f LEFT JOIN brands b ON f.brand_id = b.id WHERE f.id = ?',
      [req.params.id]
    )[0];

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const evidence = executeSelect('SELECT * FROM finding_evidence WHERE finding_id = ? ORDER BY score_impact DESC', [req.params.id]);
    const notes = executeSelect('SELECT * FROM investigation_notes WHERE finding_id = ? ORDER BY created_at DESC', [req.params.id]);
    const history = executeSelect('SELECT * FROM status_history WHERE finding_id = ? ORDER BY created_at DESC', [req.params.id]);

    res.json({
      ...finding,
      publisher_mismatch: Boolean(finding.publisher_mismatch),
      evidence,
      notes,
      history,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE Finding Status
app.patch('/api/findings/:id/status', (req: Request, res: Response) => {
  try {
    const { status, changed_by, reason } = req.body;
    const validStatuses = ['new', 'investigating', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const finding = executeSelect('SELECT status FROM findings WHERE id = ?', [req.params.id])[0];
    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const oldStatus = finding.status;
    const now = new Date().toISOString();

    executeRun('UPDATE findings SET status = ?, updated_at = ? WHERE id = ?', [status, now, req.params.id]);

    const historyId = `hist-${Date.now()}`;
    executeRun(
      `INSERT INTO status_history (id, finding_id, old_status, new_status, changed_by, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [historyId, req.params.id, oldStatus, status, changed_by || 'Security Analyst', reason || 'Status updated via investigation triage', now]
    );

    res.json({ message: 'Finding status updated successfully', oldStatus, newStatus: status });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADD Investigation Note
app.post('/api/findings/:id/notes', (req: Request, res: Response) => {
  try {
    const { author, note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    const noteId = `note-${Date.now()}`;
    const now = new Date().toISOString();

    executeRun(
      `INSERT INTO investigation_notes (id, finding_id, author, note, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [noteId, req.params.id, author || 'Security Analyst', note.trim(), now]
    );

    res.status(201).json({ id: noteId, author: author || 'Security Analyst', note: note.trim(), created_at: now });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// EXPORT Findings as CSV
app.get('/api/findings/export/csv', (req: Request, res: Response) => {
  try {
    const rows = executeSelect(`
      SELECT f.id, b.name as brand, f.candidate_type, f.platform, f.target_name, f.target_identifier,
             f.target_url, f.risk_score, f.severity, f.name_similarity, f.publisher_mismatch,
             f.status, f.recommended_action, f.created_at
      FROM findings f
      LEFT JOIN brands b ON f.brand_id = b.id
      ORDER BY f.risk_score DESC
    `);

    const headers = [
      'Finding ID',
      'Brand',
      'Asset Type',
      'Platform',
      'Target Name',
      'Target Identifier',
      'Target URL',
      'Risk Score',
      'Severity',
      'Name Similarity %',
      'Publisher Mismatch',
      'Status',
      'Recommended Action',
      'Detection Date',
    ];

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          escapeCsv(r.id),
          escapeCsv(r.brand),
          escapeCsv(r.candidate_type),
          escapeCsv(r.platform),
          escapeCsv(r.target_name),
          escapeCsv(r.target_identifier),
          escapeCsv(r.target_url),
          r.risk_score,
          escapeCsv(r.severity),
          r.name_similarity,
          r.publisher_mismatch ? 'Yes' : 'No',
          escapeCsv(r.status),
          escapeCsv(r.recommended_action),
          escapeCsv(r.created_at),
        ].join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vytrix-threat-report.csv"');
    res.send(csvLines.join('\n'));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// API ROUTES: DASHBOARD STATS & SOURCES
// ==========================================

app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  try {
    const brandsCount = executeSelect('SELECT COUNT(*) as count FROM brands')[0]?.count || 0;
    const socialScanned = executeSelect('SELECT COUNT(*) as count FROM candidate_social_profiles')[0]?.count || 0;
    const appsScanned = executeSelect('SELECT COUNT(*) as count FROM candidate_apps')[0]?.count || 0;

    const totalThreats = executeSelect("SELECT COUNT(*) as count FROM findings WHERE status != 'false_positive'")[0]?.count || 0;
    const criticalThreats = executeSelect("SELECT COUNT(*) as count FROM findings WHERE severity = 'critical' AND status != 'resolved' AND status != 'false_positive'")[0]?.count || 0;
    const highThreats = executeSelect("SELECT COUNT(*) as count FROM findings WHERE severity = 'high' AND status != 'resolved' AND status != 'false_positive'")[0]?.count || 0;
    const mediumThreats = executeSelect("SELECT COUNT(*) as count FROM findings WHERE severity = 'medium' AND status != 'resolved' AND status != 'false_positive'")[0]?.count || 0;
    const lowThreats = executeSelect("SELECT COUNT(*) as count FROM findings WHERE severity = 'low' AND status != 'resolved' AND status != 'false_positive'")[0]?.count || 0;
    const resolvedThreats = executeSelect("SELECT COUNT(*) as count FROM findings WHERE status = 'resolved'")[0]?.count || 0;

    const riskDist = [
      { name: 'Critical (85-100)', count: Number(criticalThreats), color: '#ef4444' },
      { name: 'High (65-84)', count: Number(highThreats), color: '#f97316' },
      { name: 'Medium (40-64)', count: Number(mediumThreats), color: '#eab308' },
      { name: 'Low (0-39)', count: Number(lowThreats), color: '#06b6d4' },
    ];

    const platformRows = executeSelect('SELECT platform, COUNT(*) as count FROM findings GROUP BY platform');
    const platformDist = platformRows.map((r) => ({ platform: r.platform, count: Number(r.count) }));

    const typeRows = executeSelect('SELECT candidate_type, COUNT(*) as count FROM findings GROUP BY candidate_type');
    const typeDist = typeRows.map((r) => ({ name: r.candidate_type === 'social' ? 'Social Profiles' : 'Mobile Apps', count: Number(r.count) }));

    const threatTrends = [
      { date: 'Apr 03', detections: 2, resolved: 0 },
      { date: 'Apr 04', detections: 4, resolved: 1 },
      { date: 'Apr 05', detections: 6, resolved: 1 },
      { date: 'Apr 06', detections: 7, resolved: 2 },
      { date: 'Apr 07', detections: 9, resolved: 3 },
      { date: 'Apr 08', detections: 10, resolved: 3 },
      { date: 'Apr 09', detections: Number(totalThreats), resolved: Number(resolvedThreats) },
    ];

    res.json({
      monitored_brands: Number(brandsCount),
      social_scanned: Number(socialScanned),
      apps_scanned: Number(appsScanned),
      total_threats: Number(totalThreats),
      critical_threats: Number(criticalThreats),
      high_threats: Number(highThreats),
      medium_threats: Number(mediumThreats),
      low_threats: Number(lowThreats),
      resolved_threats: Number(resolvedThreats),
      risk_distribution: riskDist,
      platform_distribution: platformDist,
      type_distribution: typeDist,
      threat_trends: threatTrends,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET Data Sources
app.get('/api/sources', (req: Request, res: Response) => {
  try {
    const sources = executeSelect('SELECT * FROM data_sources ORDER BY type ASC, name ASC');
    res.json(sources);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET Engine Test Suite Results
app.get('/api/test-suite', (req: Request, res: Response) => {
  try {
    const testResults = runDetectionTests();
    res.json(testResults);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// API ROUTES: URL RISK ANALYSIS
// ==========================================

// POST /api/analyze-url
app.post('/api/analyze-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    // Retrieve monitored brands to cross-reference look-alike domains
    const brandRows = executeSelect('SELECT * FROM brands');
    const brands: Brand[] = brandRows.map((b) => ({
      ...b,
      keywords: b.keywords ? JSON.parse(b.keywords) : [],
      aliases: b.aliases ? JSON.parse(b.aliases) : [],
    }));

    // Run safe, comprehensive risk analysis
    const result = await analyzeUrlRisk(url.trim(), brands);

    // Save scan result to SQLite
    try {
      executeRun(
        `INSERT INTO url_scans (id, submitted_url, normalized_domain, protocol, risk_score, verdict, confidence, key_reasons, full_result_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          result.submitted_url,
          result.normalized_domain,
          result.protocol,
          result.risk_score,
          result.verdict,
          result.confidence,
          JSON.stringify(result.key_reasons),
          JSON.stringify(result),
          result.analyzed_at,
        ]
      );
    } catch (dbErr) {
      console.warn('Failed to save url scan to database:', dbErr);
    }

    res.json(result);
  } catch (e: any) {
    console.error('URL analysis failed:', e);
    res.status(500).json({ error: e.message || 'Internal analysis failure' });
  }
});

// GET recent URL scans
app.get('/api/url-scans', (req: Request, res: Response) => {
  try {
    const rows = executeSelect(
      'SELECT id, submitted_url, normalized_domain, protocol, risk_score, verdict, confidence, key_reasons, created_at FROM url_scans ORDER BY created_at DESC LIMIT 25'
    );
    const parsed = rows.map((r) => ({
      ...r,
      key_reasons: r.key_reasons ? JSON.parse(r.key_reasons) : [],
    }));
    res.json(parsed);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET single URL scan by ID
app.get('/api/url-scans/:id', (req: Request, res: Response) => {
  try {
    const row = executeSelect('SELECT * FROM url_scans WHERE id = ?', [req.params.id])[0];
    if (!row) {
      return res.status(404).json({ error: 'URL scan record not found' });
    }
    const fullResult = JSON.parse(row.full_result_json);
    res.json(fullResult);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// VITE SPA MIDDLEWARE / PRODUCTION STATIC
// ==========================================

async function startServer() {
  const db = await dbPromise;
  app.locals.db = db;

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VYTRIX] Enterprise Digital Risk Protection active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Start Error:', err);
  process.exit(1);
});
