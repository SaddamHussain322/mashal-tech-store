import { CheckCircle2, Loader2, Lock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { validateContactSubmission } from '../utils/storeLogic';
import type { InquiryRecord } from '../types/store';

interface ContactSectionProps {
  visitorKey?: string;
  onClientIdentified?: (name: string) => void;
  onInquiryCreated: (inquiry: InquiryRecord) => void;
}

export function ContactSection({
  visitorKey,
  onClientIdentified,
  onInquiryCreated,
}: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Custom Software');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<InquiryRecord | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateContactSubmission({
      name,
      email,
      subject,
      message,
      websiteHoneypot,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'Contact Form',
          customerName: name,
          customerEmail: email,
          category,
          subject,
          message,
          websiteHoneypot,
          visitorKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        throw new Error(data.error || 'Failed to send message.');
      }

      setSubmittedRecord(data.inquiry);
      onInquiryCreated(data.inquiry);
      if (name.trim()) {
        onClientIdentified?.(name.trim());
      }
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Unable to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Direct Developer Contact Column */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-500">
              Mashal Tech App Store · Direct Developer Contact
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
              Contact Mashal Tech Developers
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
              Need help installing M-Cloud Setup, Record Books Setup, or commissioning custom Windows, Android, or web software? Every inquiry logs directly to our Owner Desk with a tracking reference.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#E85D22]" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-stone-950">Email</h2>
                <p className="mt-0.5 font-mono text-xs text-stone-700">6saddamhussain9@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-4">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#009FE3]" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-stone-950">Phone / WhatsApp</h2>
                <p className="mt-0.5 font-mono text-xs font-semibold text-[#0284C7]">0370-0818276</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-600" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-stone-950">Location</h2>
                <p className="mt-0.5 text-xs text-stone-700">Mardan &amp; Peshawar, PK</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-stone-950">Validated Intake</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                  Submissions generate a live reference &amp; tracking code inside Owner Studio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7">
          {submittedRecord ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-2xl font-bold text-emerald-950">
                    Inquiry Received · {submittedRecord.referenceCode}
                  </h2>
                  <p className="mt-2 text-sm text-emerald-900">
                    Your message is live in Owner Studio. Use Tracking Key{' '}
                    <span className="font-mono font-semibold">{submittedRecord.trackingKey}</span> to check replies anytime.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedRecord(null)}
                    className="mt-5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 sm:p-8"
            >
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-website">Leave this blank</label>
                <input
                  id="contact-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={websiteHoneypot}
                  onChange={(e) => setWebsiteHoneypot(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-stone-700">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ayesha Siddiqui"
                    className="mt-1.5 h-11 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-stone-700">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayesha@enterprise.com"
                    className="mt-1.5 h-11 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-category" className="block text-xs font-semibold text-stone-700">
                    Inquiry Department
                  </label>
                  <select
                    id="contact-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#0284C7] focus:outline-none"
                  >
                    <option>Custom Software</option>
                    <option>PC Software Support (.EXE)</option>
                    <option>Mobile App (.APK)</option>
                    <option>Assignments &amp; Templates</option>
                    <option>Order Tracking &amp; Billing</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-semibold text-stone-700">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Need custom billing software for my shop"
                    className="mt-1.5 h-11 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                  {fieldErrors.subject && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-stone-700">
                  Message Details
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your software requirements, WhatsApp number, or questions..."
                  className="mt-1.5 w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-950 placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E85D22] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#cf4e18] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Sending Securely...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Send Secure Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
