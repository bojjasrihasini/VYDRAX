/**
 * VYTRIX Digital Risk Protection Platform
 * Main Application Orchestrator
 */

import React, { useState, useEffect } from 'react';
import { NavTab, Sidebar } from './components/Sidebar.tsx';
import { TopNavbar } from './components/TopNavbar.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { BrandsPage } from './pages/BrandsPage.tsx';
import { UrlAnalysisPage } from './pages/UrlAnalysisPage.tsx';
import { SocialMonitoringPage } from './pages/SocialMonitoringPage.tsx';
import { AppMonitoringPage } from './pages/AppMonitoringPage.tsx';
import { LookalikeSandboxPage } from './pages/LookalikeSandboxPage.tsx';
import { RiskManagementPage } from './pages/RiskManagementPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { ArchitecturePage } from './pages/ArchitecturePage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

import { BrandModal } from './components/BrandModal.tsx';
import { ImportModal } from './components/ImportModal.tsx';
import { EvidenceDrawer } from './components/EvidenceDrawer.tsx';
import { TakedownModal } from './components/TakedownModal.tsx';
import { ScanProgressModal } from './components/ScanProgressModal.tsx';

import { Brand, Finding, DashboardStats } from './types/index.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core Data State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [takedownFinding, setTakedownFinding] = useState<Finding | null>(null);

  // Scan HUD State
  const [scanModalState, setScanModalState] = useState<{
    isOpen: boolean;
    scanType: 'social' | 'apps';
    brandName: string;
    result: any;
  }>({
    isOpen: false,
    scanType: 'social',
    brandName: '',
    result: null,
  });

  const fetchData = async () => {
    try {
      const [brandsRes, findingsRes, statsRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/findings'),
        fetch('/api/dashboard/stats'),
      ]);

      if (brandsRes.ok) {
        const b = await brandsRes.json();
        setBrands(b);
      }
      if (findingsRes.ok) {
        const f = await findingsRes.json();
        setFindings(f);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scan Trigger Handlers
  const handleTriggerScanSocial = async () => {
    const targetBrand = brands[0];
    if (!targetBrand) return;

    setScanModalState({
      isOpen: true,
      scanType: 'social',
      brandName: targetBrand.name,
      result: null,
    });

    try {
      const res = await fetch('/api/scan/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: targetBrand.id }),
      });

      if (res.ok) {
        const result = await res.json();
        setTimeout(() => {
          setScanModalState((prev) => ({ ...prev, result }));
          fetchData();
        }, 800);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerScanApps = async () => {
    const targetBrand = brands[0];
    if (!targetBrand) return;

    setScanModalState({
      isOpen: true,
      scanType: 'apps',
      brandName: targetBrand.name,
      result: null,
    });

    try {
      const res = await fetch('/api/scan/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: targetBrand.id }),
      });

      if (res.ok) {
        const result = await res.json();
        setTimeout(() => {
          setScanModalState((prev) => ({ ...prev, result }));
          fetchData();
        }, 800);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Breadcrumbs title helper
  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'dashboard':
        return ['Operations Console'];
      case 'url_analysis':
        return ['URL Risk Analysis', 'Infrastructure Prober'];
      case 'brands':
        return ['Monitored Brands', 'Asset Registry'];
      case 'social':
        return ['Social Media', 'Impersonation Stream'];
      case 'apps':
        return ['App Stores', 'Rogue Listing Defense'];
      case 'lookalike':
        return ['Algorithmic Sandbox', 'Look-alike Tester'];
      case 'risk':
        return ['Investigation Desk', 'Triage & Enforcement'];
      case 'reports':
        return ['Intelligence Reports', 'Audit Export'];
      case 'architecture':
        return ['System Architecture', 'Exclusion Pipeline'];
      case 'settings':
        return ['Settings & Diagnostics', 'Test Suite'];
      default:
        return ['Operations'];
    }
  };

  const openBrandModal = (brandToEdit?: Brand) => {
    setEditingBrand(brandToEdit || null);
    setIsBrandModalOpen(true);
  };

  const activeThreatsCount = findings.filter(
    (f) => f.status !== 'resolved' && f.status !== 'false_positive'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        threatCount={activeThreatsCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          breadcrumbs={getBreadcrumbs()}
          onOpenBrandModal={() => openBrandModal()}
          onQuickScan={handleTriggerScanSocial}
          isScanning={scanModalState.isOpen && !scanModalState.result}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-slide-up">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              recentFindings={findings}
              brands={brands}
              onSelectFinding={(id) => setSelectedFindingId(id)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onTriggerScanSocial={handleTriggerScanSocial}
              onTriggerScanApps={handleTriggerScanApps}
              onOpenBrandModal={() => openBrandModal()}
            />
          )}

          {currentTab === 'url_analysis' && (
            <UrlAnalysisPage />
          )}

          {currentTab === 'brands' && (
            <BrandsPage
              brands={brands}
              onOpenBrandModal={(b) => openBrandModal(b)}
              onRefreshBrands={fetchData}
            />
          )}

          {currentTab === 'social' && (
            <SocialMonitoringPage
              findings={findings}
              brands={brands}
              onSelectFinding={(id) => setSelectedFindingId(id)}
              onTriggerScan={handleTriggerScanSocial}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              isScanning={scanModalState.isOpen && !scanModalState.result}
            />
          )}

          {currentTab === 'apps' && (
            <AppMonitoringPage
              findings={findings}
              brands={brands}
              onSelectFinding={(id) => setSelectedFindingId(id)}
              onTriggerScan={handleTriggerScanApps}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              isScanning={scanModalState.isOpen && !scanModalState.result}
            />
          )}

          {currentTab === 'lookalike' && (
            <LookalikeSandboxPage brands={brands} />
          )}

          {currentTab === 'risk' && (
            <RiskManagementPage
              findings={findings}
              brands={brands}
              onSelectFinding={(id) => setSelectedFindingId(id)}
              onOpenTakedown={(f) => setTakedownFinding(f)}
              onRefreshFindings={fetchData}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage findings={findings} brands={brands} />
          )}

          {currentTab === 'architecture' && <ArchitecturePage />}

          {currentTab === 'settings' && (
            <SettingsPage onRefreshAll={fetchData} />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      {isBrandModalOpen && (
        <BrandModal
          brand={editingBrand}
          onClose={() => setIsBrandModalOpen(false)}
          onSaved={fetchData}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          brands={brands}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={fetchData}
        />
      )}

      {selectedFindingId && (
        <EvidenceDrawer
          findingId={selectedFindingId}
          onClose={() => setSelectedFindingId(null)}
          onOpenTakedown={(f) => setTakedownFinding(f)}
          onFindingUpdated={fetchData}
        />
      )}

      {takedownFinding && (
        <TakedownModal
          finding={takedownFinding}
          onClose={() => setTakedownFinding(null)}
        />
      )}

      {scanModalState.isOpen && (
        <ScanProgressModal
          scanType={scanModalState.scanType}
          brandName={scanModalState.brandName}
          result={scanModalState.result}
          onClose={() => {
            setScanModalState((prev) => ({ ...prev, isOpen: false, result: null }));
            fetchData();
          }}
        />
      )}
    </div>
  );
}
