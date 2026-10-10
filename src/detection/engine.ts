/**
 * VYTRIX Detection Engine
 * Core detection pipeline: Normalization -> Official Exclusion -> Similarity -> Risk Scoring -> Evidence
 */

import {
  Brand,
  OfficialSocialAsset,
  OfficialApp,
  CandidateSocialProfile,
  CandidateApp,
  DetectionResult,
  SeverityLevel,
} from '../types/index.ts';
import {
  normalizeString,
  extractHandle,
  calculateCompositeSimilarity,
  detectCharacterSwaps,
  detectHomoglyphs,
  findDeceptiveWords,
} from './algorithms.ts';

export interface ScanOptions {
  similarityThreshold?: number; // default 50
  minRiskForThreat?: number;    // default 40
}

/**
 * Maps risk score (0-100) to severity tier
 */
export function calculateSeverity(score: number): SeverityLevel {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Evaluates a social media candidate profile against a registered brand
 */
export function evaluateSocialCandidate(
  candidate: CandidateSocialProfile,
  brand: Brand,
  officialAssets: OfficialSocialAsset[],
  options: ScanOptions = {}
): DetectionResult {
  const candHandle = extractHandle(candidate.username);
  const candNorm = normalizeString(candHandle);
  const candPlatform = candidate.platform;

  // STEP 1: Official Asset Exclusion Check
  // Check if candidate matches any registered official account on the same platform
  for (const official of officialAssets) {
    if (official.platform.toLowerCase() === candPlatform.toLowerCase()) {
      const offHandle = extractHandle(official.username);
      const offNorm = normalizeString(offHandle);

      if (candNorm === offNorm || (official.account_url && candidate.profile_url && official.account_url.toLowerCase() === candidate.profile_url.toLowerCase())) {
        return {
          isExcludedAsOfficial: true,
          exclusionReason: `Exact registered official account match (@${official.username} on ${official.platform}). Excluded from impersonation threats.`,
          isThreat: false,
          nameSimilarity: 100,
          logoSimilarity: undefined,
          publisherMismatch: false,
          riskScore: 0,
          severity: 'low',
          evidence: [
            {
              rule_code: 'OFFICIAL_ASSET_EXCLUSION',
              title: 'Registered Official Asset',
              description: `Identifier @${official.username} is registered and designated as trusted official brand asset.`,
              weight: 0,
              score_impact: 0,
            },
          ],
          recommendedAction: 'No action required (Official Asset). Maintain verified monitoring status.',
        };
      }
    }
  }

  // STEP 2: Name Similarity & Look-alike Analysis
  const targetsToCompare = [
    brand.name,
    ...(brand.aliases || []),
    ...officialAssets.map((a) => a.username),
  ].filter(Boolean);

  let maxSimilarityScore = 0;
  let bestTarget = brand.name;
  let simDetails: ReturnType<typeof calculateCompositeSimilarity> | null = null;

  for (const target of targetsToCompare) {
    const sim = calculateCompositeSimilarity(candHandle, target);
    if (sim.score > maxSimilarityScore) {
      maxSimilarityScore = sim.score;
      bestTarget = target;
      simDetails = sim;
    }

    // Also compare candidate display name if available
    if (candidate.display_name) {
      const dispSim = calculateCompositeSimilarity(candidate.display_name, target);
      if (dispSim.score > maxSimilarityScore) {
        maxSimilarityScore = dispSim.score;
        bestTarget = target;
        simDetails = dispSim;
      }
    }
  }

  const evidenceList: DetectionResult['evidence'] = [];
  let calculatedRisk = 0;

  // Check 1: Base Name Similarity
  if (maxSimilarityScore >= (options.similarityThreshold || 50)) {
    const impact = Math.round(maxSimilarityScore * 0.45);
    calculatedRisk += impact;
    evidenceList.push({
      rule_code: 'NAME_SIMILARITY_MATCH',
      title: 'High Name Similarity',
      description: `Candidate handle/name '${candidate.username}' exhibits ${maxSimilarityScore}% similarity to official brand '${bestTarget}'.`,
      weight: 0.45,
      score_impact: impact,
    });
  }

  // Targets for specific pattern checks (swaps, homoglyphs)
  const patternTargets = [
    brand.name,
    ...(brand.aliases || []),
    ...brand.name.toLowerCase().split(/\s+/),
    ...officialAssets.map((a) => a.username),
  ].filter(Boolean);

  // Check 2: Homoglyph / Leetspeak Substitution
  let homoglyphs: { hasHomoglyph: boolean; substituted: string[] } = { hasHomoglyph: false, substituted: [] };
  for (const t of patternTargets) {
    const h = detectHomoglyphs(candHandle, t);
    if (h.hasHomoglyph) {
      homoglyphs = h;
      break;
    }
  }

  if (homoglyphs.hasHomoglyph) {
    calculatedRisk += 30;
    evidenceList.push({
      rule_code: 'HOMOGLYPH_SUBSTITUTION',
      title: 'Character Substitution (Homoglyphs / Leetspeak)',
      description: `Detected visually deceptive character substitutions: ${homoglyphs.substituted.join(', ')}.`,
      weight: 0.3,
      score_impact: 30,
    });
  }

  // Check 3: Character Swaps (Transposition)
  let swapCheck: { isSwap: boolean; swappedChars?: string } = { isSwap: false };
  for (const t of patternTargets) {
    const s = detectCharacterSwaps(candHandle, t);
    if (s.isSwap) {
      swapCheck = s;
      break;
    }
  }

  if (swapCheck.isSwap) {
    calculatedRisk += 25;
    evidenceList.push({
      rule_code: 'CHARACTER_TRANSPOSITION',
      title: 'Adjacent Character Swap',
      description: `Detected character transposition: swapped ${swapCheck.swappedChars} to mimic brand spelling.`,
      weight: 0.25,
      score_impact: 25,
    });
  }

  // Check 4: Deceptive Brand Keywords (support, verify, official, etc.)
  const fullTextToInspect = `${candidate.username} ${candidate.display_name || ''} ${candidate.bio || ''}`;
  const deceptiveWords = findDeceptiveWords(fullTextToInspect);

  if (deceptiveWords.length > 0 && maxSimilarityScore >= 40) {
    const impact = Math.min(35, 18 + deceptiveWords.length * 7);
    calculatedRisk += impact;
    evidenceList.push({
      rule_code: 'DECEPTIVE_KEYWORD_COMPOUND',
      title: 'Deceptive Impersonation Keywords',
      description: `Contains high-risk trust-harvesting keywords: [${deceptiveWords.join(', ')}].`,
      weight: 0.35,
      score_impact: impact,
    });
  }

  // Check 5: Social Bio Suspicious Patterns (credential harvesting, external unverified links)
  if (candidate.bio) {
    const bioLower = candidate.bio.toLowerCase();
    const hasPhishingSignals =
      bioLower.includes('dm to claim') ||
      bioLower.includes('password reset') ||
      bioLower.includes('send seed phrase') ||
      bioLower.includes('urgent assistance') ||
      bioLower.includes('account unlock') ||
      bioLower.includes('customer care hotline');

    if (hasPhishingSignals) {
      calculatedRisk += 20;
      evidenceList.push({
        rule_code: 'PHISHING_INTENT_BIO',
        title: 'Phishing & Credential Harvest Indicators in Bio',
        description: 'Profile biography contains social-engineering urgency prompts and unauthorized triage language.',
        weight: 0.2,
        score_impact: 20,
      });
    }
  }

  // Cap risk score at 100
  const finalRiskScore = Math.min(100, Math.max(0, calculatedRisk));
  const severity = calculateSeverity(finalRiskScore);
  const isThreat = finalRiskScore >= (options.minRiskForThreat || 40);

  // Recommended next action
  let recommendedAction = 'Routine observation. No urgent risk detected.';
  if (severity === 'critical') {
    recommendedAction = `Initiate immediate expedited takedown notice with ${candidate.platform} Legal & Safety; alert fraud team.`;
  } else if (severity === 'high') {
    recommendedAction = `Submit impersonation report to ${candidate.platform} Trust & Safety. Request handle revocation.`;
  } else if (severity === 'medium') {
    recommendedAction = 'Flag for analyst triage; monitor profile updates and bio links for active phishing campaigns.';
  }

  return {
    isExcludedAsOfficial: false,
    isThreat,
    nameSimilarity: maxSimilarityScore,
    logoSimilarity: undefined, // Missing logo is neutral
    publisherMismatch: false,
    riskScore: finalRiskScore,
    severity,
    evidence: evidenceList,
    recommendedAction,
  };
}

/**
 * Evaluates a candidate mobile application against a registered brand
 */
export function evaluateAppCandidate(
  candidate: CandidateApp,
  brand: Brand,
  officialApps: OfficialApp[],
  options: ScanOptions = {}
): DetectionResult {
  const candPkg = candidate.package_id?.trim().toLowerCase() || '';
  const candListing = candidate.listing_url?.trim().toLowerCase() || '';

  // STEP 1: Official App Exclusion Check
  for (const official of officialApps) {
    const offPkg = official.package_id?.trim().toLowerCase();
    const offListing = official.listing_url?.trim().toLowerCase();

    const isPkgMatch = offPkg && candPkg && offPkg === candPkg;
    const isUrlMatch = offListing && candListing && offListing === candListing;

    if (isPkgMatch || isUrlMatch) {
      return {
        isExcludedAsOfficial: true,
        exclusionReason: `Exact registered official mobile application match (Package: ${official.package_id}). Excluded from threat monitoring.`,
        isThreat: false,
        nameSimilarity: 100,
        logoSimilarity: undefined,
        publisherMismatch: false,
        riskScore: 0,
        severity: 'low',
        evidence: [
          {
            rule_code: 'OFFICIAL_APP_EXCLUSION',
            title: 'Registered Official Application',
            description: `Package '${official.package_id}' is verified and registered under official publisher '${official.developer_name}'.`,
            weight: 0,
            score_impact: 0,
          },
        ],
        recommendedAction: 'No action required (Official Application). Continue monitoring store ratings.',
      };
    }
  }

  // STEP 2: Name & Package Similarity
  const appTargets = [
    brand.name,
    ...(brand.aliases || []),
    ...officialApps.map((a) => a.app_name),
  ].filter(Boolean);

  let maxSimilarityScore = 0;
  let bestTarget = brand.name;

  for (const target of appTargets) {
    const sim = calculateCompositeSimilarity(candidate.app_name, target);
    if (sim.score > maxSimilarityScore) {
      maxSimilarityScore = sim.score;
      bestTarget = target;
    }
  }

  // Also check package ID for brand token
  const normBrand = normalizeString(brand.name);
  const pkgContainsBrand = candPkg.includes(normBrand);

  const evidenceList: DetectionResult['evidence'] = [];
  let calculatedRisk = 0;

  // Name similarity factor
  if (maxSimilarityScore >= (options.similarityThreshold || 45)) {
    const impact = Math.round(maxSimilarityScore * 0.4);
    calculatedRisk += impact;
    evidenceList.push({
      rule_code: 'APP_NAME_SIMILARITY',
      title: 'Look-alike Mobile Application Name',
      description: `Application title '${candidate.app_name}' is ${maxSimilarityScore}% similar to official brand '${bestTarget}'.`,
      weight: 0.4,
      score_impact: impact,
    });
  }

  // STEP 3: Publisher Mismatch Check
  // A different developer alone is not proof of fraud, but combined with brand name mimicry it is high risk!
  let publisherMismatch = false;
  const officialPublishers = officialApps
    .map((a) => a.developer_name?.trim().toLowerCase())
    .filter(Boolean);

  if (candidate.developer_name && officialPublishers.length > 0) {
    const candDev = candidate.developer_name.trim().toLowerCase();
    const matchesOfficialDev = officialPublishers.some((dev) => dev === candDev || candDev.includes(dev));

    if (!matchesOfficialDev && (maxSimilarityScore >= 45 || pkgContainsBrand)) {
      publisherMismatch = true;
      calculatedRisk += 25;
      evidenceList.push({
        rule_code: 'PUBLISHER_MISMATCH',
        title: 'Unauthorized Developer / Publisher Mismatch',
        description: `App published by '${candidate.developer_name}', which does not match registered publisher(s): [${officialPublishers.join(', ')}].`,
        weight: 0.25,
        score_impact: 25,
      });
    }
  }

  // Package Name Deception Check
  if (pkgContainsBrand) {
    calculatedRisk += 15;
    evidenceList.push({
      rule_code: 'PACKAGE_ID_BRAND_USE',
      title: 'Brand Mark in Package Identifier',
      description: `Package identifier '${candidate.package_id}' embeds protected brand trademark '${normBrand}'.`,
      weight: 0.15,
      score_impact: 15,
    });
  }

  // Deceptive Terms in App Description / Title
  const appText = `${candidate.app_name} ${candidate.description || ''}`;
  const deceptiveTerms = findDeceptiveWords(appText);
  if (deceptiveTerms.length > 0 && (maxSimilarityScore >= 40 || pkgContainsBrand)) {
    const impact = Math.min(30, 15 + deceptiveTerms.length * 5);
    calculatedRisk += impact;
    evidenceList.push({
      rule_code: 'DECEPTIVE_APP_TERMS',
      title: 'High-Risk Terms in App Listing',
      description: `Listing contains misleading keywords: [${deceptiveTerms.join(', ')}].`,
      weight: 0.3,
      score_impact: impact,
    });
  }

  // Third-party APK risk
  if (candidate.platform === 'Third-Party APK') {
    calculatedRisk += 15;
    evidenceList.push({
      rule_code: 'UNOFFICIAL_APK_DISTRIBUTION',
      title: 'Unvetted Third-Party App Store Distribution',
      description: 'Application is distributed via an unverified APK repository without standard store security signing.',
      weight: 0.15,
      score_impact: 15,
    });
  }

  const finalRiskScore = Math.min(100, Math.max(0, calculatedRisk));
  const severity = calculateSeverity(finalRiskScore);
  const isThreat = finalRiskScore >= (options.minRiskForThreat || 40);

  let recommendedAction = 'Maintain standard monitoring. No critical infringement detected.';
  if (severity === 'critical') {
    recommendedAction = `Submit formal IP / Trademark Takedown Notice to ${candidate.platform} Developer Security; request immediate APK suspension.`;
  } else if (severity === 'high') {
    recommendedAction = `Issue Cease & Desist to developer '${candidate.developer_name}' and file brand abuse claim with store operator.`;
  } else if (severity === 'medium') {
    recommendedAction = 'Analyze APK payload in sandbox for embedded credential logging; monitor installation volume.';
  }

  return {
    isExcludedAsOfficial: false,
    isThreat,
    nameSimilarity: maxSimilarityScore,
    logoSimilarity: undefined,
    publisherMismatch,
    riskScore: finalRiskScore,
    severity,
    evidence: evidenceList,
    recommendedAction,
  };
}
