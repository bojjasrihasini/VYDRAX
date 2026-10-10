export type PlatformType = 'Instagram' | 'X' | 'Facebook' | 'LinkedIn' | 'YouTube' | 'TikTok' | 'Telegram';
export type AppStorePlatform = 'Google Play Store' | 'Apple App Store' | 'Third-Party APK';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'new' | 'investigating' | 'resolved' | 'false_positive';
export type CandidateType = 'social' | 'app';
export type SourceType = 'demo' | 'imported' | 'live';

export interface Brand {
  id: string;
  name: string;
  description: string;
  website: string;
  logo_url?: string;
  keywords: string[];
  aliases: string[];
  created_at: string;
  updated_at: string;
  official_social_count?: number;
  official_app_count?: number;
  active_threats_count?: number;
}

export interface OfficialSocialAsset {
  id: string;
  brand_id: string;
  platform: PlatformType;
  account_url: string;
  username: string; // e.g. "acmefinance"
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface OfficialApp {
  id: string;
  brand_id: string;
  app_name: string;
  platform: AppStorePlatform;
  listing_url: string;
  package_id: string; // e.g. "com.acme.finance"
  developer_name: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface CandidateSocialProfile {
  id: string;
  platform: PlatformType;
  username: string;
  display_name: string;
  profile_url: string;
  avatar_url?: string;
  bio?: string;
  followers?: number;
  source_type: SourceType;
  associated_brand_id?: string;
  created_at: string;
}

export interface CandidateApp {
  id: string;
  app_name: string;
  platform: AppStorePlatform;
  listing_url: string;
  package_id: string;
  developer_name: string;
  icon_url?: string;
  description?: string;
  downloads?: string;
  rating?: number;
  source_type: SourceType;
  associated_brand_id?: string;
  created_at: string;
}

export interface FindingEvidence {
  id: string;
  finding_id: string;
  rule_code: string;
  title: string;
  description: string;
  weight: number;
  score_impact: number;
}

export interface InvestigationNote {
  id: string;
  finding_id: string;
  author: string;
  note: string;
  created_at: string;
}

export interface StatusHistoryItem {
  id: string;
  finding_id: string;
  old_status: FindingStatus;
  new_status: FindingStatus;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface Finding {
  id: string;
  brand_id: string;
  brand_name?: string;
  candidate_type: CandidateType;
  candidate_id: string;
  platform: string;
  target_name: string;
  target_identifier: string; // @handle or package id
  target_url: string;
  avatar_url?: string;
  risk_score: number; // 0 - 100
  severity: SeverityLevel;
  name_similarity: number; // 0 - 100
  logo_similarity?: number; // 0 - 100 or undefined
  publisher_mismatch: boolean;
  developer_name?: string;
  status: FindingStatus;
  recommended_action: string;
  evidence: FindingEvidence[];
  notes?: InvestigationNote[];
  history?: StatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface ScanJob {
  id: string;
  brand_id: string;
  brand_name?: string;
  scan_type: 'social' | 'app' | 'all';
  status: 'running' | 'completed' | 'failed';
  candidates_evaluated: number;
  threats_found: number;
  created_at: string;
  completed_at?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'social' | 'app';
  platform: string;
  status: 'connected' | 'demo_mode' | 'unconfigured' | 'error';
  last_scan?: string;
  error_message?: string;
  description: string;
}

export interface DetectionResult {
  isExcludedAsOfficial: boolean;
  exclusionReason?: string;
  isThreat: boolean;
  nameSimilarity: number;
  logoSimilarity?: number;
  publisherMismatch: boolean;
  riskScore: number;
  severity: SeverityLevel;
  evidence: {
    rule_code: string;
    title: string;
    description: string;
    weight: number;
    score_impact: number;
  }[];
  recommendedAction: string;
}

export interface DashboardStats {
  monitored_brands: number;
  social_scanned: number;
  apps_scanned: number;
  total_threats: number;
  critical_threats: number;
  high_threats: number;
  medium_threats: number;
  low_threats: number;
  resolved_threats: number;
  risk_distribution: { name: string; count: number; color: string }[];
  platform_distribution: { platform: string; count: number }[];
  type_distribution: { name: string; count: number }[];
  threat_trends: { date: string; detections: number; resolved: number }[];
}

// ==========================================
// URL RISK ANALYSIS TYPES
// ==========================================

export type UrlRiskVerdict = 'low' | 'medium' | 'high' | 'inconclusive';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface UrlIndicator {
  code: string;
  name: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
}

export interface DnsRecordInfo {
  a_records: string[];
  aaaa_records: string[];
  mx_records: string[];
  txt_records: string[];
  ns_records: string[];
}

export interface NetworkInfo {
  ip?: string;
  asn?: string;
  org?: string;
  country?: string;
  city?: string;
  is_cloud_provider?: boolean;
  cloud_name?: string;
}

export interface CertificateInfo {
  subject?: string;
  issuer?: string;
  valid_from?: string;
  valid_to?: string;
  days_remaining?: number;
  is_valid?: boolean;
  is_self_signed?: boolean;
  error?: string;
}

export interface RedirectHop {
  url: string;
  status_code: number;
}

export interface ThreatIntelResult {
  source: string;
  status: 'clean' | 'flagged' | 'unconfigured' | 'unavailable';
  details: string;
}

export interface DomainRegistrationInfo {
  created_date?: string;
  age_days?: number;
  registrar?: string;
  status?: string;
  is_new_domain?: boolean;
}

export interface LookalikeUrlDetection {
  is_lookalike: boolean;
  matched_brand?: string;
  similarity?: number;
  details?: string;
}

export interface UrlAnalysisResult {
  id: string;
  submitted_url: string;
  normalized_domain: string;
  protocol: string;
  risk_score: number; // 0 - 100
  verdict: UrlRiskVerdict;
  confidence: ConfidenceLevel;
  key_reasons: string[];
  indicators: UrlIndicator[];
  dns: DnsRecordInfo;
  network: NetworkInfo;
  certificate: CertificateInfo;
  redirects: RedirectHop[];
  threat_intel: ThreatIntelResult[];
  domain_registration: DomainRegistrationInfo;
  lookalike_detection?: LookalikeUrlDetection;
  recommended_steps: string[];
  unavailable_checks: string[];
  analyzed_at: string;
  is_inconclusive: boolean;
  inconclusive_reason?: string;
}

