import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  QrCode,
  RotateCcw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  buildAppShareUrl,
  filterAndSortProducts,
  isInternalPreviewHost,
} from '../utils/storeLogic';
import { AppIconTile } from './AppIconTile';
import { QrCodeSvg } from './QrCodeSvg';
import type {
  AppPlatformFilter,
  AppView,
  FilterState,
  PriceBracket,
  Product,
  ProductCategory,
  SortOption,
  StoreSettings,
} from '../types/store';

interface CatalogSectionProps {
  apps: Product[];
  settings: StoreSettings;
  activeStoreOrigin: string;
  displayHostLabel: string;
  deepLinkedAppId?: string | null;
  onClearDeepLink?: () => void;
  platformFilter: AppPlatformFilter;
  searchQuery: string;
  onPlatformChange: (platform: AppPlatformFilter) => void;
  onSearchChange: (q: string) => void;
  onAddToCart: (product: Product) => void;
  onAppDownloaded: (appId: string) => void;
  onNavigateView: (view: AppView) => void;
}

const PLATFORMS: Array<{ id: AppPlatformFilter; label: string }> = [
  { id: 'All', label: 'All Store Apps' },
  { id: 'PC', label: 'PC (.EXE)' },
  { id: 'Mobile', label: 'Mobile (.APK)' },
  { id: 'Templates', label: 'Templates' },
];

const CATEGORIES: ProductCategory[] = [
  'All',
  'Business & POS',
  'M Cloud & Sync',
  'Productivity',
  'Developer Tools',
  'Mobile Utilities',
  'Templates & Design',
];

const PRICE_BRACKETS: Array<{ id: PriceBracket; label: string }> = [
  { id: 'all', label: 'Any Price' },
  { id: 'free', label: 'Free ($0)' },
  { id: 'under-100', label: 'Under $100' },
  { id: '100-500', label: '$100 – $500' },
  { id: 'over-500', label: '$500+' },
];

const RATING_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Any Rating' },
  { value: 4.5, label: '4.5★ & up' },
  { value: 4.0, label: '4.0★ & up' },
  { value: 3.5, label: '3.5★ & up' },
];

function isValidDownloadUrl(url?: string): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function CatalogSection({
  apps,
  settings,
  activeStoreOrigin,
  displayHostLabel,
  deepLinkedAppId,
  onClearDeepLink,
  platformFilter,
  searchQuery,
  onPlatformChange,
  onSearchChange,
  onAddToCart,
  onAppDownloaded,
  onNavigateView,
}: CatalogSectionProps) {
  const [category, setCategory] = useState<ProductCategory>('All');
  const [priceBracket, setPriceBracket] = useState<PriceBracket>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const [selectedApp, setSelectedApp] = useState<Product | null>(null);
  const [qrModalApp, setQrModalApp] = useState<Product | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!deepLinkedAppId) return;
    const matched = apps.find((a) => a.id === deepLinkedAppId);
    if (matched) {
      setSelectedApp(matched);
      onClearDeepLink?.();
    }
  }, [deepLinkedAppId, apps, onClearDeepLink]);

  const filters: FilterState = {
    query: searchQuery,
    platform: platformFilter,
    category,
    priceBracket,
    minPrice: null,
    maxPrice: null,
    minRating,
    sortBy,
  };

  const filteredApps = useMemo(() => filterAndSortProducts(apps, filters), [apps, filters]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    platformFilter !== 'All' ||
    category !== 'All' ||
    priceBracket !== 'all' ||
    minRating > 0;

  const resetFilters = () => {
    onSearchChange('');
    onPlatformChange('All');
    setCategory('All');
    setPriceBracket('all');
    setMinRating(0);
    setSortBy('featured');
  };

  const triggerDownload = (app: Product): boolean => {
    const directUrl = app.downloadUrl?.trim();
    if (!isValidDownloadUrl(directUrl)) {
      setDownloadNotice(
        `No download link is configured yet for "${app.name}". Add a valid release URL in catalog.ts or contact Mashal Tech.`
      );
      window.setTimeout(() => {
        setDownloadNotice(null);
      }, 4500);
      return false;
    }

    setDownloadNotice(null);
    setDownloadingId(app.id);
    onAppDownloaded(app.id);

    const link = document.createElement('a');
    link.href = directUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (app.originalFileName) {
      link.setAttribute('download', app.originalFileName);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => {
      setDownloadingId((cur) => (cur === app.id ? null : cur));
    }, 1800);

    return true;
  };

  const handleCardPrimaryAction = (app: Product) => {
    if (app.price === 0) {
      triggerDownload(app);
      return;
    }
    onAddToCart(app);
    setAddedId(app.id);
    window.setTimeout(() => {
      setAddedId((cur) => (cur === app.id ? null : cur));
    }, 1400);
  };

  const getDownloadButtonText = (app: Product) => {
    if (app.price === 0) {
      if (downloadingId === app.id) return 'Downloading...';
      if (!isValidDownloadUrl(app.downloadUrl)) return 'Link Pending';
      if (app.fileFormat.toLowerCase().includes('apk')) return 'Download .apk';
      if (app.fileFormat.toLowerCase().includes('exe')) return 'Download .exe';
      return 'Download';
    }
    return addedId === app.id ? 'Added to Bag' : `Buy $${app.price}`;
  };

  const getAppShareLink = (app: Product) => {
    return buildAppShareUrl(app.id, activeStoreOrigin);
  };

  const storeOriginUrl = activeStoreOrigin;
  const hideRawOrigin = isInternalPreviewHost(activeStoreOrigin);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      {/* Subtle Announcement Bar */}
      {settings.announcementBanner && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-700 shadow-2xs">
          <span className="font-medium">{settings.announcementBanner}</span>
          <button
            type="button"
            onClick={() => onNavigateView('order-app')}
            className="inline-flex items-center gap-1 font-semibold text-[#E85D22] hover:underline"
          >
            <span>Commission Custom App</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Download Notice Banner When a Free App Lacks a Configured Link */}
      {downloadNotice && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-950"
        >
          <span>{downloadNotice}</span>
          <button
            type="button"
            onClick={() => setDownloadNotice(null)}
            className="text-amber-800 hover:text-amber-950"
            aria-label="Dismiss download notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Clean Minimalist Hero Header + Unified Search */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium text-[#0284C7]">
              {displayHostLabel} · Official Software Releases
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl [text-wrap:balance]">
              {settings.storeName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">
              Download verified Windows PC (<span className="font-mono">.EXE</span>) and Android (
              <span className="font-mono">.APK</span>) software crafted by Saddam Hussain — or order custom offline/online software with live progress tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateView('order-app')}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#E85D22] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#cf4e18] whitespace-nowrap shrink-0"
            >
              <span>Order Custom App</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateView('track')}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 transition-colors hover:border-stone-950 whitespace-nowrap shrink-0"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
              <span>Track Key</span>
            </button>
          </div>
        </div>

        {/* Unified Search & Inline Filters Strip */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-stone-100 pt-5 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <label htmlFor="storefront-search" className="sr-only">
              Search apps, installers, APKs, or templates
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="storefront-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search apps, .exe setups, .apk, ERP, or ledger..."
              className="h-10 w-full rounded-lg border border-stone-300 bg-[#FAF9F7] pl-10 pr-8 text-sm text-stone-950 placeholder:text-stone-400 focus:border-[#009FE3] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:col-span-7">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="h-10 rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-800 focus:border-[#009FE3] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by price range"
              value={priceBracket}
              onChange={(e) => setPriceBracket(e.target.value as PriceBracket)}
              className="h-10 rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-800 focus:border-[#009FE3] focus:outline-none"
            >
              {PRICE_BRACKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by customer rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="h-10 rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-800 focus:border-[#009FE3] focus:outline-none"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort apps"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-800 focus:border-[#009FE3] focus:outline-none"
            >
              <option value="featured">Featured First</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Platform Switcher + Result Count */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((plat) => {
            const active = platformFilter === plat.id;
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => onPlatformChange(plat.id)}
                className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-stone-950 text-white'
                    : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950'
                }`}
              >
                {plat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-600">
          <span data-testid="catalog-result-count" className="font-mono tabular-nums">
            Showing {filteredApps.length} of {apps.length} apps
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-semibold text-[#E85D22] hover:underline"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Spacious 3-Column App Store Grid */}
      {filteredApps.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
          <Search className="mb-3 h-8 w-8 text-stone-400" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-stone-950">No apps match your search</h2>
          <p className="mt-1 max-w-md text-sm text-stone-600">
            Need a custom Windows or Android tool built for this exact purpose? Request it from Mashal Tech in minutes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-900"
            >
              Show All Apps
            </button>
            <button
              type="button"
              onClick={() => onNavigateView('order-app')}
              className="rounded-lg bg-[#E85D22] px-4 py-2 text-xs font-semibold text-white"
            >
              Order Custom App
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((app) => (
            <article
              key={app.id}
              data-testid="product-card"
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-150 hover:border-stone-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      className="shrink-0 focus-visible:outline-2 focus-visible:outline-[#E85D22]"
                      aria-label={`Open details for ${app.name}`}
                    >
                      <AppIconTile app={app} size="md" />
                    </button>
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-bold leading-snug text-stone-950">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="text-left hover:text-[#009FE3]"
                        >
                          {app.name}
                        </button>
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {app.platform} · <span className="font-mono">{app.fileFormat}</span> ·{' '}
                        {app.fileSize}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-stone-950 tabular-nums">
                    {app.price === 0 ? 'Free' : `$${app.price}`}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-stone-600">
                  {app.shortDesc}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{app.verifiedLabel || `Verified ${app.version}`}</span>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-stone-800 tabular-nums">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {app.rating.toFixed(1)}
                  </span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{app.downloads.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3.5">
                <button
                  type="button"
                  onClick={() => setQrModalApp(app)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:text-stone-950"
                  aria-label={`Share QR code for ${app.name}`}
                >
                  <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Share QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCardPrimaryAction(app)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 ${
                    app.price === 0
                      ? 'bg-[#009FE3] hover:bg-[#0284C7]'
                      : addedId === app.id
                      ? 'bg-emerald-700'
                      : 'bg-stone-950 hover:bg-[#E85D22]'
                  }`}
                >
                  {app.price === 0 && (
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{getDownloadButtonText(app)}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Clean Bottom Store QR + Developer Contact Strip */}
      <section className="mt-12 grid grid-cols-1 items-center gap-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-8">
          <p className="font-mono text-xs font-medium text-[#E85D22]">
            Need Custom Software or Easypaisa Assistance?
          </p>
          <h2 className="font-display text-2xl font-bold text-stone-950">
            Talk Directly with Mashal Tech ({settings.easypaisaAccountName})
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
            Share any app QR code with friends or clients to help grow Mashal Tech. For tailored PC/Mobile software or Easypaisa license verification, reach out directly:
          </p>
          <div className="flex flex-wrap gap-5 pt-2 text-xs text-stone-700">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Mail className="h-3.5 w-3.5 text-[#E85D22]" aria-hidden="true" />
              {settings.contactEmail}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#0284C7]">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {settings.easypaisaNumber} (WhatsApp / Easypaisa)
            </span>
            <span className="inline-flex items-center gap-1.5 text-stone-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {settings.location}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-4 lg:col-span-4">
          <QrCodeSvg
            value={storeOriginUrl}
            size={104}
            showActions
            downloadFileName="mashaltech-store-qr.png"
          />
          <span className="mt-2 max-w-full truncate font-mono text-[10px] text-stone-500">
            {displayHostLabel}
          </span>
        </div>
      </section>

      {/* App Detail Modal */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdp-title"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-stone-950"
              aria-label="Close app listing"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 pr-10">
              <AppIconTile app={selectedApp} size="lg" />
              <div>
                <p className="font-mono text-xs text-stone-500">
                  {selectedApp.platform} · {selectedApp.osLabel} · {selectedApp.version}
                </p>
                <h2 id="pdp-title" className="mt-1 font-display text-2xl font-bold text-stone-950">
                  {selectedApp.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <span className="inline-flex items-center gap-1 font-semibold text-stone-900">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {selectedApp.rating.toFixed(1)} ({selectedApp.reviewCount})
                  </span>
                  <span>·</span>
                  <span className="font-mono">{selectedApp.downloads.toLocaleString()} downloads</span>
                  <span>·</span>
                  <span className="font-mono">
                    {selectedApp.fileFormat} ({selectedApp.fileSize})
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-stone-700">{selectedApp.fullDesc}</p>

            <div className="mt-6 grid grid-cols-1 gap-5 border-t border-stone-100 pt-5 sm:grid-cols-12">
              <div className="sm:col-span-7">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Features &amp; Requirements
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs text-stone-700">
                  {selectedApp.specs.map((spec) => (
                    <li key={spec} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#009FE3]" aria-hidden="true" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-3.5 sm:col-span-5">
                <QrCodeSvg
                  value={getAppShareLink(selectedApp)}
                  size={104}
                  showActions
                  downloadFileName={`${selectedApp.id}-qr.png`}
                />
                <span className="mt-2 text-center font-mono text-[10px] text-stone-500">
                  Share App QR Link
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-5">
              <div>
                <span className="block text-xs text-stone-500">Package Price</span>
                <span className="font-mono text-2xl font-bold text-stone-950 tabular-nums">
                  {selectedApp.price === 0 ? 'Free Download' : `$${selectedApp.price.toLocaleString()}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const shouldClose = selectedApp.price !== 0 || triggerDownload(selectedApp);
                  if (shouldClose) {
                    setSelectedApp(null);
                  }
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E85D22] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#cf4e18]"
              >
                {selectedApp.price === 0 && (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{getDownloadButtonText(selectedApp)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shareable App QR Modal */}
      {qrModalApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Share QR Code for ${qrModalApp.name}`}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setQrModalApp(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-stone-950"
              aria-label="Close QR modal"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-lg font-bold text-stone-950">{qrModalApp.name}</h3>
            <p className="mt-1 text-xs text-stone-500">
              Share this QR code on WhatsApp or social media to promote Mashal Tech!
            </p>
            <div className="my-5 flex justify-center">
              <QrCodeSvg
                value={getAppShareLink(qrModalApp)}
                size={180}
                showActions
                downloadFileName={`${qrModalApp.id}-qr.png`}
              />
            </div>
            <p className="mb-3 truncate rounded bg-stone-50 px-2.5 py-1.5 font-mono text-[10px] text-stone-500">
              {hideRawOrigin
                ? `Direct Storefront QR Ready (${qrModalApp.sku})`
                : getAppShareLink(qrModalApp)}
            </p>
            <button
              type="button"
              onClick={() => {
                if (triggerDownload(qrModalApp)) {
                  setQrModalApp(null);
                }
              }}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-[#009FE3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0284C7]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download {qrModalApp.fileFormat} Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
