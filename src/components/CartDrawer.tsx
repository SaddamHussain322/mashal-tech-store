import { CheckCircle2, KeyRound, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { calculateCartTotals } from '../utils/storeLogic';
import { EasypaisaBox } from './EasypaisaBox';
import type { CartItem, InquiryRecord, PaymentMethod, StoreSettings } from '../types/store';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  settings: StoreSettings;
  visitorKey: string;
  onClientIdentified?: (name: string) => void;
  onClose: () => void;
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: InquiryRecord) => void;
  onTrackKey: (key: string) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Easypaisa',
  'JazzCash',
  'Bank Transfer / IBAN',
  'Credit / Debit Card',
  'Payoneer / Wise',
];

export function CartDrawer({
  open,
  items,
  settings,
  visitorKey,
  onClientIdentified,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  onTrackKey,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [country, setCountry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Easypaisa');
  const [senderAccount, setSenderAccount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<InquiryRecord | null>(null);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  if (!open) return null;

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          whatsappNumber,
          country,
          paymentMethod,
          paymentReference,
          senderAccount,
          visitorKey,
          items: items.map((i) => ({
            id: i.product.id,
            sku: i.product.sku,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
          total: totals.total,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout failed.');

      setConfirmedOrder(data.order);
      onOrderPlaced(data.order);
      if (customerName.trim()) {
        onClientIdentified?.(customerName.trim());
      }
      onClearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="App Store Bag"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-stone-800" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-stone-950">
              Your App Bag <span className="font-mono tabular-nums">({totals.itemCount})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-stone-950"
            aria-label="Close app bag"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {confirmedOrder ? (
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-lg font-bold text-emerald-950">
                    License Order Confirmed · {confirmedOrder.referenceCode}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-emerald-900">
                    Your license order is active. Track license delivery &amp; download status anytime using your Tracking Key:
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 font-mono text-sm font-bold text-stone-950">
                    <KeyRound className="h-4 w-4 text-[#E85D22]" aria-hidden="true" />
                    <span>{confirmedOrder.trackingKey}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const k = confirmedOrder.trackingKey || '';
                  setConfirmedOrder(null);
                  onClose();
                  onTrackKey(k);
                }}
                className="w-full rounded-lg bg-stone-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#E85D22]"
              >
                Track Order Key Now
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="mb-3 h-8 w-8 text-stone-300" aria-hidden="true" />
              <p className="font-display text-base font-semibold text-stone-900">Your bag is empty</p>
              <p className="mt-1 text-xs text-stone-500">
                Add PC software licenses, Android APKs, or Office template packs from the App Store.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 border-b border-stone-100 pb-4"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-20 shrink-0 rounded-lg bg-stone-100 object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold text-stone-950">
                          {item.product.name}
                        </h3>
                        <span className="font-mono text-[11px] text-stone-500">
                          {item.product.platform} · {item.product.fileFormat}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-stone-400 hover:text-red-600"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-stone-200">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-stone-600 hover:bg-stone-100"
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 font-mono text-xs tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-stone-600 hover:bg-stone-100"
                          aria-label={`Increase quantity for ${item.product.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono text-xs font-semibold text-stone-950 tabular-nums">
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Client License &amp; Payment Details
                </h3>
                <div>
                  <label htmlFor="cart-name" className="block text-xs font-medium text-stone-700">
                    Full Name *
                  </label>
                  <input
                    id="cart-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Hassan Ali"
                    className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cart-email" className="block text-xs font-medium text-stone-700">
                    License Delivery Email *
                  </label>
                  <input
                    id="cart-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="hassan@studio.com"
                    className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="cart-wa" className="block text-xs font-medium text-stone-700">
                      WhatsApp #
                    </label>
                    <input
                      id="cart-wa"
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+92 300 ..."
                      className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-2.5 text-xs text-stone-950"
                    />
                  </div>
                  <div>
                    <label htmlFor="cart-country" className="block text-xs font-medium text-stone-700">
                      Country
                    </label>
                    <input
                      id="cart-country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Pakistan / UAE"
                      className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-2.5 text-xs text-stone-950"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cart-pay-method" className="block text-xs font-medium text-stone-700">
                    Payment Method
                  </label>
                  <select
                    id="cart-pay-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-900"
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
                  amountUsd={totals.total}
                  easypaisaNumber={settings.easypaisaNumber}
                  easypaisaAccountName={settings.easypaisaAccountName}
                  usdToPkrRate={settings.usdToPkrRate}
                  senderAccount={senderAccount}
                  onSenderAccountChange={setSenderAccount}
                  compact
                />
                <div>
                  <label htmlFor="cart-pay-ref" className="block text-xs font-medium text-stone-700">
                    Transaction Reference (TID / Receipt Code)
                  </label>
                  <input
                    id="cart-pay-ref"
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g., Easypaisa TID-55019 or Card Auth"
                    className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                  />
                </div>
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              </form>
            </div>
          )}
        </div>

        {items.length > 0 && !confirmedOrder && (
          <div className="border-t border-stone-200 bg-stone-50 px-6 py-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">${totals.subtotal.toLocaleString()}</span>
              </div>
              {totals.enterpriseDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Bundle Savings (5%)</span>
                  <span className="font-mono tabular-nums">
                    -${totals.enterpriseDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-950">
                <span>Total</span>
                <span className="font-mono tabular-nums">${totals.total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#E85D22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf4e18] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Completing Purchase...</span>
                </>
              ) : (
                <span>Pay &amp; Generate License Key</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
