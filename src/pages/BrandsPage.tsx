import React, { useState } from 'react';
import { Brand } from '../types/index.ts';
import {
  Globe2,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  Share2,
} from 'lucide-react';

interface BrandsPageProps {
  brands: Brand[];
  onOpenBrandModal: (brand?: Brand) => void;
  onRefreshBrands: () => void;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({
  brands,
  onOpenBrandModal,
  onRefreshBrands,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(brands[0] || null);

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand profile for '${name}'? This will remove all associated official asset registrations and findings.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshBrands();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Monitored Organizations & Brand Registries
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Register official brand assets, authorized social handles, and app package IDs for exclusion and look-alike detection.
          </p>
        </div>

        <button
          onClick={() => onOpenBrandModal()}
          className="btn-hover inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Brand</span>
        </button>
      </div>

      {/* Brand Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((b) => (
          <div
            key={b.id}
            className={`rounded-2xl border transition-all p-6 flex flex-col justify-between card-hover shadow-sm ${
              selectedBrand?.id === b.id
                ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/15'
                : 'bg-white border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-extrabold text-emerald-700 text-base shadow-sm">
                    {b.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {b.name}
                    </h3>
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 mt-1 font-medium"
                    >
                      <span>{b.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenBrandModal(b)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Edit brand profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(b.id, b.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete brand"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-5 leading-relaxed">
                {b.description || 'No organization summary provided.'}
              </p>

              {/* Registered Asset Counters */}
              <div className="grid grid-cols-3 gap-3 py-3.5 border-y border-slate-100 text-xs">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block flex items-center gap-1 mb-1">
                    <Share2 className="w-3 h-3 text-emerald-600" />
                    <span>Social</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums text-base">
                    {b.official_social_count || 0}
                  </span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block flex items-center gap-1 mb-1">
                    <Smartphone className="w-3 h-3 text-emerald-600" />
                    <span>Apps</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums text-base">
                    {b.official_app_count || 0}
                  </span>
                </div>
                <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60">
                  <span className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider block flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Threats</span>
                  </span>
                  <span className="font-mono font-bold text-rose-700 tabular-nums text-base">
                    {b.active_threats_count || 0}
                  </span>
                </div>
              </div>

              {/* Aliases & Keywords */}
              <div className="pt-4 text-xs space-y-1.5">
                <div className="text-slate-600">
                  <span className="text-slate-400 font-semibold">Aliases: </span>
                  <span className="text-slate-800">{b.aliases?.length ? b.aliases.join(', ') : 'None registered'}</span>
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400 font-semibold">Keywords: </span>
                  <span className="text-slate-800">{b.keywords?.length ? b.keywords.join(', ') : 'None registered'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onOpenBrandModal(b)}
                className="btn-hover w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all text-center"
              >
                Manage Official Assets & Verification
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
