import React, { useState } from 'react';
import { PlatformType, AppStorePlatform, Brand } from '../types/index.ts';
import { X, Upload, Smartphone, Users } from 'lucide-react';

interface ImportModalProps {
  brands: Brand[];
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ brands, onClose, onImportComplete }) => {
  const [importType, setImportType] = useState<'social' | 'app'>('social');
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '');

  // Social fields
  const [socialPlatform, setSocialPlatform] = useState<PlatformType>('Instagram');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [bio, setBio] = useState('');

  // App fields
  const [appPlatform, setAppPlatform] = useState<AppStorePlatform>('Google Play Store');
  const [appName, setAppName] = useState('');
  const [packageId, setPackageId] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [appListingUrl, setAppListingUrl] = useState('');
  const [appDescription, setAppDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (importType === 'social') {
        if (!username || !profileUrl) throw new Error('Username and profile URL are required');
        const res = await fetch('/api/candidates/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: socialPlatform,
            username: username.trim(),
            display_name: displayName.trim() || username.trim(),
            profile_url: profileUrl.trim(),
            bio: bio.trim(),
            associated_brand_id: selectedBrandId,
          }),
        });
        if (!res.ok) throw new Error('Failed to import social candidate');
      } else {
        if (!appName || !packageId || !appListingUrl) throw new Error('App title, package ID, and listing URL are required');
        const res = await fetch('/api/candidates/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: appPlatform,
            app_name: appName.trim(),
            package_id: packageId.trim(),
            developer_name: developerName.trim() || 'Unknown Developer',
            listing_url: appListingUrl.trim(),
            description: appDescription.trim(),
            associated_brand_id: selectedBrandId,
          }),
        });
        if (!res.ok) throw new Error('Failed to import app candidate');
      }

      onImportComplete();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Import Suspect Candidate for Scanning
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setImportType('social')}
              className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                importType === 'social' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Social Media Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setImportType('app')}
              className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                importType === 'app' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Application</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Target Monitored Brand</label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.website})
                </option>
              ))}
            </select>
          </div>

          {importType === 'social' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Platform</label>
                  <select
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value as PlatformType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="X">X (Twitter)</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Telegram">Telegram</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Username / Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vytrix_support"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vytrix Official Helpdesk"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Profile Listing URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://instagram.com/vytrix_support"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Profile Biography / Description</label>
                <textarea
                  rows={2}
                  placeholder="Official 24/7 client resolution desk. DM for support..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Store Platform</label>
                  <select
                    value={appPlatform}
                    onChange={(e) => setAppPlatform(e.target.value as AppStorePlatform)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Google Play Store">Google Play Store</option>
                    <option value="Apple App Store">Apple App Store</option>
                    <option value="Third-Party APK">Third-Party APK</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Application Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vytrix Fast Loan"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Package Name / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="com.vytrix.fastloans"
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Publisher / Developer</label>
                  <input
                    type="text"
                    placeholder="Rogue Dev Studio"
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Store Listing URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://play.google.com/store/apps/details?id=com.vytrix.fastloans"
                  value={appListingUrl}
                  onChange={(e) => setAppListingUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Store Description</label>
                <textarea
                  rows={2}
                  placeholder="Instant loans with zero collateral. Enter banking credentials..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-hover px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Importing...' : 'Add to Candidate Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
