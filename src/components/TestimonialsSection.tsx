import { CheckCircle2, MessageSquarePlus, Quote, Star, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { calculateTestimonialStats, validateTestimonialSubmission } from '../utils/storeLogic';
import type { Product, TestimonialRecord } from '../types/store';

interface TestimonialsSectionProps {
  testimonials: TestimonialRecord[];
  apps: Product[];
  visitorKey: string;
  onTestimonialCreated: (created: TestimonialRecord) => void;
  onClientIdentified?: (name: string) => void;
}

export function TestimonialsSection({
  testimonials,
  apps,
  visitorKey,
  onTestimonialCreated,
  onClientIdentified,
}: TestimonialsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [companyOrRole, setCompanyOrRole] = useState('');
  const [country, setCountry] = useState('');
  const [projectOrApp, setProjectOrApp] = useState('Custom App Development');
  const [rating, setRating] = useState<number>(5);
  const [quote, setQuote] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const stats = useMemo(() => calculateTestimonialStats(testimonials), [testimonials]);

  const appOptions = useMemo(() => {
    const names = apps.map((a) => a.name);
    return Array.from(
      new Set([
        ...names,
        'Custom App Development',
        'Excel / MS Word Templates',
        'PDF & Graphic Design Services',
      ])
    );
  }, [apps]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessNotice(null);

    const validation = validateTestimonialSubmission({
      clientName,
      projectOrApp,
      rating,
      quote,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          companyOrRole: companyOrRole.trim(),
          country: country.trim(),
          projectOrApp: projectOrApp.trim(),
          rating,
          quote: quote.trim(),
          visitorKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) setFieldErrors(data.errors);
        throw new Error(data.error || 'Could not publish testimonial.');
      }

      onTestimonialCreated(data.testimonial);
      onClientIdentified?.(clientName.trim());
      setClientName('');
      setCompanyOrRole('');
      setCountry('');
      setQuote('');
      setRating(5);
      setFormOpen(false);
      setSuccessNotice('Thank you! Your client testimonial is now live on the Mashal Tech storefront.');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="client-testimonials"
      aria-labelledby="testimonials-heading"
      className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs sm:p-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {stats.averageRating.toFixed(1)} / 5.0
              </span>
              <span className="text-stone-300">·</span>
              <span className="font-mono text-stone-500">
                {stats.count} Verified {stats.count === 1 ? 'Client Review' : 'Client Reviews'}
              </span>
            </div>
            <h2
              id="testimonials-heading"
              className="mt-1.5 font-display text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl"
            >
              Client Testimonials
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              Real feedback from businesses, shop owners, and teams using Mashal Tech PC setups, Android APKs, and custom software.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormOpen((prev) => !prev);
              setSuccessNotice(null);
            }}
            aria-expanded={formOpen}
            className="inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E85D22]"
          >
            {formOpen ? (
              <>
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Close Review Form</span>
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                <span>Share Your Feedback</span>
              </>
            )}
          </button>
        </div>

        {successNotice && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Interactive Past-Customer Feedback Submission Form */}
        {formOpen && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F7] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-stone-950">
                  Leave a Client Testimonial
                </h3>
                <p className="text-xs text-stone-500">
                  Used an app or commissioned custom software from Saddam Hussain? Share your experience below.
                </p>
              </div>
              <div className="flex items-center gap-1" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    aria-label={`Rate ${starValue} out of 5 stars`}
                    aria-pressed={rating === starValue}
                    className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#E85D22]"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        starValue <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="test-name" className="block text-xs font-semibold text-stone-700">
                  Your Name *
                </label>
                <input
                  id="test-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Kamran Ahmed"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs text-stone-950 focus:border-[#009FE3] focus:outline-none"
                />
                {fieldErrors.clientName && (
                  <p className="mt-1 text-[11px] text-red-600">{fieldErrors.clientName}</p>
                )}
              </div>

              <div>
                <label htmlFor="test-role" className="block text-xs font-semibold text-stone-700">
                  Company / Role
                </label>
                <input
                  id="test-role"
                  type="text"
                  value={companyOrRole}
                  onChange={(e) => setCompanyOrRole(e.target.value)}
                  placeholder="e.g., Store Owner"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs text-stone-950 focus:border-[#009FE3] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="test-country" className="block text-xs font-semibold text-stone-700">
                  City / Country
                </label>
                <input
                  id="test-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., Peshawar, PK"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs text-stone-950 focus:border-[#009FE3] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="test-app" className="block text-xs font-semibold text-stone-700">
                  App or Service Used *
                </label>
                <select
                  id="test-app"
                  value={projectOrApp}
                  onChange={(e) => setProjectOrApp(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-950 focus:border-[#009FE3] focus:outline-none"
                >
                  {appOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldErrors.projectOrApp && (
                  <p className="mt-1 text-[11px] text-red-600">{fieldErrors.projectOrApp}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="test-quote" className="block text-xs font-semibold text-stone-700">
                Your Feedback *
              </label>
              <textarea
                id="test-quote"
                rows={3}
                required
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Tell visitors how the software, templates, or customer support helped your business..."
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-3 text-xs text-stone-950 focus:border-[#009FE3] focus:outline-none"
              />
              {fieldErrors.quote && (
                <p className="mt-1 text-[11px] text-red-600">{fieldErrors.quote}</p>
              )}
            </div>

            {submitError && <p className="text-xs font-medium text-red-600">{submitError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[40px] rounded-lg bg-[#E85D22] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#cf4e18] disabled:opacity-60"
              >
                {submitting ? 'Publishing...' : 'Publish Review'}
              </button>
            </div>
          </form>
        )}

        {/* Testimonial Cards Grid */}
        {testimonials.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-500">
            No client reviews yet. Be the first customer to share your feedback!
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.id}
                data-testid="testimonial-card"
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-[#FAF9F7] p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${
                            idx < item.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <Quote className="h-4 w-4 text-stone-300" aria-hidden="true" />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-stone-700 sm:text-[13px]">
                    “{item.quote}”
                  </p>
                </div>

                <div className="mt-4 border-t border-stone-200/80 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-sm font-bold text-stone-950">
                      {item.clientName}
                    </p>
                    {item.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {item.companyOrRole}
                    {item.country ? ` · ${item.country}` : ''}
                  </p>
                  <p className="mt-1.5 truncate font-mono text-[10px] font-medium text-[#0284C7]">
                    {item.projectOrApp}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
