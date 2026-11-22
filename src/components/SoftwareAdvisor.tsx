import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Layers,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { calculateProjectPayment } from '../utils/storeLogic';
import { EasypaisaBox } from './EasypaisaBox';
import type {
  AppView,
  InquiryRecord,
  PaymentMethod,
  SoftwareBlueprintSuggestion,
  StoreSettings,
} from '../types/store';

interface SoftwareAdvisorProps {
  settings: StoreSettings;
  visitorKey: string;
  onClientIdentified?: (name: string) => void;
  onNavigateView: (view: AppView) => void;
  onInquiryCreated: (inquiry: InquiryRecord) => void;
  onTrackKey: (key: string) => void;
}

const TARGET_PLATFORMS = [
  'Windows PC App (.EXE)',
  'Android Mobile App (.APK)',
  'Hybrid PC + Mobile Suite',
  'Custom Web Platform',
];

const DEPLOYMENT_MODES: Array<SoftwareBlueprintSuggestion['recommendedMode']> = [
  'Hybrid Online + Offline',
  'Offline Local',
  'Online Cloud',
  'Web Platform',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Easypaisa',
  'JazzCash',
  'Bank Transfer / IBAN',
  'Credit / Debit Card',
  'Payoneer / Wise',
];

const SAMPLE_IDEAS = [
  {
    title: 'Multi-Branch POS & Inventory (PC + Mobile)',
    platform: 'Hybrid PC + Mobile Suite',
    mode: 'Hybrid Online + Offline' as const,
    purpose:
      'I run 3 hardware shops and need fast barcode billing on Windows PCs plus daily profit reports on my Android phone even when shop Wi-Fi disconnects.',
    specs: 'Barcode scanner billing, thermal receipt printing, staff permissions, low-stock alerts, cloud sync.',
    limitations: 'Shop counter PCs have 4GB RAM on Windows 10 and unstable internet in the afternoon.',
  },
  {
    title: 'Clinic & Pharmacy Offline Billing App',
    platform: 'Windows PC App (.EXE)',
    mode: 'Offline Local' as const,
    purpose:
      'Need a desktop clinic patient queue, prescription printer, and pharmacy batch expiry tracker that runs completely offline with encrypted USB backup.',
    specs: 'Patient history search, medicine expiry alerts, daily cash closing sheet, PDF prescription export.',
    limitations: 'Must work 100% offline with zero monthly cloud fees and simple Urdu/English operator workflow.',
  },
  {
    title: 'Delivery Fleet & Client Order Web Portal',
    platform: 'Custom Web Platform',
    mode: 'Web Platform' as const,
    purpose:
      'Wholesale food distributor needing a web portal where retail buyers place bulk orders and drivers mark delivery completion from mobile.',
    specs: 'Client login, bulk price tiers, invoice PDF generator, WhatsApp status alerts.',
    limitations: 'Must load fast on 3G mobile data across low-end Android phones.',
  },
];

export function SoftwareAdvisor({
  settings,
  visitorKey,
  onClientIdentified,
  onNavigateView,
  onInquiryCreated,
  onTrackKey,
}: SoftwareAdvisorProps) {
  const [appTitle, setAppTitle] = useState('');
  const [targetPlatform, setTargetPlatform] = useState(TARGET_PLATFORMS[0]);
  const [deploymentMode, setDeploymentMode] =
    useState<SoftwareBlueprintSuggestion['recommendedMode']>('Hybrid Online + Offline');
  const [purpose, setPurpose] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [limitations, setLimitations] = useState('');
  const [budgetPreference, setBudgetPreference] = useState('Best ROI Value');

  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SoftwareBlueprintSuggestion | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Client Intake Details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [country, setCountry] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Payment Configuration
  const [quotedAmount, setQuotedAmount] = useState(450);
  const [paymentPlan, setPaymentPlan] = useState<'40% Deposit' | '100% Full Payment'>('40% Deposit');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Easypaisa');
  const [senderAccount, setSenderAccount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<InquiryRecord | null>(null);

  const paymentSummary = useMemo(
    () => calculateProjectPayment(quotedAmount, paymentPlan),
    [quotedAmount, paymentPlan]
  );

  const toggleModule = (moduleName: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleName) ? prev.filter((item) => item !== moduleName) : [...prev, moduleName]
    );
  };

  const applySampleIdea = (sample: (typeof SAMPLE_IDEAS)[number]) => {
    setAppTitle(sample.title);
    setTargetPlatform(sample.platform);
    setDeploymentMode(sample.mode);
    setPurpose(sample.purpose);
    setSpecifications(sample.specs);
    setLimitations(sample.limitations);
  };

  const handleGenerateSuggestions = async (e: FormEvent) => {
    e.preventDefault();
    setAiError(null);

    if (purpose.trim().length < 8) {
      setAiError('Please explain what kind of app you want and its purpose (min 8 characters).');
      return;
    }

    setLoadingAi(true);
    try {
      const response = await fetch('/api/ai/software-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose,
          specifications,
          limitations,
          deploymentMode,
          targetPlatform,
          budgetPreference,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI suggestions.');
      }

      const blueprint = data.suggestion as SoftwareBlueprintSuggestion;
      setSuggestion(blueprint);
      setSelectedModules(blueprint.coreModules.map((m) => m.name));
      if (!appTitle.trim() && blueprint.projectTitle) {
        setAppTitle(blueprint.projectTitle);
      }
      if (typeof blueprint.estimatedPriceUsd === 'number' && blueprint.estimatedPriceUsd > 0) {
        setQuotedAmount(Math.round(blueprint.estimatedPriceUsd));
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AI advisor.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handlePlaceCustomOrder = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmittingOrder(true);

    try {
      const response = await fetch('/api/orders/custom-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          contactNumber: contactNumber || mobileNumber,
          mobileNumber,
          whatsappNumber,
          country,
          companyName,
          appTitle: appTitle || suggestion?.projectTitle || `${targetPlatform} Custom App`,
          targetPlatform,
          deploymentMode: suggestion?.recommendedMode || deploymentMode,
          purpose,
          specifications,
          limitations,
          quotedAmount,
          paymentPlan,
          paymentMethod,
          paymentReference,
          senderAccount,
          visitorKey,
          aiModules: selectedModules,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const firstFieldErr = data.errors ? Object.values(data.errors)[0] : null;
        throw new Error(String(firstFieldErr || data.error || 'Could not submit custom app order.'));
      }

      setConfirmedOrder(data.order);
      onInquiryCreated(data.order);
      if (customerName.trim()) {
        onClientIdentified?.(customerName.trim());
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Order submission failed.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-stone-200 pb-6">
        <button
          type="button"
          onClick={() => onNavigateView('store')}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to App Store</span>
        </button>
        <h1 className="font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          Order Custom Software &amp; AI Solutions Advisor
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-stone-600">
          Tell us what app you need (PC, Mobile, Website, Online or Offline), your exact specifications, and your constraints. Our AI solutions bot recommends the smartest architecture and deal value, then issues your live <strong>Tracking Key</strong> upon checkout.
        </p>
      </div>

      {/* Step 1: App Specification & AI Persuasive Advisor */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form
          onSubmit={handleGenerateSuggestions}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5"
        >
          <div className="border-b border-stone-100 pb-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#E85D22]">
              Step 01 · Explain Your App
            </span>
            <h2 className="mt-0.5 font-display text-lg font-bold text-stone-950">
              Specifications, Mode &amp; Constraints
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_IDEAS.map((sample, idx) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => applySampleIdea(sample)}
                className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:text-stone-950"
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="ord-app-title" className="block text-xs font-semibold text-stone-700">
              App Name / Project Title
            </label>
            <input
              id="ord-app-title"
              type="text"
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              placeholder="e.g., Al-Noor POS & Warehouse Sync"
              className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ord-platform" className="block text-xs font-semibold text-stone-700">
                App Type / Platform
              </label>
              <select
                id="ord-platform"
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-900 focus:border-[#0284C7] focus:outline-none"
              >
                {TARGET_PLATFORMS.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ord-mode" className="block text-xs font-semibold text-stone-700">
                Online / Offline Mode
              </label>
              <select
                id="ord-mode"
                value={deploymentMode}
                onChange={(e) =>
                  setDeploymentMode(e.target.value as SoftwareBlueprintSuggestion['recommendedMode'])
                }
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-900 focus:border-[#0284C7] focus:outline-none"
              >
                {DEPLOYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ord-purpose" className="block text-xs font-semibold text-stone-700">
              For what purpose do you need this app?
            </label>
            <textarea
              id="ord-purpose"
              rows={3}
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Explain what problem this software solves for your shop, clinic, school, or company..."
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-950 placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-specs" className="block text-xs font-semibold text-stone-700">
              Key Specifications &amp; Features Needed
            </label>
            <textarea
              id="ord-specs"
              rows={2}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="e.g., Barcode scan, PDF invoice print, multi-user login, WhatsApp receipts..."
              className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-950 placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-limits" className="block text-xs font-semibold text-stone-700">
              Limitations &amp; Constraints (Hardware, Internet, Budget)
            </label>
            <textarea
              id="ord-limits"
              rows={2}
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="e.g., Older 4GB RAM Windows PCs, slow internet, or zero monthly server cost..."
              className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-950 placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-budget-pref" className="block text-xs font-semibold text-stone-700">
              Investment Preference
            </label>
            <select
              id="ord-budget-pref"
              value={budgetPreference}
              onChange={(e) => setBudgetPreference(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-900"
            >
              <option>Best ROI Value</option>
              <option>Lean Startup MVP ($150–$400)</option>
              <option>Full Business Suite ($450–$1,200)</option>
              <option>Enterprise Multi-Branch ($1,200+)</option>
            </select>
          </div>

          {aiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {aiError}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingAi}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0369a1] disabled:opacity-60"
          >
            {loadingAi ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Analyzing Specs &amp; Deal Value...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Ask AI Advisor &amp; Build Deal Pitch</span>
              </>
            )}
          </button>
        </form>

        {/* AI Recommendation & ROI Pitch Panel */}
        <div className="lg:col-span-7">
          {!suggestion && !loadingAi && (
            <div className="flex h-full min-h-[380px] flex-col justify-center rounded-xl border border-stone-200 bg-white p-8">
              <Layers className="mb-3 h-9 w-9 text-[#E85D22]" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-stone-950">
                Smart AI Architecture &amp; ROI Breakdown
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
                Click <strong>Ask AI Advisor &amp; Build Deal Pitch</strong> to get an honest analysis of whether Online Cloud, Offline Local, or Hybrid works best for your limitations—plus selectable features, estimated build price, and timeline.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-stone-100 pt-5 text-xs text-stone-700 sm:grid-cols-3">
                <div className="rounded-lg bg-stone-50 p-3">
                  <strong className="block text-stone-950">Online vs Offline Clarity</strong>
                  <span className="mt-1 block text-stone-600">
                    Avoid paying for expensive servers if an offline-first SQLite app fits better.
                  </span>
                </div>
                <div className="rounded-lg bg-stone-50 p-3">
                  <strong className="block text-stone-950">40% Kickoff Deposit</strong>
                  <span className="mt-1 block text-stone-600">
                    Start development immediately or pay 100% upfront for a 5% instant discount.
                  </span>
                </div>
                <div className="rounded-lg bg-stone-50 p-3">
                  <strong className="block text-stone-950">Live Tracking Key</strong>
                  <span className="mt-1 block text-stone-600">
                    Every order receives an MT-KEY code to track exact completion percentage.
                  </span>
                </div>
              </div>
            </div>
          )}

          {loadingAi && (
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
              <div className="h-6 w-2/3 animate-pulse rounded bg-stone-200" />
              <div className="h-16 w-full animate-pulse rounded bg-orange-50" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-24 animate-pulse rounded-lg bg-stone-100" />
                <div className="h-24 animate-pulse rounded-lg bg-stone-100" />
              </div>
            </div>
          )}

          {suggestion && !loadingAi && (
            <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-[#0284C7]">{suggestion.recommendedMode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{suggestion.estimatedTimeline}</span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold text-stone-950">
                    {suggestion.projectTitle}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-stone-500">AI Deal Estimate</span>
                  <span className="font-mono text-2xl font-bold text-[#E85D22] tabular-nums">
                    ${suggestion.estimatedPriceUsd.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Persuasive Value & Deal Box */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E85D22]">
                  Why This Investment Pays Off
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-stone-950">
                  {suggestion.valueProposition}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-stone-700">
                  {suggestion.dealPitch}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-stone-600">
                {suggestion.architectureSummary}
              </p>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Recommended Modules (Click to Include or Exclude)
                </h3>
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {suggestion.coreModules.map((mod) => {
                    const included = selectedModules.includes(mod.name);
                    return (
                      <button
                        key={mod.name}
                        type="button"
                        onClick={() => toggleModule(mod.name)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          included
                            ? 'border-[#0284C7] bg-sky-50/40'
                            : 'border-stone-200 bg-stone-50 opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-950">{mod.name}</span>
                          <span className="font-mono text-[11px] text-[#0284C7]">
                            {included ? 'Included' : 'Excluded'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-stone-600">{mod.purpose}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-4 text-xs text-stone-700 sm:grid-cols-2">
                <div>
                  <span className="block font-semibold uppercase tracking-wider text-stone-500">
                    Recommended Tech Stack
                  </span>
                  <ul className="mt-1.5 space-y-1">
                    {suggestion.recommendedStack.map((tech) => (
                      <li key={tech}>· {tech}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="block font-semibold uppercase tracking-wider text-stone-500">
                    Roles &amp; Security
                  </span>
                  <ul className="mt-1.5 space-y-1">
                    {suggestion.userRoles.map((role) => (
                      <li key={role}>· Role: {role}</li>
                    ))}
                    {suggestion.securityNotes.slice(0, 2).map((note) => (
                      <li key={note}>· {note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Client Details Intake + Payment Checkout + Tracking Key Assignment */}
      <section className="mt-12 border-t border-stone-200 pt-10">
        {confirmedOrder ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-emerald-700" aria-hidden="true" />
              <div className="space-y-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Deal Confirmed · {confirmedOrder.referenceCode}
                </p>
                <h2 className="font-display text-2xl font-bold text-emerald-950">
                  Your Custom App Order Is Active &amp; Tracking Key Issued
                </h2>
                <div className="inline-flex items-center gap-2.5 rounded-lg border border-emerald-300 bg-white px-5 py-3 font-mono text-lg font-bold text-stone-950">
                  <KeyRound className="h-5 w-5 text-[#E85D22]" aria-hidden="true" />
                  <span data-testid="issued-tracking-key">{confirmedOrder.trackingKey}</span>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-emerald-900">
                  Keep this key safe. Use it anytime on the <strong>Track Key</strong> page to check how many percent your software is completed, read Mashal Tech developer updates, and verify payment clearance.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onTrackKey(confirmedOrder.trackingKey || '')}
                    className="min-h-[42px] rounded-lg bg-stone-950 px-5 py-2 text-xs font-semibold text-white hover:bg-[#E85D22]"
                  >
                    Track Progress Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmedOrder(null)}
                    className="min-h-[42px] rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-900"
                  >
                    Order Another Software
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePlaceCustomOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Client Full Contact Details */}
            <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7">
              <div className="border-b border-stone-100 pb-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#E85D22]">
                  Step 02 · Client Profile &amp; Contact Information
                </span>
                <h2 className="mt-0.5 font-display text-xl font-bold text-stone-950">
                  Finalize Client Details for Build &amp; Delivery
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cli-name" className="block text-xs font-semibold text-stone-700">
                    Full Name *
                  </label>
                  <input
                    id="cli-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Saddam Hussain"
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cli-email" className="block text-xs font-semibold text-stone-700">
                    Email Address *
                  </label>
                  <input
                    id="cli-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cli-contact" className="block text-xs font-semibold text-stone-700">
                    Contact / Office Number
                  </label>
                  <input
                    id="cli-contact"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+92 42 35710000"
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cli-mobile" className="block text-xs font-semibold text-stone-700">
                    Mobile Number *
                  </label>
                  <input
                    id="cli-mobile"
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+92 300 4129901"
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cli-wa" className="block text-xs font-semibold text-stone-700">
                    WhatsApp Number *
                  </label>
                  <input
                    id="cli-wa"
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+92 300 4129901"
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cli-country" className="block text-xs font-semibold text-stone-700">
                    Country *
                  </label>
                  <input
                    id="cli-country"
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Pakistan / UAE / Saudi Arabia / UK"
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cli-company" className="block text-xs font-semibold text-stone-700">
                  Company / Shop / Organization Name *
                </label>
                <input
                  id="cli-company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="NorthStar Electronics Pvt Ltd (or Personal)"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                />
              </div>
            </div>

            {/* Detailed Payment Checkout */}
            <aside className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0284C7]">
                    Step 03 · Payment &amp; Tracking Key
                  </span>
                  <h2 className="mt-0.5 font-display text-xl font-bold text-stone-950">
                    Lock Deal &amp; Start Build
                  </h2>
                </div>
                <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              </div>

              <div>
                <label htmlFor="ord-quote-usd" className="block text-xs font-semibold text-stone-700">
                  Agreed Project Quote (USD)
                </label>
                <input
                  id="ord-quote-usd"
                  type="number"
                  min={50}
                  value={quotedAmount}
                  onChange={(e) => setQuotedAmount(Math.max(50, Number(e.target.value)))}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-sm font-semibold tabular-nums text-stone-950"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-stone-700">Payment Schedule</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('40% Deposit')}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      paymentPlan === '40% Deposit'
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    40% Kickoff Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('100% Full Payment')}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      paymentPlan === '100% Full Payment'
                        ? 'border-[#E85D22] bg-[#E85D22] text-white'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    100% Upfront (Save 5%)
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="ord-pay-method" className="block text-xs font-semibold text-stone-700">
                  Payment Channel
                </label>
                <select
                  id="ord-pay-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs font-medium text-stone-900"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <EasypaisaBox
                paymentMethod={paymentMethod}
                amountUsd={paymentSummary.dueNow}
                easypaisaNumber={settings.easypaisaNumber}
                easypaisaAccountName={settings.easypaisaAccountName}
                usdToPkrRate={settings.usdToPkrRate}
                senderAccount={senderAccount}
                onSenderAccountChange={setSenderAccount}
              />

              <div>
                <label htmlFor="ord-pay-ref" className="block text-xs font-semibold text-stone-700">
                  Transaction Reference / Card Authorization Code
                </label>
                <input
                  id="ord-pay-ref"
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., IBAN-884120 or TID-55019"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>

              <div className="space-y-1 border-t border-stone-200 pt-3 text-xs">
                {paymentSummary.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Upfront 5% Discount</span>
                    <span className="font-mono tabular-nums">-${paymentSummary.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-stone-950">
                  <span>Due Now</span>
                  <span className="font-mono text-lg tabular-nums">
                    ${paymentSummary.dueNow.toLocaleString()}
                  </span>
                </div>
                {paymentSummary.remainingBalance > 0 && (
                  <p className="text-[11px] text-stone-500">
                    Remaining ${paymentSummary.remainingBalance.toLocaleString()} payable on final software handover.
                  </p>
                )}
              </div>

              {submitError && <p className="text-xs font-medium text-red-600">{submitError}</p>}

              <button
                type="submit"
                disabled={submittingOrder}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#E85D22] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#cf4e18] disabled:opacity-60"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Issuing Tracking Key...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Confirm Payment &amp; Get Tracking Key</span>
                  </>
                )}
              </button>
            </aside>
          </form>
        )}
      </section>
    </div>
  );
}
