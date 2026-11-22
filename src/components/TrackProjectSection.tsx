import { CheckCircle2, KeyRound, Loader2, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { InquiryRecord } from '../types/store';

interface TrackProjectSectionProps {
  initialKey?: string;
}

const MILESTONES = [
  'Requirements Locked',
  'UI/UX Prototype',
  'Core Build & Offline Sync',
  'Testing & QA',
  'Final Delivery',
];

const SAMPLE_KEYS = ['MT-KEY-4820-M9X2', 'MT-KEY-7194-AS4K', 'MT-KEY-3091-EL8P'];

export function TrackProjectSection({ initialKey = '' }: TrackProjectSectionProps) {
  const [keyInput, setKeyInput] = useState(initialKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<InquiryRecord | null>(null);

  const performLookup = async (keyToFind: string) => {
    const trimmed = keyToFind.trim();
    if (!trimmed) {
      setError('Please enter your Mashal Tech Tracking Key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/track/${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Key not found.');
      }
      setRecord(data.record);
    } catch (err: unknown) {
      setRecord(null);
      setError(err instanceof Error ? err.message : 'Unable to locate tracking key.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialKey) {
      setKeyInput(initialKey);
      performLookup(initialKey);
    }
  }, [initialKey]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    performLookup(keyInput);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="border-b border-stone-200 pb-6">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          Client Progress Portal · Real-Time Milestone Verification
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          Track Your Software or Service Key
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Enter the unique Tracking Key assigned when you placed your custom app, assignment, or template order to see exact completion percentage, milestone progress, and payment verification.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-stone-200 bg-white p-6"
      >
        <label htmlFor="tracking-key-input" className="block text-xs font-semibold text-stone-700">
          Enter Tracking Key or Reference Code
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="tracking-key-input"
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g., MT-KEY-4820-M9X2"
              className="h-11 w-full rounded-lg border border-stone-300 pl-10 pr-4 font-mono text-sm uppercase text-stone-950 placeholder:normal-case placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#E85D22] px-6 text-sm font-semibold text-white hover:bg-[#cf4e18] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Check Progress</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>Try sample keys:</span>
          {SAMPLE_KEYS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setKeyInput(sample);
                performLookup(sample);
              }}
              className="rounded border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[11px] font-medium text-stone-700 hover:border-stone-400 hover:text-stone-950"
            >
              {sample}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}
      </form>

      {record && (
        <section className="mt-6 space-y-6 rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="font-mono font-semibold text-[#E85D22]">
                  {record.trackingKey || record.referenceCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{record.source}</span>
                <span aria-hidden="true">·</span>
                <span>{record.companyName || record.customerName}</span>
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-stone-950">
                {record.subject}
              </h2>
              <p className="mt-1 text-xs text-stone-600">
                Client: <strong>{record.customerName}</strong>
                {record.country ? ` (${record.country})` : ''}
              </p>
            </div>

            <div className="text-right">
              <span className="block text-xs text-stone-500">Development Completion</span>
              <span
                data-testid="track-progress-percent"
                className="font-mono text-3xl font-bold text-stone-950 tabular-nums"
              >
                {record.progressPercent}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-900">
                Current Stage: {record.milestoneStage}
              </span>
              <span className="font-mono text-stone-500 tabular-nums">
                {record.progressPercent} / 100%
              </span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-[#E85D22] transition-all duration-300"
                style={{ width: `${record.progressPercent}%` }}
              />
            </div>

            {/* Milestone Stepper */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {MILESTONES.map((stage, idx) => {
                const threshold = (idx + 1) * 20;
                const reached = record.progressPercent >= threshold - 10;
                return (
                  <div
                    key={stage}
                    className={`rounded-lg border p-2.5 text-xs ${
                      reached
                        ? 'border-[#0284C7] bg-sky-50/50 text-stone-950'
                        : 'border-stone-200 bg-stone-50 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px]">0{idx + 1}</span>
                      {reached && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
                      )}
                    </div>
                    <span className="mt-1 block font-medium leading-snug">{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Developer Note & Payment Summary */}
          <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
            <div className="rounded-lg bg-stone-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Latest Engineering Update
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-800">
                {record.developerNote || 'Your project is queued with Mashal Tech engineering.'}
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 text-xs">
              <h3 className="font-semibold uppercase tracking-wider text-stone-500">
                Payment &amp; Billing Status
              </h3>
              <dl className="mt-2.5 space-y-1.5">
                <div className="flex justify-between">
                  <dt className="text-stone-600">Status</dt>
                  <dd className="font-semibold text-emerald-700">
                    {record.paymentStatus || 'Pending Verification'}
                  </dd>
                </div>
                {record.paymentMethod && (
                  <div className="flex justify-between">
                    <dt className="text-stone-600">Method</dt>
                    <dd className="font-medium text-stone-900">{record.paymentMethod}</dd>
                  </div>
                )}
                {typeof record.quotedAmount === 'number' && (
                  <div className="flex justify-between">
                    <dt className="text-stone-600">Deal Value</dt>
                    <dd className="font-mono font-semibold text-stone-950 tabular-nums">
                      ${record.quotedAmount.toLocaleString()}
                    </dd>
                  </div>
                )}
                {typeof record.amountPaid === 'number' && (
                  <div className="flex justify-between">
                    <dt className="text-stone-600">Amount Submitted</dt>
                    <dd className="font-mono font-semibold text-stone-950 tabular-nums">
                      ${record.amountPaid.toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Reply History */}
          {record.replies.length > 0 && (
            <div className="space-y-2 border-t border-stone-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Developer Messages
              </h3>
              {record.replies.map((rep) => (
                <div key={rep.id} className="rounded-lg bg-stone-50 p-3 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <strong className="text-stone-900">{rep.author}</strong>
                    <span className="font-mono">{new Date(rep.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-800">{rep.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
