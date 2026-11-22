import { CheckCircle2, Loader2, Palette, Send } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { calculateDesignQuote } from '../utils/storeLogic';
import type {
  DesignArtStyle,
  DesignAssetType,
  DesignOrderConfig,
  InquiryRecord,
} from '../types/store';

interface DesignOrderStudioProps {
  onOrderCreated: (order: InquiryRecord) => void;
}

const ASSET_TYPES: Array<{ type: DesignAssetType; desc: string }> = [
  { type: 'Brand Illustration Pack', desc: 'Bespoke vector scenes for landing pages, onboarding, and editorial' },
  { type: 'UI/UX Design System', desc: 'Complete Figma token architecture, components, and screen flows' },
  { type: 'Product 3D Render', desc: 'Studio-lit industrial or hardware renders in 4K & interactive GLB' },
  { type: 'Logo & Identity Suite', desc: 'Geometric mark, typography pairing, color rules, and brand kit' },
  { type: 'Motion Graphics Kit', desc: 'Lightweight Lottie UI loops and micro-interaction animations' },
];

const ART_STYLES: DesignArtStyle[] = [
  'Minimalist Vector',
  'Isometric Technical',
  'Editorial Ink',
  'Photorealistic 3D',
  'Brand Monochrome',
];

const FILE_FORMATS = ['SVG', 'Figma', 'PNG 4K', 'React TSX', 'PDF Print', 'Lottie JSON'];

const PALETTE_PRESETS = [
  { name: 'Mashal Signature', primary: '#E85D22', secondary: '#009FE3' },
  { name: 'Obsidian Editorial', primary: '#111318', secondary: '#525866' },
  { name: 'Nordic Slate', primary: '#0F172A', secondary: '#0284C7' },
  { name: 'Warm Studio', primary: '#B45309', secondary: '#1C1917' },
];

export function DesignOrderStudio({ onOrderCreated }: DesignOrderStudioProps) {
  const [config, setConfig] = useState<DesignOrderConfig>({
    assetType: 'Brand Illustration Pack',
    artStyle: 'Minimalist Vector',
    assetCount: 6,
    revisions: 3,
    formats: ['SVG', 'Figma', 'PNG 4K'],
    turnaround: 'standard',
    license: 'standard',
    primaryColor: '#E85D22',
    secondaryColor: '#009FE3',
  });

  const [projectTitle, setProjectTitle] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('Web Storefront & Marketing');
  const [dimensions, setDimensions] = useState('Scalable SVG + 2400x1800px');
  const [brief, setBrief] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<InquiryRecord | null>(null);

  const quote = useMemo(() => calculateDesignQuote(config), [config]);

  const toggleFormat = (format: string) => {
    setConfig((prev) => {
      const exists = prev.formats.includes(format);
      if (exists && prev.formats.length === 1) return prev;
      return {
        ...prev,
        formats: exists ? prev.formats.filter((f) => f !== format) : [...prev.formats, format],
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/orders/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          projectTitle,
          targetPlatform,
          dimensions,
          brief,
          config,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit custom design order.');
      }

      setConfirmedOrder(data.order);
      onOrderCreated(data.order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Order submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Header Banner with Studio Visual */}
      <section className="grid grid-cols-1 items-stretch gap-8 border-b border-stone-200 pb-10 lg:grid-cols-12">
        <div className="flex flex-col justify-center space-y-3 lg:col-span-7">
          <p className="text-xs font-medium tracking-wide text-stone-500">
            Mashal Design Studio · Custom Illustrations · Identity &amp; UI Systems
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl [text-wrap:balance]">
            Commission Custom Illustrations &amp; Design Assets
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            Configure your exact visual deliverables, art direction, file formats, brand color palette, revision rounds, and commercial rights with instant transparent pricing.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 lg:col-span-5">
          <img
            src="/src/assets/images/product_design_kit_1794924165298.jpg"
            alt="Mashal Design Studio custom illustration specimens and color swatches"
            referrerPolicy="no-referrer"
            className="h-48 w-full object-cover lg:h-full"
          />
        </div>
      </section>

      {confirmedOrder ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="font-display text-2xl font-bold text-emerald-950">
                Design Commission Confirmed · {confirmedOrder.referenceCode}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-900">
                Thank you, {confirmedOrder.customerName}. Your brief for{' '}
                <strong>{confirmedOrder.subject}</strong> has been logged in our Customer Handling Dashboard with an estimated delivery of{' '}
                <span className="font-mono font-semibold">{quote.estimatedDays} business days</span>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  setProjectTitle('');
                  setBrief('');
                }}
                className="mt-5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Place Another Design Order
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Detailed Configuration Column */}
          <div className="space-y-8 lg:col-span-8">
            {/* Step 1: Asset Category */}
            <section className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-stone-950">
                01. Select Asset Deliverable Type
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ASSET_TYPES.map((item) => {
                  const active = config.assetType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, assetType: item.type }))}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-[#E85D22] bg-orange-50/40'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <span className="block font-display text-sm font-bold text-stone-950">
                        {item.type}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-stone-600">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Art Direction, Quantity & Formats */}
            <section className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-stone-950">
                02. Art Direction, Quantity &amp; Formats
              </h2>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Visual Style
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ART_STYLES.map((style) => {
                    const active = config.artStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, artStyle: style }))}
                        className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-stone-950 text-white'
                            : 'border border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="asset-count-range" className="text-xs font-semibold text-stone-700">
                      Number of Custom Assets
                    </label>
                    <span className="font-mono text-sm font-bold text-stone-950 tabular-nums">
                      {config.assetCount} assets
                    </span>
                  </div>
                  <input
                    id="asset-count-range"
                    type="range"
                    min={1}
                    max={25}
                    value={config.assetCount}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, assetCount: Number(e.target.value) }))
                    }
                    className="mt-2 w-full accent-[#E85D22]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="revisions-range" className="text-xs font-semibold text-stone-700">
                      Included Revision Rounds
                    </label>
                    <span className="font-mono text-sm font-bold text-stone-950 tabular-nums">
                      {config.revisions} rounds
                    </span>
                  </div>
                  <input
                    id="revisions-range"
                    type="range"
                    min={1}
                    max={8}
                    value={config.revisions}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, revisions: Number(e.target.value) }))
                    }
                    className="mt-2 w-full accent-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Required Source &amp; Export Formats
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {FILE_FORMATS.map((fmt) => {
                    const active = config.formats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(fmt)}
                        className={`min-h-[36px] rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#0284C7] text-white'
                            : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Step 3: Color Palette, Licensing & Turnaround */}
            <section className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#E85D22]" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-stone-950">
                  03. Color System, Turnaround &amp; Licensing
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-stone-700">Quick Color Presets</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PALETTE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            primaryColor: preset.primary,
                            secondaryColor: preset.secondary,
                          }))
                        }
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-2.5 py-2 text-left text-xs font-medium text-stone-800 hover:border-stone-400"
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="primary-hex" className="block text-xs font-semibold text-stone-700">
                      Primary Accent
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-stone-200 px-2.5 py-1.5">
                      <input
                        id="primary-hex"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-stone-700">{config.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="secondary-hex" className="block text-xs font-semibold text-stone-700">
                      Secondary Accent
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-stone-200 px-2.5 py-1.5">
                      <input
                        id="secondary-hex"
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-stone-700">{config.secondaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-stone-700">Delivery Speed</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, turnaround: 'standard' }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        config.turnaround === 'standard'
                          ? 'border-stone-950 bg-stone-950 text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, turnaround: 'express' }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        config.turnaround === 'express'
                          ? 'border-[#E85D22] bg-[#E85D22] text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      Express (+35%)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-stone-700">Rights &amp; License</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, license: 'standard' }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        config.license === 'standard'
                          ? 'border-stone-950 bg-stone-950 text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      Commercial
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, license: 'exclusive' }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        config.license === 'exclusive'
                          ? 'border-stone-950 bg-stone-950 text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      Exclusive IP (+40%)
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 4: Creative Brief & Client Info */}
            <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-stone-950">
                04. Project Brief &amp; Client Details
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="design-project-title" className="block text-xs font-semibold text-stone-700">
                    Project Title
                  </label>
                  <input
                    id="design-project-title"
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g., M Cloud Onboarding Illustrations"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="design-target-platform" className="block text-xs font-semibold text-stone-700">
                    Target Surface / Platform
                  </label>
                  <input
                    id="design-target-platform"
                    type="text"
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="design-dimensions" className="block text-xs font-semibold text-stone-700">
                  Preferred Aspect Ratio or Dimensions
                </label>
                <input
                  id="design-dimensions"
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="design-brief" className="block text-xs font-semibold text-stone-700">
                  Detailed Creative Brief (Scenes, Mood, References)
                </label>
                <textarea
                  id="design-brief"
                  rows={4}
                  required
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe each scene or component, visual metaphors, typography constraints, and audience tone..."
                  className="mt-1.5 w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-950 placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="design-client-name" className="block text-xs font-semibold text-stone-700">
                    Your Full Name
                  </label>
                  <input
                    id="design-client-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Omar Farooq"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="design-client-email" className="block text-xs font-semibold text-stone-700">
                    Business Email
                  </label>
                  <input
                    id="design-client-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="omar@studio.com"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Live Quote Summary Column */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-stone-950">
                Commission Summary
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Transparent studio pricing updated live as you configure.
              </p>

              <dl className="mt-5 space-y-2.5 border-t border-stone-100 pt-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-stone-600">Deliverable</dt>
                  <dd className="font-semibold text-stone-950">{config.assetType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">Art Direction</dt>
                  <dd className="font-semibold text-stone-950">{config.artStyle}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">Formats</dt>
                  <dd className="font-mono text-stone-900">{config.formats.join(', ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">Base Studio Fee</dt>
                  <dd className="font-mono tabular-nums text-stone-950">${quote.basePrice}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">
                    Additional Assets ({Math.max(0, config.assetCount - 1)}x)
                  </dt>
                  <dd className="font-mono tabular-nums text-stone-950">${quote.quantityCost}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">Extra Revisions</dt>
                  <dd className="font-mono tabular-nums text-stone-950">${quote.revisionCost}</dd>
                </div>
                {quote.expressFee > 0 && (
                  <div className="flex justify-between text-[#E85D22]">
                    <dt>Express Delivery (+35%)</dt>
                    <dd className="font-mono tabular-nums">+${quote.expressFee}</dd>
                  </div>
                )}
                {quote.licenseFee > 0 && (
                  <div className="flex justify-between text-stone-800">
                    <dt>Exclusive IP Buyout (+40%)</dt>
                    <dd className="font-mono tabular-nums">+${quote.licenseFee}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 border-t border-stone-200 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-stone-900">Estimated Total</span>
                  <span
                    data-testid="design-quote-total"
                    className="font-mono text-2xl font-bold text-stone-950 tabular-nums"
                  >
                    ${quote.totalPrice.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Estimated first draft &amp; delivery:{' '}
                  <span className="font-mono font-medium text-stone-800 tabular-nums">
                    {quote.estimatedDays} business days
                  </span>
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#E85D22] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#cf4e18] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Submitting Order...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Submit Design Order</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </form>
      )}
    </div>
  );
}
