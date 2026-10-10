# VYTRIX — Digital Risk Protection Platform
### Enterprise Social Media & Mobile App Impersonation Monitoring

VYTRIX is an enterprise-grade Digital Risk Protection (DRP) platform designed to identify fraudulent social media profiles, scam accounts, look-alike company pages, and malicious mobile applications targeting legitimate brands.

---

## 1. System Architecture

```
[ Data Ingestion Adapters ]
  ├── Demonstration Seed Feeds (Instagram, X, Play Store, Apple Store, Dark APKs)
  ├── Authorized External Platform APIs (Optional live tokens)
  └── Custom Candidate Uploads & Bulk CSV Import
               │
               ▼
[ Pipeline Stage 1: Candidate Normalization ]
  ├── NFKD Unicode & Accent Stripping
  ├── Punctuation & Whitespace Normalization (e.g., "v.y.t.r.i.x" → "vytrix")
  └── Handle & Package ID Token Extraction
               │
               ▼
[ Pipeline Stage 2: Official Asset Exclusion Gate (CRITICAL SAFEGUARD) ]
  ├── Cross-reference Candidate Handle against Registered Official Social Accounts
  ├── Cross-reference Package ID & Listing URL against Registered Official Apps
  ├── IF EXACT MATCH: Tag "Official Asset" (Risk Score = 0) ──► EXCLUDE FROM THREAT DB
  └── IF UNMATCHED: Forward to Algorithmic Threat Engine
               │
               ▼
[ Pipeline Stage 3: Algorithmic Similarity & Anomaly Matrix ]
  ├── Jaro-Winkler String Similarity Matrix
  ├── Levenshtein Edit Distance Calculation
  ├── Adjacent Character Transposition (Swap) Detection (e.g., "vyrtix")
  ├── Homoglyph & Leetspeak Replacement Detection (e.g., "vytri1x")
  ├── High-Risk Deceptive Keywords (support, verify, official, helpdesk, bonus)
  └── Publisher Mismatch Verification for Mobile Applications
               │
               ▼
[ Pipeline Stage 4: Explainable Risk Scoring Engine (0 - 100) ]
  ├── Base Similarity Points + Anomaly Weights
  ├── Severity Mapping: Critical (85-100), High (65-84), Medium (40-64), Low (0-39)
  └── Structured Evidence Items & Platform-Specific Recommended Actions
               │
               ▼
[ Pipeline Stage 5: Persistent SQLite Storage (data/vytrix.sqlite) ]
  └── Brands, Official Assets, Candidates, Findings, Evidence, Notes, History
               │
               ▼
[ Pipeline Stage 6: REST API & Analyst Operations Console ]
  ├── Executive Dashboard & Interactive Charts (Recharts)
  ├── Social & App Surveillance Tables with Live Filters
  ├── Interactive Look-alike Sandbox for Demonstration
  ├── Threat Dossier Drawer, Case Workflow, & Analyst Audit Log
  ├── Automated DMCA / Trademark Abuse Takedown Packet Generator
  └── Filtered CSV Export Engine
```

---

## 2. Key Capabilities & Feature Matrix

1. **Brand Profile Management**: Register organizational assets, websites, trademarks, keywords, and multiple official social handles / mobile applications per brand.
2. **Explicit Asset Verification**: Assets are unverified by default. Only explicit SecOps administrator authorization elevates an asset to trusted status.
3. **Official Asset Exclusion Gate**: Guarantees registered official handles (`@vytrix_official`, `@vytrix`) and official app packages (`com.vytrix.banking`) are never flagged as impersonators.
4. **URL Risk Analysis & SSRF-Hardened Investigation**: Deep analysis of suspicious URLs checking structure, IP-as-host, @ userinfo masquerade, DNS records (A, AAAA, MX, NS, TXT), hosting ASN, SSL/TLS certificates, safe redirect chains, and look-alike brand token embedding.
5. **Color-Coded Risk Verdicts & Inconclusive Detection**: Transparent classification (0-29 Low Risk in Green, 30-69 Medium Risk in Orange, 70-100 High Risk in Red, and INCONCLUSIVE - Insufficient Evidence when evidence is unreachable).
6. **Social Media Monitoring**: Monitors Instagram, X (Twitter), LinkedIn, Facebook, and Telegram for look-alike usernames, phishing urgency bios, and homoglyphs.
7. **App Store Monitoring**: Surveils Google Play Store, Apple App Store, and third-party APK mirrors. Correlates publisher mismatches with brand trademarks.
8. **Look-alike Sandbox**: Real-time interactive string testing sandbox for hackathon judges to test any handle or string variation against brand algorithms.
9. **Takedown Notice Dispatcher**: Generates pre-formatted legal DMCA / Trademark Infringement notices tailored to Instagram, X, Google Play, and Apple Legal Operations with one-click clipboard copy.
10. **Automated Test Suite**: Built-in 13-step unit test suite validating all detection heuristics, homoglyphs, transpositions, SSRF protection, and URL classification boundaries.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Motion
- **Backend**: Node.js, Express.js (mounted via Vite dev middleware / full-stack tsx)
- **Database**: SQLite via `sql.js` (WebAssembly SQLite) with persistent binary file backup to disk (`data/vytrix.sqlite`)
- **Testing**: Deterministic standalone unit test runner (`src/detection/tests.ts`)

---

## 4. Installation & Windows Execution Commands

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (bundled with Node.js)

### Step 1: Install Dependencies
```cmd
npm install
```

### Step 2: Run the Automated Detection Engine Tests
```cmd
npm run test
```
*Expected Output: 11/11 tests pass with 100% pass rate.*

### Step 3: Launch the Full-Stack Application
```cmd
npm run dev
```
*The server will start on `http://localhost:3000` with the SQLite database initialized and persistent disk storage active.*

### Step 4: Build for Production
```cmd
npm run build
npm start
```

---

## 5. Judge Demonstration Workflow (5-Minute Tour)

1. **Executive Dashboard (`/`)**:
   - Inspect overall defense metrics: Monitored Brands, Profiles Scanned, Apps Scanned, Active Threats, Resolved Takedowns.
   - Review the Threat Detection Trajectory area chart and Risk Severity distribution donut chart.
   - Review recent high-risk alerts in the priority queue.

2. **Official Asset Exclusion Verification**:
   - Navigate to **Monitored Brands**. Select `Vytrix Financial`.
   - Observe registered official accounts: `@vytrix` (X), `@vytrix_official` (Instagram), and app `com.vytrix.banking` (Google Play Store).
   - Notice the green **Verified Official** status indicator.

3. **Look-alike Detection Sandbox (`/lookalike`)**:
   - Click on the interactive presets:
     - Click **Character Swap** (`vyrtix_care`): Shows detected transposition of `'r'` and `'t'`, score 82 (High).
     - Click **Homoglyph / Leetspeak** (`vytri1x_crypto`): Detects `'1' -> 'i'` replacement, score 88 (Critical).
     - Click **Deceptive Keywords** (`vytrix_support_official`): Flags `'support'` and `'official'`, score 92 (Critical).
     - Click **Official Handle** (`vytrix_official`): Watch the engine trigger **Official Asset Exclusion**, setting Risk Score to 0!
     - Click **Unrelated Legitimate** (`blue_mountain_coffee`): Score 0 (no false positive).

4. **Social & Mobile App Surveillance (`/social` & `/apps`)**:
   - Filter candidates by Platform, Severity, or Case Status.
   - Click **Scan Social Profiles** or **Scan App Listings** to watch the real-time HUD scan candidates and exclude official assets.
   - Click **Import Candidate** to enter any custom test profile or app into the system.

5. **Investigation & Takedown Generation (`/risk`)**:
   - Open a critical case dossier (e.g. `@vytrix_support_official`).
   - Review the side-by-side Official vs Impersonator comparison and algorithmic evidence points.
   - Click **Generate Takedown Notice**: Inspect the pre-formatted legal DMCA/Trademark brief and click **Copy Takedown Packet**.
   - Change the status from `New` to `Investigating` or `Resolved / Takedown`.
   - Add an analyst note (e.g. `Dispatched report to Meta Legal`).

6. **Reports & Real CSV Export (`/reports`)**:
   - Inspect cross-channel threat posture breakdown.
   - Click **Export Findings to CSV** to download `vytrix-threat-report.csv` generated from the live SQLite database.

7. **Engine Diagnostics & Test Suite (`/settings`)**:
   - Click **Run Automated Tests** to run all 11 detection assertions live in the UI!

---

## 6. Demonstration Mode & Live Integration Disclosure

To allow seamless evaluation during hackathons and demonstrations without requiring paid external API subscriptions or rate-limited API keys:
- The platform operates in **Demonstration Mode + Live Local Detection Engine**.
- Candidate profiles are realistic, seeded demonstration assets designed to illustrate real-world phishing vectors.
- All detection heuristics (Levenshtein, Jaro-Winkler, character swaps, homoglyphs, official asset exclusion) execute deterministically against real inputs.
- Optional external live API credentials (Meta Instagram Graph, X API v2, Google Play Developer) can be placed in `.env` as documented in `.env.example`.

---

## 7. Automated Test Suite Specification

| Test ID | Test Case | Target Metric | Result |
| :--- | :--- | :--- | :--- |
| **TEST_01** | Exact Official Account Exclusion | `isExcludedAsOfficial = true, riskScore = 0` | **PASS** |
| **TEST_02** | Exact Official Application Exclusion | `isExcludedAsOfficial = true, riskScore = 0` | **PASS** |
| **TEST_03** | Similar Usernames (Typosquatting) | `isThreat = true, nameSimilarity >= 75%` | **PASS** |
| **TEST_04** | Character Swaps (Transposition) | `CHARACTER_TRANSPOSITION rule triggered` | **PASS** |
| **TEST_05** | Added Deceptive Words (Support/Official) | `DECEPTIVE_KEYWORD_COMPOUND, risk >= 75` | **PASS** |
| **TEST_06** | Spacing & Punctuation Differences | `norm('v.y.t.r.i.x') === 'vytrix'` | **PASS** |
| **TEST_07** | Legitimate Unrelated Names | `isThreat = false, riskScore = 0` | **PASS** |
| **TEST_08** | Missing Logo Data Handling | `logoSimilarity === undefined, 0 penalty` | **PASS** |
| **TEST_09** | Missing Publisher Data Handling | `publisherMismatch = false, 0 penalty` | **PASS** |
| **TEST_10** | Deterministic Scoring & Deduplication | `Identical score & evidence across runs` | **PASS** |
| **TEST_11** | Risk Severity Boundaries | `Crit: 85-100, High: 65-84, Med: 40-64, Low: 0-39` | **PASS** |
| **TEST_12** | SSRF IP Protection & Internal Destination Blocking | `Blocks 127.0.0.1, 10.0.0.1, 169.254.169.254; allows public IP 8.8.8.8` | **PASS** |
| **TEST_13** | URL Risk Scoring Classification Brackets & Inconclusive Verdict | `0-29 Low, 30-69 Medium, 70-100 High, Insufficient Evidence -> Inconclusive` | **PASS** |
