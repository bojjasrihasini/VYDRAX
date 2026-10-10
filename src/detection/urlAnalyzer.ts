/**
 * VYTRIX URL Risk Analyzer Engine
 * High-precision, SSRF-safe analysis of submitted URLs
 * Checks: Structure, DNS, Network, SSL/TLS, Redirects, Threat Intel, Look-alike Brand Mimicry
 */

import dns from 'dns/promises';
import net from 'net';
import tls from 'tls';
import {
  UrlAnalysisResult,
  UrlIndicator,
  UrlRiskVerdict,
  ConfidenceLevel,
  DnsRecordInfo,
  NetworkInfo,
  CertificateInfo,
  RedirectHop,
  ThreatIntelResult,
  DomainRegistrationInfo,
  LookalikeUrlDetection,
  Brand,
} from '../types/index.ts';
import {
  calculateCompositeSimilarity,
  detectCharacterSwaps,
  detectHomoglyphs,
  findDeceptiveWords,
  normalizeString,
} from './algorithms.ts';

// Common disposable/high-abuse TLDs often abused in automated phishing campaigns
const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'click', 'buzz', 'rest', 'work', 'tk', 'ml', 'ga', 'cf', 'gq', 'fit', 'surf', 'loan', 'cam', 'hair'
]);

// High-urgency credential harvesting keywords
const CREDENTIAL_KEYWORDS = [
  'login', 'signin', 'sign-in', 'log-in', 'verify', 'verification', 'secure', 'security',
  'banking', 'bank', 'account', 'update', 'wallet', 'seedphrase', 'authenticate', 'auth',
  'recovery', 'unlock', 'support', 'helpdesk', 'claim', 'bonus', 'airdrop', 'confirm'
];

/**
 * Validates whether an IP address belongs to private/internal/cloud metadata ranges
 * CRITICAL SSRF PROTECTION
 */
export function isPrivateOrBlockedIP(ip: string): boolean {
  if (!ip) return true;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    const [a, b] = parts;

    // 0.0.0.0/8 (Broadcast/Local)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (RFC 1918 Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (RFC 1918 Private: 172.16.x.x - 172.31.x.x)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (RFC 1918 Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link Local & AWS/GCP Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 224.0.0.0/4 (Multicast: 224 - 239)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved: 240 - 255)
    if (a >= 240) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const clean = ip.toLowerCase();
    // Loopback ::1
    if (clean === '::1' || clean === '0:0:0:0:0:0:0:1') return true;
    // Unspecified ::
    if (clean === '::') return true;
    // Link local fe80::/10
    if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true;
    // Unique local fc00::/7 (fc00 - fdff)
    if (clean.startsWith('fc') || clean.startsWith('fd')) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
    if (clean.includes('::ffff:')) {
      const v4Part = clean.split('::ffff:')[1];
      if (v4Part && net.isIPv4(v4Part)) {
        return isPrivateOrBlockedIP(v4Part);
      }
    }
    return false;
  }

  return true;
}

/**
 * Checks if a hostname points to an internal/restricted destination
 */
export function isBlockedHostname(hostname: string): boolean {
  if (!hostname) return true;
  const host = hostname.toLowerCase().trim();

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan') ||
    host === 'metadata.google.internal' ||
    host === 'instance-data'
  ) {
    return true;
  }

  return false;
}

/**
 * Performs SSL/TLS certificate inspection with timeout and safety controls
 */
async function inspectTlsCertificate(hostname: string, port = 443): Promise<CertificateInfo> {
  return new Promise((resolve) => {
    const timeoutMs = 3500;
    let timer: NodeJS.Timeout;

    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false, // Extract certificate even if self-signed to report it!
      },
      () => {
        clearTimeout(timer);
        try {
          const cert = socket.getPeerCertificate();
          socket.destroy();

          if (!cert || Object.keys(cert).length === 0) {
            return resolve({
              is_valid: false,
              error: 'No TLS certificate presented by server',
            });
          }

          const validFrom = cert.valid_from;
          const validTo = cert.valid_to;
          const now = Date.now();
          const toTime = new Date(validTo).getTime();
          const fromTime = new Date(validFrom).getTime();
          const daysRemaining = Math.max(0, Math.round((toTime - now) / (1000 * 60 * 60 * 24)));
          const isExpired = now > toTime;
          const notYetValid = now < fromTime;

          // Check if self-signed
          const isSelfSigned =
            cert.issuer &&
            cert.subject &&
            JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);

          const rawSubject = cert.subject?.CN || (typeof cert.subject === 'string' ? cert.subject : hostname);
          const subjectStr = Array.isArray(rawSubject) ? rawSubject.join(', ') : String(rawSubject || hostname);

          const rawIssuer = cert.issuer?.O || cert.issuer?.CN || 'Unknown Certificate Authority';
          const issuerStr = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : String(rawIssuer);

          resolve({
            subject: subjectStr,
            issuer: issuerStr,
            valid_from: validFrom,
            valid_to: validTo,
            days_remaining: daysRemaining,
            is_valid: !isExpired && !notYetValid && !isSelfSigned,
            is_self_signed: isSelfSigned,
            error: isExpired
              ? `Certificate expired on ${validTo}`
              : isSelfSigned
              ? 'Self-signed certificate untrusted by public browsers'
              : undefined,
          });
        } catch (e: any) {
          socket.destroy();
          resolve({ is_valid: false, error: e.message || 'Failed to parse peer certificate' });
        }
      }
    );

    socket.on('error', (err) => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ is_valid: false, error: err.message || 'TLS connection failed' });
    });

    timer = setTimeout(() => {
      socket.destroy();
      resolve({ is_valid: false, error: 'TLS handshake connection timed out (3.5s)' });
    }, timeoutMs);
  });
}

/**
 * Safe redirect chain checking (follows up to 4 hops with SSRF validation)
 */
async function checkRedirectChain(targetUrl: string): Promise<{ hops: RedirectHop[]; finalUrl: string }> {
  const hops: RedirectHop[] = [];
  let currentUrl = targetUrl;
  const maxHops = 4;

  try {
    for (let i = 0; i < maxHops; i++) {
      const parsed = new URL(currentUrl);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        break;
      }
      if (isBlockedHostname(parsed.hostname)) {
        break;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Vytrix-DRP-URL-Analyzer/2.0 (Security Scanner)',
          'Accept': '*/*',
        },
      });

      clearTimeout(timer);
      hops.push({
        url: currentUrl,
        status_code: response.status,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (location) {
          const nextUrl = new URL(location, currentUrl).toString();
          // Detect loop
          if (hops.some((h) => h.url === nextUrl)) {
            break;
          }
          currentUrl = nextUrl;
          continue;
        }
      }

      break;
    }
  } catch (err) {
    // Non-fatal: if HEAD fails, record whatever hops were captured
  }

  return { hops, finalUrl: currentUrl };
}

/**
 * Resolves network geolocation & hosting info with safety timeout
 */
async function fetchNetworkInfo(ip: string): Promise<NetworkInfo> {
  if (!ip || isPrivateOrBlockedIP(ip)) {
    return { ip };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://ipwhois.app/json/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const org = data.org || data.isp || 'Unknown Provider';
      const orgLower = org.toLowerCase();

      // Cloud / CDN identification
      let isCloud = false;
      let cloudName: string | undefined = undefined;

      if (orgLower.includes('cloudflare')) {
        isCloud = true;
        cloudName = 'Cloudflare';
      } else if (orgLower.includes('amazon') || orgLower.includes('aws')) {
        isCloud = true;
        cloudName = 'Amazon Web Services (AWS)';
      } else if (orgLower.includes('google')) {
        isCloud = true;
        cloudName = 'Google Cloud Platform (GCP)';
      } else if (orgLower.includes('microsoft') || orgLower.includes('azure')) {
        isCloud = true;
        cloudName = 'Microsoft Azure';
      } else if (orgLower.includes('fastly')) {
        isCloud = true;
        cloudName = 'Fastly CDN';
      } else if (orgLower.includes('akamai')) {
        isCloud = true;
        cloudName = 'Akamai Technologies';
      } else if (orgLower.includes('digitalocean')) {
        isCloud = true;
        cloudName = 'DigitalOcean';
      }

      return {
        ip,
        asn: data.asn,
        org,
        country: data.country,
        city: data.city,
        is_cloud_provider: isCloud,
        cloud_name: cloudName,
      };
    }
  } catch {
    // Fallback if public IP lookup is unreachable
  }

  return { ip };
}

/**
 * Fetch domain registration info via public ICANN RDAP with timeout
 */
async function fetchDomainRegistrationInfo(domain: string): Promise<DomainRegistrationInfo> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/rdap+json, application/json' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const rdap = await res.json();
      const events: any[] = rdap.events || [];
      const regEvent = events.find((e) => e.eventAction === 'registration');

      if (regEvent && regEvent.eventDate) {
        const createdDate = regEvent.eventDate;
        const now = Date.now();
        const createdMs = new Date(createdDate).getTime();
        const ageDays = Math.max(0, Math.floor((now - createdMs) / (1000 * 60 * 60 * 24)));

        return {
          created_date: createdDate,
          age_days: ageDays,
          registrar: rdap.entities?.[0]?.vcardArray?.[1]?.find((f: any) => f[0] === 'fn')?.[3] || 'Accredited Registrar',
          status: rdap.status?.[0] || 'Active',
          is_new_domain: ageDays < 30,
        };
      }
    }
  } catch {
    // Non-fatal if RDAP server doesn't respond
  }

  return {};
}

/**
 * Core URL Analysis Function
 */
export async function analyzeUrlRisk(
  rawUrl: string,
  monitoredBrands: Brand[] = []
): Promise<UrlAnalysisResult> {
  const analysisId = `url-scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  // Step 1: URL Structure Parsing & Validation
  let inputUrl = rawUrl.trim();
  if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
    inputUrl = 'https://' + inputUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return {
      id: analysisId,
      submitted_url: rawUrl,
      normalized_domain: '',
      protocol: '',
      risk_score: 90,
      verdict: 'high',
      confidence: 'high',
      key_reasons: ['Malformed or invalid URL syntax violates standard RFC 3986.'],
      indicators: [
        {
          code: 'MALFORMED_URL',
          name: 'Invalid URL Structure',
          severity: 'high',
          description: 'The supplied URL could not be parsed as a valid web address.',
          impact: 90,
        },
      ],
      dns: { a_records: [], aaaa_records: [], mx_records: [], txt_records: [], ns_records: [] },
      network: {},
      certificate: {},
      redirects: [],
      threat_intel: [],
      domain_registration: {},
      recommended_steps: ['Do not navigate to unparseable or malformed URLs.'],
      unavailable_checks: ['DNS Resolution', 'TLS Handshake', 'Network Telemetry'],
      analyzed_at: timestamp,
      is_inconclusive: false,
    };
  }

  const protocol = parsed.protocol.replace(':', '');
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;
  const fullSearch = parsed.search;

  // SSRF Protection: Check for internal/loopback hostname
  if (isBlockedHostname(hostname)) {
    return {
      id: analysisId,
      submitted_url: rawUrl,
      normalized_domain: hostname,
      protocol,
      risk_score: 95,
      verdict: 'high',
      confidence: 'high',
      key_reasons: ['Target points to localhost, internal network name, or cloud metadata service.'],
      indicators: [
        {
          code: 'SSRF_BLOCKED_HOST',
          name: 'Internal / Localhost Destination Blocked',
          severity: 'critical',
          description: `Hostname '${hostname}' targets internal network resources (SSRF protection enforced).`,
          impact: 95,
        },
      ],
      dns: { a_records: [], aaaa_records: [], mx_records: [], txt_records: [], ns_records: [] },
      network: {},
      certificate: {},
      redirects: [],
      threat_intel: [],
      domain_registration: {},
      recommended_steps: ['Prohibit user access to internal or administrative network endpoints.'],
      unavailable_checks: ['Live Network Inspection'],
      analyzed_at: timestamp,
      is_inconclusive: false,
    };
  }

  const indicators: UrlIndicator[] = [];
  const keyReasons: string[] = [];
  const unavailableChecks: string[] = [];
  let calculatedRisk = 0;

  // ==========================================
  // CHECK 1: URL Structure & Heuristics
  // ==========================================

  // 1a. Userinfo in URL (e.g. http://google.com@attacker.com)
  if (parsed.username || parsed.password) {
    calculatedRisk += 35;
    const ind: UrlIndicator = {
      code: 'USERINFO_OBFUSCATION',
      name: 'Userinfo Obfuscation in URL (@ Symbol)',
      severity: 'high',
      description: 'URL includes authentication prefix before @ sign, a common credential phish masquerade technique.',
      impact: 35,
    };
    indicators.push(ind);
    keyReasons.push('Deceptive @ symbol in URL masks true destination host.');
  }

  // 1b. IP Address used as host
  const isDirectIp = net.isIP(hostname) !== 0;
  if (isDirectIp) {
    if (isPrivateOrBlockedIP(hostname)) {
      calculatedRisk += 80;
      indicators.push({
        code: 'PRIVATE_IP_TARGET',
        name: 'Private/Internal IP Address Target',
        severity: 'critical',
        description: 'URL directly targets private IP space or cloud metadata services.',
        impact: 80,
      });
      keyReasons.push('Direct private IP address destination prohibited.');
    } else {
      calculatedRisk += 40;
      indicators.push({
        code: 'IP_AS_HOST',
        name: 'Direct IP Address Used as Host',
        severity: 'medium',
        description: 'URL uses raw numeric IP address instead of registered domain name, bypassing DNS reputation.',
        impact: 40,
      });
      keyReasons.push('Direct numeric IP used as host instead of legitimate domain name.');
    }
  }

  // 1c. Subdomain Depth / Excessive Subdomains
  const domainParts = hostname.split('.');
  if (!isDirectIp && domainParts.length >= 5) {
    calculatedRisk += 20;
    indicators.push({
      code: 'EXCESSIVE_SUBDOMAINS',
      name: 'Excessive Subdomain Nesting',
      severity: 'medium',
      description: `Domain contains ${domainParts.length} levels of subdomains, frequently used to obscure the base domain.`,
      impact: 20,
    });
    keyReasons.push('Complex multi-tiered subdomains designed to conceal true origin domain.');
  }

  // 1d. Excessive Hyphens in Domain
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    calculatedRisk += 15;
    indicators.push({
      code: 'EXCESSIVE_HYPHENS',
      name: 'High Hyphen Count in Domain',
      severity: 'low',
      description: `Domain contains ${hyphenCount} hyphens, commonly seen in look-alike phishing domain generation.`,
      impact: 15,
    });
  }

  // 1e. Suspicious TLD
  const tld = domainParts[domainParts.length - 1] || '';
  if (SUSPICIOUS_TLDS.has(tld)) {
    calculatedRisk += 15;
    indicators.push({
      code: 'SUSPICIOUS_TLD',
      name: 'High-Abuse Top Level Domain',
      severity: 'low',
      description: `Domain uses .${tld}, a top-level domain with statistically high abuse and spam ratios.`,
      impact: 15,
    });
  }

  // 1f. Hex / Percent Encoding in Host or Path
  if (rawUrl.includes('%') && /%[0-9a-fA-F]{2}/.test(rawUrl)) {
    calculatedRisk += 15;
    indicators.push({
      code: 'URL_ENCODED_CHARACTERS',
      name: 'Hex / Percent-Encoded URL Characters',
      severity: 'low',
      description: 'URL incorporates encoded characters commonly utilized to evade rudimentary firewall pattern filters.',
      impact: 15,
    });
  }

  // 1g. Credential Harvesting & High-Urgency Keywords
  const fullUrlLower = (hostname + pathname + fullSearch).toLowerCase();
  const foundKeywords = CREDENTIAL_KEYWORDS.filter((kw) => fullUrlLower.includes(kw));

  if (foundKeywords.length >= 2) {
    const impact = Math.min(30, 15 + foundKeywords.length * 5);
    calculatedRisk += impact;
    indicators.push({
      code: 'CREDENTIAL_HARVEST_KEYWORDS',
      name: 'High-Urgency Credential / Banking Keywords',
      severity: 'high',
      description: `URL path or parameters embed sensitive tokens: [${foundKeywords.slice(0, 5).join(', ')}].`,
      impact,
    });
    keyReasons.push(`Sensitive authentication and account tokens identified in URL structure: [${foundKeywords.slice(0, 3).join(', ')}].`);
  }

  // 1h. Insecure HTTP Protocol
  if (protocol === 'http') {
    calculatedRisk += 15;
    indicators.push({
      code: 'CLEARTEXT_HTTP',
      name: 'Cleartext Unencrypted HTTP Protocol',
      severity: 'low',
      description: 'Transmission lacks TLS encryption; susceptible to man-in-the-middle interception.',
      impact: 15,
    });
  }

  // ==========================================
  // CHECK 2: Look-alike Brand Mimicry & Homoglyphs
  // ==========================================
  let lookalikeResult: LookalikeUrlDetection | undefined = undefined;

  for (const b of monitoredBrands) {
    const brandTokens = [b.name, ...(b.aliases || []), ...(b.keywords || [])].filter(Boolean);

    for (const token of brandTokens) {
      const normToken = normalizeString(token);
      if (normToken.length < 3) continue;

      // Extract base domain name without TLD
      const baseDomainName = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : hostname;

      // Exact match to official brand domain? (Exclusion check)
      if (b.website && b.website.toLowerCase().includes(hostname)) {
        // This is the brand's OWN official domain!
        indicators.push({
          code: 'OFFICIAL_BRAND_DOMAIN',
          name: 'Verified Official Brand Domain',
          severity: 'info',
          description: `Destination matches official registered website for '${b.name}'.`,
          impact: 0,
        });
        keyReasons.push(`Verified official web asset for protected organization '${b.name}'.`);
        // Immediate low score for official domain
        calculatedRisk = Math.max(0, calculatedRisk - 30);
        break;
      }

      // Check if hostname or subdomain contains the protected brand token
      const isOfficialDomain = Boolean(b.website && b.website.toLowerCase().includes(hostname));
      const hostContainsBrand = hostname.includes(normToken);

      if (!isOfficialDomain && hostContainsBrand && !lookalikeResult?.is_lookalike) {
        calculatedRisk += 35;
        indicators.push({
          code: 'UNAUTHORIZED_BRAND_USE_DOMAIN',
          name: 'Unauthorized Brand Mark in Domain Hostname',
          severity: 'high',
          description: `Hostname '${hostname}' embeds protected trademark '${b.name}' on an unverified third-party host.`,
          impact: 35,
        });
        keyReasons.push(`Unauthorized embedding of protected trademark '${b.name}' in URL hostname.`);
        lookalikeResult = { is_lookalike: true, matched_brand: b.name, details: 'Protected brand mark embedded in hostname' };
      }

      // Check character swaps in domain
      const swap = detectCharacterSwaps(baseDomainName, normToken);
      if (swap.isSwap) {
        calculatedRisk += 35;
        indicators.push({
          code: 'BRAND_CHARACTER_SWAP',
          name: 'Brand Character Transposition (Look-alike)',
          severity: 'high',
          description: `Domain '${baseDomainName}' transposes characters ${swap.swappedChars} to mimic official brand '${b.name}'.`,
          impact: 35,
        });
        keyReasons.push(`Look-alike domain mimics brand mark '${b.name}' via character transposition.`);
        lookalikeResult = { is_lookalike: true, matched_brand: b.name, details: 'Character swap' };
      }

      // Check homoglyphs in domain
      const homoglyphs = detectHomoglyphs(baseDomainName, normToken);
      if (homoglyphs.hasHomoglyph) {
        calculatedRisk += 35;
        indicators.push({
          code: 'BRAND_HOMOGLYPH_DECEPTION',
          name: 'Brand Homoglyph / Leetspeak Substitution',
          severity: 'high',
          description: `Domain '${baseDomainName}' employs visual substitutions: ${homoglyphs.substituted.join(', ')} targeting brand '${b.name}'.`,
          impact: 35,
        });
        keyReasons.push(`Deceptive character substitution mimics official brand '${b.name}'.`);
        lookalikeResult = { is_lookalike: true, matched_brand: b.name, details: 'Homoglyph substitution' };
      }

      // Check string similarity
      const sim = calculateCompositeSimilarity(baseDomainName, normToken);
      if (sim.score >= 70 && !b.website.toLowerCase().includes(hostname)) {
        calculatedRisk += 25;
        indicators.push({
          code: 'HIGH_BRAND_NAME_SIMILARITY',
          name: 'High Trademark Look-alike Similarity',
          severity: 'high',
          description: `Domain '${baseDomainName}' exhibits ${sim.score}% similarity to registered trademark '${b.name}'.`,
          impact: 25,
        });
        keyReasons.push(`High name similarity (${sim.score}%) to protected brand mark '${b.name}'.`);
        lookalikeResult = { is_lookalike: true, matched_brand: b.name, similarity: sim.score };
      }
    }
  }

  // ==========================================
  // CHECK 3: DNS Resolution & Network Lookup
  // ==========================================
  const dnsRecords: DnsRecordInfo = {
    a_records: [],
    aaaa_records: [],
    mx_records: [],
    txt_records: [],
    ns_records: [],
  };

  let primaryIp: string | undefined = undefined;
  let dnsResolved = false;

  if (!isDirectIp) {
    try {
      const aRecs = await dns.resolve4(hostname).catch(() => []);
      dnsRecords.a_records = aRecs;

      const aaaaRecs = await dns.resolve6(hostname).catch(() => []);
      dnsRecords.aaaa_records = aaaaRecs;

      const mxRecs = await dns.resolveMx(hostname).catch(() => []);
      dnsRecords.mx_records = mxRecs.map((m) => `${m.exchange} (Priority: ${m.priority})`);

      const nsRecs = await dns.resolveNs(hostname).catch(() => []);
      dnsRecords.ns_records = nsRecs;

      const txtRecs = await dns.resolveTxt(hostname).catch(() => []);
      dnsRecords.txt_records = txtRecs.map((t) => t.join(' '));

      if (aRecs.length > 0) {
        primaryIp = aRecs[0];
        dnsResolved = true;

        // SSRF Check on resolved IP address!
        if (isPrivateOrBlockedIP(primaryIp)) {
          calculatedRisk += 95;
          indicators.push({
            code: 'DNS_REBOUND_SSRF',
            name: 'DNS Rebinding / Internal IP Resolution',
            severity: 'critical',
            description: `Hostname '${hostname}' resolves to private/internal IP address '${primaryIp}' (SSRF protection enforced).`,
            impact: 95,
          });
          keyReasons.push(`Hostname resolved to restricted internal network address '${primaryIp}'.`);
        }
      } else if (aaaaRecs.length > 0) {
        primaryIp = aaaaRecs[0];
        dnsResolved = true;
      }
    } catch (e: any) {
      // DNS resolution failed
      dnsResolved = false;
    }
  } else {
    primaryIp = hostname;
    dnsResolved = true;
  }

  // If DNS resolution completely failed and no IP
  if (!dnsResolved && !isDirectIp) {
    indicators.push({
      code: 'NON_RESOLVING_DOMAIN',
      name: 'Unresolvable Domain (NXDOMAIN)',
      severity: 'medium',
      description: 'Domain does not currently resolve to an active DNS A or AAAA record.',
      impact: 20,
    });
    unavailableChecks.push('Active Web Server Handshake', 'TLS Certificate Extraction');
  }

  // ==========================================
  // CHECK 4: Network Geolocation & Cloud Provider
  // ==========================================
  let networkInfo: NetworkInfo = {};
  if (primaryIp && !isPrivateOrBlockedIP(primaryIp)) {
    networkInfo = await fetchNetworkInfo(primaryIp);
  } else if (!primaryIp) {
    unavailableChecks.push('Network ASN & Geolocation');
  }

  // ==========================================
  // CHECK 5: SSL/TLS Certificate Inspection
  // ==========================================
  let certInfo: CertificateInfo = {};
  if (protocol === 'https' && dnsResolved && primaryIp && !isPrivateOrBlockedIP(primaryIp)) {
    certInfo = await inspectTlsCertificate(hostname, 443);

    if (certInfo.is_self_signed) {
      calculatedRisk += 35;
      indicators.push({
        code: 'SELF_SIGNED_CERTIFICATE',
        name: 'Self-Signed SSL/TLS Certificate',
        severity: 'high',
        description: 'Server presents a self-signed certificate not trusted by standard root certificate authorities.',
        impact: 35,
      });
      keyReasons.push('Untrusted self-signed certificate presented by destination server.');
    } else if (certInfo.error && certInfo.error.includes('expired')) {
      calculatedRisk += 25;
      indicators.push({
        code: 'EXPIRED_CERTIFICATE',
        name: 'Expired SSL/TLS Certificate',
        severity: 'medium',
        description: certInfo.error,
        impact: 25,
      });
      keyReasons.push('SSL/TLS certificate has lapsed and is no longer valid.');
    }
  } else if (protocol === 'https') {
    unavailableChecks.push('TLS Certificate Inspection (Host Unreachable)');
  }

  // ==========================================
  // CHECK 6: Safe Redirect Chain Tracking
  // ==========================================
  let redirects: RedirectHop[] = [];
  if (dnsResolved && primaryIp && !isPrivateOrBlockedIP(primaryIp)) {
    const redResult = await checkRedirectChain(inputUrl);
    redirects = redResult.hops;

    if (redirects.length > 2) {
      calculatedRisk += 15;
      indicators.push({
        code: 'MULTIPLE_REDIRECTS',
        name: 'Multiple Redirect Hops (Hop count: ' + redirects.length + ')',
        severity: 'low',
        description: 'URL traverses multiple intermediate redirects before reaching terminal destination.',
        impact: 15,
      });
    }
  } else {
    unavailableChecks.push('Redirect Chain Tracker');
  }

  // ==========================================
  // CHECK 7: Domain Registration Age (RDAP)
  // ==========================================
  let domainReg: DomainRegistrationInfo = {};
  if (!isDirectIp && domainParts.length >= 2) {
    const baseDomain = domainParts.slice(-2).join('.');
    domainReg = await fetchDomainRegistrationInfo(baseDomain);

    if (domainReg.is_new_domain && domainReg.age_days !== undefined) {
      calculatedRisk += 20;
      indicators.push({
        code: 'NEWLY_REGISTERED_DOMAIN',
        name: `Newly Registered Domain (${domainReg.age_days} days old)`,
        severity: 'medium',
        description: `Domain was created recently on ${domainReg.created_date?.split('T')[0]}. Newly registered domains carry statistically elevated risk.`,
        impact: 20,
      });
      keyReasons.push(`Domain registered recently (${domainReg.age_days} days ago).`);
    }
  } else {
    unavailableChecks.push('Domain RDAP Registration Age');
  }

  // ==========================================
  // CHECK 8: Threat Intelligence Services
  // ==========================================
  const threatIntel: ThreatIntelResult[] = [];

  // 8a. Google Safe Browsing API
  const gsbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (gsbKey && gsbKey.trim() && gsbKey !== 'MY_GOOGLE_SAFE_BROWSING_KEY') {
    try {
      const gsbRes = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${gsbKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: { clientId: 'vytrix-drp', clientVersion: '2.0.0' },
            threatInfo: {
              threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url: inputUrl }],
            },
          }),
        }
      );
      if (gsbRes.ok) {
        const gsbData = await gsbRes.json();
        if (gsbData.matches && gsbData.matches.length > 0) {
          calculatedRisk += 60;
          threatIntel.push({
            source: 'Google Safe Browsing',
            status: 'flagged',
            details: `Flagged as ${gsbData.matches[0].threatType} by Google Safe Browsing Threat Lists.`,
          });
          indicators.push({
            code: 'GSB_THREAT_CONFIRMED',
            name: 'Google Safe Browsing Threat Detected',
            severity: 'critical',
            description: `Classified as malicious: ${gsbData.matches[0].threatType}`,
            impact: 60,
          });
          keyReasons.push(`Confirmed threat match on Google Safe Browsing (${gsbData.matches[0].threatType}).`);
        } else {
          threatIntel.push({
            source: 'Google Safe Browsing',
            status: 'clean',
            details: 'No known malware or phishing signatures detected on Google Safe Browsing.',
          });
        }
      } else {
        threatIntel.push({
          source: 'Google Safe Browsing',
          status: 'unavailable',
          details: 'Threat service returned HTTP ' + gsbRes.status,
        });
      }
    } catch {
      threatIntel.push({
        source: 'Google Safe Browsing',
        status: 'unavailable',
        details: 'API lookup timed out or service was unreachable.',
      });
    }
  } else {
    threatIntel.push({
      source: 'Google Safe Browsing',
      status: 'unconfigured',
      details: 'API credentials not configured in .env. Live check skipped without penalty.',
    });
    unavailableChecks.push('Google Safe Browsing Threat API');
  }

  // 8b. VirusTotal API
  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  if (vtKey && vtKey.trim()) {
    try {
      const urlId = Buffer.from(inputUrl).toString('base64').replace(/=/g, '');
      const vtRes = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: { 'x-apikey': vtKey },
      });
      if (vtRes.ok) {
        const vtData = await vtRes.json();
        const stats = vtData.data?.attributes?.last_analysis_stats || {};
        const malicious = stats.malicious || 0;
        if (malicious > 0) {
          calculatedRisk += Math.min(50, malicious * 10);
          threatIntel.push({
            source: 'VirusTotal Intelligence',
            status: 'flagged',
            details: `${malicious} security vendors flagged this URL as malicious.`,
          });
          indicators.push({
            code: 'VIRUSTOTAL_FLAGGED',
            name: `VirusTotal Multi-Vendor Flags (${malicious})`,
            severity: 'critical',
            description: `${malicious} distinct security engines identify this URL as malicious.`,
            impact: Math.min(50, malicious * 10),
          });
          keyReasons.push(`${malicious} security engines on VirusTotal identify URL as malicious.`);
        } else {
          threatIntel.push({
            source: 'VirusTotal Intelligence',
            status: 'clean',
            details: 'Zero security vendors flagged this URL as malicious.',
          });
        }
      } else {
        threatIntel.push({
          source: 'VirusTotal Intelligence',
          status: 'unavailable',
          details: 'VirusTotal returned HTTP ' + vtRes.status,
        });
      }
    } catch {
      threatIntel.push({
        source: 'VirusTotal Intelligence',
        status: 'unavailable',
        details: 'VirusTotal lookup timed out.',
      });
    }
  } else {
    threatIntel.push({
      source: 'VirusTotal Intelligence',
      status: 'unconfigured',
      details: 'API key not configured in .env. Live lookup skipped without penalty.',
    });
    unavailableChecks.push('VirusTotal API Engine');
  }

  // 8c. Vytrix Internal Brand Impersonation Intel
  if (lookalikeResult?.is_lookalike) {
    threatIntel.push({
      source: 'Vytrix Brand Impersonation Intel',
      status: 'flagged',
      details: `Suspected trademark infringement targeting registered brand '${lookalikeResult.matched_brand}'.`,
    });
  } else {
    threatIntel.push({
      source: 'Vytrix Brand Impersonation Intel',
      status: 'clean',
      details: 'No unauthorized trademark look-alikes identified against registered enterprise brands.',
    });
  }

  // ==========================================
  // FINAL RISK SCORING, CONFIDENCE & VERDICT
  // ==========================================

  // Determine Inconclusive State
  let isInconclusive = false;
  let inconclusiveReason: string | undefined = undefined;

  // If domain could not be resolved AND no structural high-risk indicators were detected:
  if (!dnsResolved && !isDirectIp && calculatedRisk < 30) {
    isInconclusive = true;
    inconclusiveReason =
      'Domain could not be resolved to an active server (NXDOMAIN) and network services could not be reached. Insufficient evidence to conclusively classify safety.';
  }

  const finalRiskScore = isInconclusive ? 0 : Math.min(100, Math.max(0, calculatedRisk));

  // Risk Classification as specified:
  // 0–29: LOW RISK
  // 30–69: MEDIUM RISK
  // 70–100: HIGH RISK
  let verdict: UrlRiskVerdict = 'low';
  if (isInconclusive) {
    verdict = 'inconclusive';
  } else if (finalRiskScore >= 70) {
    verdict = 'high';
  } else if (finalRiskScore >= 30) {
    verdict = 'medium';
  } else {
    verdict = 'low';
  }

  // Confidence Calculation
  let confidence: ConfidenceLevel = 'high';
  const checksCompleted = 6 - unavailableChecks.length;
  if (isInconclusive || checksCompleted <= 2) {
    confidence = 'low';
  } else if (checksCompleted <= 4) {
    confidence = 'medium';
  } else {
    confidence = 'high';
  }

  // Key reasons fallback if clean
  if (keyReasons.length === 0 && !isInconclusive) {
    keyReasons.push('Standard domain syntax and structure without anomalous character obfuscation.');
    if (certInfo.is_valid) {
      keyReasons.push(`Valid SSL/TLS certificate issued by trusted CA (${certInfo.issuer}).`);
    }
    if (dnsResolved) {
      keyReasons.push('Domain resolves reliably to standard public routing infrastructure.');
    }
  }

  // Recommended steps
  const recommendedSteps: string[] = [];
  if (verdict === 'high') {
    recommendedSteps.push('DO NOT VISIT OR ENTER CREDENTIALS: High likelihood of phishing or credential theft.');
    recommendedSteps.push('Block domain at corporate DNS / web proxy boundary.');
    recommendedSteps.push('Submit URL to brand abuse takedown queue if mimicking an official entity.');
  } else if (verdict === 'medium') {
    recommendedSteps.push('Exercise caution: Anomalous characteristics detected; investigate further before logging in.');
    recommendedSteps.push('Verify SSL certificate details and authentic destination host.');
    recommendedSteps.push('Inspect redirect endpoints in an isolated browser sandbox.');
  } else if (verdict === 'inconclusive') {
    recommendedSteps.push('Verify the spelling of the URL or re-test when the target host is reachable.');
    recommendedSteps.push('Domain does not appear active or public DNS records have not propagated.');
  } else {
    recommendedSteps.push('URL demonstrates conventional characteristics with no immediate high-risk anomalies detected.');
    recommendedSteps.push('Maintain standard security hygiene and ensure browser SSL indicators remain valid.');
  }

  return {
    id: analysisId,
    submitted_url: rawUrl,
    normalized_domain: hostname,
    protocol,
    risk_score: finalRiskScore,
    verdict,
    confidence,
    key_reasons: keyReasons,
    indicators,
    dns: dnsRecords,
    network: networkInfo,
    certificate: certInfo,
    redirects,
    threat_intel: threatIntel,
    domain_registration: domainReg,
    lookalike_detection: lookalikeResult,
    recommended_steps: recommendedSteps,
    unavailable_checks: unavailableChecks,
    analyzed_at: timestamp,
    is_inconclusive: isInconclusive,
    inconclusive_reason: inconclusiveReason,
  };
}
