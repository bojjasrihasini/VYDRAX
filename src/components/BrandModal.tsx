import React, { useState, useEffect } from 'react';
import { Brand, OfficialSocialAsset, OfficialApp, PlatformType, AppStorePlatform } from '../types/index.ts';
import { X, Plus, Trash2, CheckCircle2, ShieldCheck, ShieldAlert, Globe, ExternalLink } from 'lucide-react';

interface BrandModalProps {
  brand: Brand | null; // null = create new
  onClose: () => void;
  onSaved: () => void;
}

export const BrandModal: React.FC<BrandModalProps> = ({ brand, onClose, onSaved }) => {
  const isEditing = Boolean(brand);

  // Brand form state
  const [name, setName] = useState(brand?.name || '');
  const [website, setWebsite] = useState(brand?.website || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || '');
  const [keywords, setKeywords] = useState(brand?.keywords?.join(', ') || '');
  const [aliases, setAliases] = useState(brand?.aliases?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asset lists for edit mode
  const [socialAssets, setSocialAssets] = useState<OfficialSocialAsset[]>([]);
  const [apps, setApps] = useState<OfficialApp[]>([]);
  const [activeAssetTab, setActiveAssetTab] = useState<'social' | 'apps'>('social');

  // New social asset state
  const [newPlatform, setNewPlatform] = useState<PlatformType>('Instagram');
  const [newSocialUsername, setNewSocialUsername] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // New app state
  const [newAppName, setNewAppName] = useState('');
  const [newAppPlatform, setNewAppPlatform] = useState<AppStorePlatform>('Google Play Store');
  const [newAppUrl, setNewAppUrl] = useState('');
  const [newPackageId, setNewPackageId] = useState('');
  const [newDeveloperName, setNewDeveloperName] = useState('');

  const fetchAssets = async () => {
    if (!brand?.id) return;
    try {
      const res = await fetch(`/api/brands/${brand.id}`);
      if (res.ok) {
        const data = await res.json();
        setSocialAssets(data.official_social_assets || []);
        setApps(data.official_apps || []);
      }
    } catch (e) {
      console.error('Failed to fetch brand assets:', e);
    }
  };

  useEffect(() => {
    if (brand?.id) {
      fetchAssets();
    }
  }, [brand]);

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Brand name is required.');
      return;
    }
    if (!website.trim() || !website.startsWith('http')) {
      setError('A valid website URL starting with http:// or https:// is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        website: website.trim(),
        description: description.trim(),
        logo_url: logoUrl.trim() || null,
        keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
        aliases: aliases.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const url = isEditing ? `/api/brands/${brand!.id}` : '/api/brands';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save brand');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand?.id || !newSocialUsername.trim() || !newSocialUrl.trim()) return;

    try {
      const res = await fetch(`/api/brands/${brand.id}/social-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPlatform,
          username: newSocialUsername.trim(),
          account_url: newSocialUrl.trim(),
        }),
      });
      if (res.ok) {
        setNewSocialUsername('');
        setNewSocialUrl('');
        fetchAssets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVerifySocial = async (asset: OfficialSocialAsset) => {
    const nextState = !asset.is_verified;
    if (nextState) {
      const confirmed = window.confirm(
        `Confirm explicit verification for @${asset.username} on ${asset.platform}? This will mark this identifier as trusted and exclude it from impersonation detections.`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`/api/social-assets/${asset.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_verified: nextState,
          verified_by: 'SecOps Administrator',
        }),
      });
      if (res.ok) fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!window.confirm('Remove this official social account registration?')) return;
    try {
      const res = await fetch(`/api/social-assets/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand?.id || !newAppName.trim() || !newPackageId.trim()) return;

    try {
      const res = await fetch(`/api/brands/${brand.id}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: newAppName.trim(),
          platform: newAppPlatform,
          listing_url: newAppUrl.trim(),
          package_id: newPackageId.trim(),
          developer_name: newDeveloperName.trim(),
        }),
      });
      if (res.ok) {
        setNewAppName('');
        setNewAppUrl('');
        setNewPackageId('');
        setNewDeveloperName('');
        fetchAssets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVerifyApp = async (app: OfficialApp) => {
    const nextState = !app.is_verified;
    if (nextState) {
      const confirmed = window.confirm(
        `Confirm explicit verification for app '${app.app_name}' (Package: ${app.package_id})? This will exclude this application from rogue app findings.`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`/api/apps/${app.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_verified: nextState,
          verified_by: 'AppSec Lead',
        }),
      });
      if (res.ok) fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!window.confirm('Remove this official application registration?')) return;
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Brand: ${brand?.name}` : 'Register Monitored Organization'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure brand identity parameters, official social handles, and verified app packages.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Brand / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vytrix Financial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Official Website URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://vytrix.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Organization Description
              </label>
              <textarea
                rows={2}
                placeholder="Institutional banking and wealth platform..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Brand Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="vytrix, banking, vault, payments"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Brand Aliases & Trademarks
                </label>
                <input
                  type="text"
                  placeholder="vytrixpay, vytrix wealth"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-hover px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving Brand...' : isEditing ? 'Save Profile Updates' : 'Create Brand Profile'}
              </button>
            </div>
          </form>

          {/* Registered Official Assets Section (Available when editing) */}
          {isEditing && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Registered Official Brand Assets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exact matches to verified assets are automatically excluded from impersonation findings.
                  </p>
                </div>
                {/* Segmented Tab */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveAssetTab('social')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeAssetTab === 'social'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Social Accounts ({socialAssets.length})
                  </button>
                  <button
                    onClick={() => setActiveAssetTab('apps')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeAssetTab === 'apps'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Mobile Apps ({apps.length})
                  </button>
                </div>
              </div>

              {/* Social Tab */}
              {activeAssetTab === 'social' && (
                <div className="space-y-3">
                  {/* Add Social Asset Form */}
                  <form
                    onSubmit={handleAddSocialAsset}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
                  >
                    <select
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value as PlatformType)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="X">X (Twitter)</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Telegram">Telegram</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Username (e.g. vytrix)"
                      value={newSocialUsername}
                      onChange={(e) => setNewSocialUsername(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="url"
                      required
                      placeholder="https://instagram.com/vytrix"
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="btn-hover px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Social</span>
                    </button>
                  </form>

                  {/* List of registered social assets */}
                  <div className="space-y-2">
                    {socialAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{asset.platform}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-emerald-700 font-bold">@{asset.username}</span>
                          <span className="text-slate-300">·</span>
                          <a
                            href={asset.account_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-800 truncate max-w-xs flex items-center gap-1 font-medium"
                          >
                            <span>{asset.account_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                          </a>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Explicit Verification Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleVerifySocial(asset)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              asset.is_verified
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                            }`}
                            title="Click to toggle explicit administrator verification"
                          >
                            {asset.is_verified ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified Official</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                <span>Unverified (Click to Authorize)</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteSocial(asset.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Remove asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apps Tab */}
              {activeAssetTab === 'apps' && (
                <div className="space-y-3">
                  {/* Add App Form */}
                  <form
                    onSubmit={handleAddApp}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="App Title (e.g. Vytrix Banking)"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={newAppPlatform}
                      onChange={(e) => setNewAppPlatform(e.target.value as AppStorePlatform)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Google Play Store">Google Play Store</option>
                      <option value="Apple App Store">Apple App Store</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Package ID (e.g. com.vytrix.bank)"
                      value={newPackageId}
                      onChange={(e) => setNewPackageId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Official Developer / Publisher"
                      value={newDeveloperName}
                      onChange={(e) => setNewDeveloperName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="url"
                      required
                      placeholder="Official Store Listing URL"
                      value={newAppUrl}
                      onChange={(e) => setNewAppUrl(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="btn-hover px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register App</span>
                    </button>
                  </form>

                  {/* List of registered apps */}
                  <div className="space-y-2">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{app.app_name}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-emerald-700 font-bold">{app.package_id}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600 font-medium">{app.developer_name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleVerifyApp(app)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              app.is_verified
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                            }`}
                            title="Click to toggle explicit administrator verification"
                          >
                            {app.is_verified ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified App</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                <span>Unverified (Click to Authorize)</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteApp(app.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Remove app"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
