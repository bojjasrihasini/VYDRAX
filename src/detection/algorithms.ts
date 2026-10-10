/**
 * VYTRIX Detection Engine - Core Algorithms
 * Deterministic string comparison, homoglyphs, Jaro-Winkler, Levenshtein, and keyword analyzers
 */

export const HOMOGLYPH_MAP: Record<string, string[]> = {
  'o': ['0', 'q', 'ö', 'ó', 'ò'],
  '0': ['o', 'O'],
  'l': ['1', 'i', '|', 'I', 'í'],
  '1': ['l', 'i', 'I'],
  'i': ['1', 'l', '!', 'í', 'ï'],
  'e': ['3', 'é', 'è', 'ê'],
  '3': ['e', 'E'],
  'a': ['4', '@', 'á', 'à', 'ä'],
  '4': ['a', 'A'],
  's': ['5', '$', 'z'],
  '5': ['s', 'S'],
  't': ['7', '+'],
  '7': ['t', 'T'],
  'b': ['8', '6'],
  '8': ['b', 'B'],
  'w': ['vv', 'v', 'uu'],
  'm': ['rn', 'nn'],
  'u': ['v', 'ü', 'ú'],
  'v': ['u', 'w'],
};

export const DECEPTIVE_KEYWORDS = [
  'support',
  'verify',
  'verification',
  'verified',
  'official',
  'security',
  'login',
  'auth',
  'help',
  'customercare',
  'care',
  'service',
  'servicedesk',
  'desk',
  'team',
  'recovery',
  'password',
  'bonus',
  'claim',
  'crypto',
  'airdrop',
  'update',
  'portal',
  'wallet',
  'unlock',
  'rewards',
  'giveaway',
  'apk',
  'free',
  'mod',
];

/**
 * Normalizes text by removing diacritics, lowering case, and stripping non-alphanumeric chars
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes text while preserving single spaces between tokens
 */
export function normalizeTokenString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Extracts clean handle from usernames or URLs
 */
export function extractHandle(input: string): string {
  if (!input) return '';
  let cleaned = input.trim();
  // Strip url parts if full url passed
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').filter(Boolean);
    cleaned = parts[parts.length - 1] || cleaned;
  }
  return cleaned.replace(/^@+/, '').toLowerCase();
}

/**
 * Levenshtein distance implementation
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a || '';
  const s2 = b || '';
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized Levenshtein similarity [0, 1]
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Jaro-Winkler similarity algorithm [0, 1]
 * High accuracy for typos, transpositions, and prefix matches
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3.0;

  // Winkler prefix scaling (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  const p = 0.1; // standard Winkler constant
  return Math.min(1.0, jaro + prefix * p * (1 - jaro));
}

/**
 * Check if string contains character transpositions (swaps) of brand name
 */
export function detectCharacterSwaps(candidate: string, target: string): { isSwap: boolean; swappedChars?: string } {
  const normCand = normalizeString(candidate);
  const normTgt = normalizeString(target);

  if (normCand.length !== normTgt.length || normCand === normTgt) {
    return { isSwap: false };
  }

  // Count character frequency
  const countCand: Record<string, number> = {};
  const countTgt: Record<string, number> = {};
  for (const c of normCand) countCand[c] = (countCand[c] || 0) + 1;
  for (const c of normTgt) countTgt[c] = (countTgt[c] || 0) + 1;

  for (const k in countCand) {
    if (countCand[k] !== countTgt[k]) return { isSwap: false };
  }

  // Find mismatched positions
  const mismatches: number[] = [];
  for (let i = 0; i < normCand.length; i++) {
    if (normCand[i] !== normTgt[i]) {
      mismatches.push(i);
    }
  }

  if (mismatches.length === 2 && (mismatches[1] - mismatches[0] <= 2)) {
    return {
      isSwap: true,
      swappedChars: `'${normCand[mismatches[0]]}' and '${normCand[mismatches[1]]}'`,
    };
  }

  return { isSwap: false };
}

/**
 * Detect leetspeak or homoglyph substitutions
 */
export function detectHomoglyphs(candidate: string, target: string): { hasHomoglyph: boolean; substituted: string[] } {
  const sCandidate = candidate.toLowerCase();
  const sTarget = target.toLowerCase();
  const found: string[] = [];

  // Replace each known homoglyph in candidate with canonical letter and check match
  let converted = sCandidate;
  for (const [canonical, variants] of Object.entries(HOMOGLYPH_MAP)) {
    for (const v of variants) {
      if (converted.includes(v) && sTarget.includes(canonical)) {
        found.push(`${v} -> ${canonical}`);
        converted = converted.split(v).join(canonical);
      }
    }
  }

  const normConverted = normalizeString(converted);
  const normTarget = normalizeString(target);

  if (found.length > 0 && normConverted === normTarget) {
    return { hasHomoglyph: true, substituted: found };
  }

  return { hasHomoglyph: false, substituted: [] };
}

/**
 * Find deceptive prefix/suffix words attached to brand
 */
export function findDeceptiveWords(text: string): string[] {
  const normalized = normalizeTokenString(text);
  const words = normalized.split(/\s+/);
  const detected: string[] = [];

  for (const kw of DECEPTIVE_KEYWORDS) {
    if (words.includes(kw) || text.toLowerCase().includes(kw)) {
      detected.push(kw);
    }
  }

  return Array.from(new Set(detected));
}

/**
 * Token Jaccard overlap similarity
 */
export function tokenOverlap(strA: string, strB: string): number {
  const tokensA = new Set(normalizeTokenString(strA).split(/\s+/).filter(Boolean));
  const tokensB = new Set(normalizeTokenString(strB).split(/\s+/).filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Calculate comprehensive composite name similarity score (0 - 100)
 */
export function calculateCompositeSimilarity(candidate: string, official: string): {
  score: number;
  jaro: number;
  levenshtein: number;
  token: number;
  isPrefixSuffix: boolean;
  isSubstituted: boolean;
} {
  const normCand = normalizeString(candidate);
  const normOff = normalizeString(official);

  if (!normCand || !normOff) {
    return { score: 0, jaro: 0, levenshtein: 0, token: 0, isPrefixSuffix: false, isSubstituted: false };
  }

  if (normCand === normOff) {
    return { score: 100, jaro: 1, levenshtein: 1, token: 1, isPrefixSuffix: false, isSubstituted: false };
  }

  const jaro = jaroWinklerSimilarity(normCand, normOff);
  const lev = levenshteinSimilarity(normCand, normOff);
  const token = tokenOverlap(candidate, official);

  // Check if candidate contains official name as substring with deceptive words
  const isPrefixSuffix = normCand.includes(normOff) || normOff.includes(normCand);

  const homoglyphs = detectHomoglyphs(candidate, official);

  // Composite calculation
  let composite = 0;

  if (homoglyphs.hasHomoglyph) {
    composite = 92;
  } else if (isPrefixSuffix) {
    // Contains the exact brand name plus extra terms (e.g. "acmesupport")
    const lengthRatio = Math.min(normOff.length, normCand.length) / Math.max(normOff.length, normCand.length);
    composite = Math.round(75 + (20 * lengthRatio));
  } else {
    // Weighted combination of Jaro-Winkler (55%) and Levenshtein (45%)
    composite = Math.round((jaro * 0.55 + lev * 0.45) * 100);
  }

  return {
    score: Math.min(100, Math.max(0, composite)),
    jaro: Math.round(jaro * 100) / 100,
    levenshtein: Math.round(lev * 100) / 100,
    token: Math.round(token * 100) / 100,
    isPrefixSuffix,
    isSubstituted: homoglyphs.hasHomoglyph,
  };
}
