import { CheckCircle2, FileSpreadsheet, KeyRound, Loader2, Send } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { SERVICE_PACKAGES } from '../data/services';
import { calculateProjectPayment } from '../utils/storeLogic';
import { EasypaisaBox } from './EasypaisaBox';
import type {
  AppView,
  InquiryRecord,
  PaymentMethod,
  ServicePackage,
  StoreSettings,
} from '../types/store';

interface AssignmentsSectionProps {
  settings: StoreSettings;
  visitorKey: string;
  onClientIdentified?: (name: string) => void;
  onOrderCreated: (order: InquiryRecord) => void;
  onTrackKey: (key: string) => void;
  onNavigateView: (view: AppView) => void;
}

const CATEGORIES: Array<'All' | ServicePackage['category']> = [
  'All',
  'Assignments',
  'Excel Templates',
  'MS Word Templates',
  'PDF Services',
  'Graphic Design',
  'Suggested Services',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Easypaisa',
  'JazzCash',
  'Bank Transfer / IBAN',
  'Credit / Debit Card',
  'Payoneer / Wise',
];

export function AssignmentsSection({
  settings,
  visitorKey,
  onClientIdentified,
  onOrderCreated,
  onTrackKey,
}: AssignmentsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ServicePackage['category']>('All');
  const [chosenService, setChosenService] = useState<ServicePackage>(SERVICE_PACKAGES[0]);

  const [serviceTitle, setServiceTitle] = useState('');
  const [deadline, setDeadline] = useState('48 Hours');
  const [details, setDetails] = useState('');
  const [quotedAmount, setQuotedAmount] = useState(SERVICE_PACKAGES[0].startingPrice);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [country, setCountry] = useState('');

  const [paymentPlan, setPaymentPlan] = useState<'40% Deposit' | '100% Full Payment'>('100% Full Payment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Easypaisa');
  const [senderAccount, setSenderAccount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<InquiryRecord | null>(null);

  const visiblePackages = useMemo(() => {
    if (selectedCategory === 'All') return SERVICE_PACKAGES;
    return SERVICE_PACKAGES.filter((pkg) => pkg.category === selectedCategory);
  }, [selectedCategory]);

  const paymentSummary = useMemo(
    () => calculateProjectPayment(quotedAmount, paymentPlan),
    [quotedAmount, paymentPlan]
  );

  const handleSelectPackage = (pkg: ServicePackage) => {
    setChosenService(pkg);
    setQuotedAmount(pkg.startingPrice);
    setServiceTitle(pkg.title);
    const formEl = document.getElementById('assignment-order-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/orders/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          mobileNumber: whatsappNumber,
          whatsappNumber,
          country,
          serviceCategory: chosenService.category,
          serviceTitle: serviceTitle || chosenService.title,
          deadline,
          details,
          quotedAmount,
          paymentPlan,
          paymentMethod,
          paymentReference,
          senderAccount,
          visitorKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not submit assignment order.');
      }

      setConfirmedOrder(data.order);
      onOrderCreated(data.order);
      if (customerName.trim()) {
        onClientIdentified?.(customerName.trim());
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Order failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="border-b border-stone-200 pb-6">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          For Assignments &amp; Digital Services · Excel · MS Word · PDF · Graphic Design
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          Assignments, Office Templates &amp; Creative Services
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">
          Beyond custom software, Mashal Tech delivers fast coding &amp; academic assignments, automated Excel workbooks, executive MS Word templates, PDF conversion/forms, graphic design, and suggested business optimization packages.
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-stone-950 text-white'
                    : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-950'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visiblePackages.map((pkg) => {
          const isSelected = chosenService.id === pkg.id;
          return (
            <article
              key={pkg.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                isSelected ? 'border-[#E85D22] bg-orange-50/30' : 'border-stone-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold text-[#0284C7]">{pkg.category}</span>
                  <span className="font-mono">{pkg.deliveryWindow}</span>
                </div>
                <h2 className="mt-2 font-display text-lg font-bold text-stone-950">{pkg.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">{pkg.description}</p>
                <ul className="mt-4 space-y-1 text-xs text-stone-700">
                  {pkg.deliverables.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#E85D22]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                <div>
                  <span className="block text-[11px] text-stone-500">Starting at</span>
                  <span className="font-mono text-lg font-bold text-stone-950 tabular-nums">
                    ${pkg.startingPrice}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className={`min-h-[38px] rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#E85D22] text-white'
                      : 'bg-stone-950 text-white hover:bg-[#E85D22]'
                  }`}
                >
                  {isSelected ? 'Selected Below' : 'Order Service'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Assignment / Service Checkout & Key Assignment Form */}
      <section id="assignment-order-form" className="mt-12 border-t border-stone-200 pt-10">
        {confirmedOrder ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-emerald-950">
                  Service Order Confirmed · Tracking Key Issued
                </h2>
                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2.5 font-mono text-base font-bold text-stone-950">
                  <KeyRound className="h-4 w-4 text-[#E85D22]" aria-hidden="true" />
                  <span>{confirmedOrder.trackingKey}</span>
                </div>
                <p className="max-w-2xl text-sm text-emerald-900">
                  Save this Tracking Key! You can check your assignment or template completion percentage anytime on the <strong>Track Key</strong> tab.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onTrackKey(confirmedOrder.trackingKey || '')}
                    className="rounded-lg bg-stone-950 px-4 py-2 text-xs font-semibold text-white hover:bg-[#E85D22]"
                  >
                    Track Progress Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmedOrder(null)}
                    className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-900"
                  >
                    Place Another Service Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-8">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
                <FileSpreadsheet className="h-5 w-5 text-[#E85D22]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-xl font-bold text-stone-950">
                    Submit Assignment or Template Order
                  </h2>
                  <p className="text-xs text-stone-500">
                    Selected Service: <strong className="text-stone-900">{chosenService.title}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="srv-title" className="block text-xs font-semibold text-stone-700">
                    Task / Template Title
                  </label>
                  <input
                    id="srv-title"
                    type="text"
                    required
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    placeholder="e.g., Retail Shop Excel Payroll + PDF Payslip"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="srv-deadline" className="block text-xs font-semibold text-stone-700">
                    Required Deadline
                  </label>
                  <select
                    id="srv-deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#0284C7] focus:outline-none"
                  >
                    <option>Urgent (12 – 24 Hours)</option>
                    <option>48 Hours</option>
                    <option>3 – 5 Days</option>
                    <option>1 Week</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="srv-details" className="block text-xs font-semibold text-stone-700">
                  Full Instructions, File Requirements &amp; Formatting Notes
                </label>
                <textarea
                  id="srv-details"
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe columns/formulas needed in Excel, assignment rubric, PDF pages to edit, or design dimensions..."
                  className="mt-1.5 w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="srv-name" className="block text-xs font-semibold text-stone-700">
                    Full Name
                  </label>
                  <input
                    id="srv-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Zainab Fatima"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="srv-email" className="block text-xs font-semibold text-stone-700">
                    Email Address
                  </label>
                  <input
                    id="srv-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="zainab@email.com"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="srv-wa" className="block text-xs font-semibold text-stone-700">
                    WhatsApp Number
                  </label>
                  <input
                    id="srv-wa"
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="srv-country" className="block text-xs font-semibold text-stone-700">
                    Country
                  </label>
                  <input
                    id="srv-country"
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Pakistan / UAE / UK"
                    className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Column */}
            <aside className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-4">
              <h3 className="font-display text-lg font-bold text-stone-950">
                Payment &amp; Tracking Key
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Pay securely to lock your delivery slot and receive your live tracking key.
              </p>

              <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                <div>
                  <label htmlFor="srv-budget" className="block text-xs font-semibold text-stone-700">
                    Agreed Package Budget ($)
                  </label>
                  <input
                    id="srv-budget"
                    type="number"
                    min={10}
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(Math.max(10, Number(e.target.value)))}
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-sm tabular-nums text-stone-950"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-stone-700">Payment Schedule</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('40% Deposit')}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                        paymentPlan === '40% Deposit'
                          ? 'border-stone-950 bg-stone-950 text-white'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      40% Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('100% Full Payment')}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                        paymentPlan === '100% Full Payment'
                          ? 'border-[#E85D22] bg-[#E85D22] text-white'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      100% (Save 5%)
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="srv-pay-method" className="block text-xs font-semibold text-stone-700">
                    Payment Method
                  </label>
                  <select
                    id="srv-pay-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs font-medium text-stone-900"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
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
                  <label htmlFor="srv-pay-ref" className="block text-xs font-semibold text-stone-700">
                    Transaction / Receipt Reference
                  </label>
                  <input
                    id="srv-pay-ref"
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g., TID-992014 or Card Auth"
                    className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                  />
                </div>
              </div>

              <div className="mt-5 border-t border-stone-200 pt-4 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Due Now</span>
                  <span className="font-mono text-lg font-bold text-stone-950 tabular-nums">
                    ${paymentSummary.dueNow}
                  </span>
                </div>
                {paymentSummary.remainingBalance > 0 && (
                  <p className="mt-1 text-[11px] text-stone-500">
                    Remaining ${paymentSummary.remainingBalance} due upon final delivery.
                  </p>
                )}
              </div>

              {error && (
                <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#E85D22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf4e18] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Generating Key...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Confirm &amp; Get Tracking Key</span>
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
