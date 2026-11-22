import { Check, Copy, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { formatPkrEstimate } from '../utils/storeLogic';
import type { PaymentMethod } from '../types/store';

interface EasypaisaBoxProps {
  paymentMethod: PaymentMethod;
  amountUsd: number;
  easypaisaNumber: string;
  easypaisaAccountName: string;
  usdToPkrRate: number;
  senderAccount: string;
  onSenderAccountChange: (val: string) => void;
  compact?: boolean;
}

export function EasypaisaBox({
  paymentMethod,
  amountUsd,
  easypaisaNumber,
  easypaisaAccountName,
  usdToPkrRate,
  senderAccount,
  onSenderAccountChange,
  compact = false,
}: EasypaisaBoxProps) {
  const [copied, setCopied] = useState(false);
  const pkrAmount = formatPkrEstimate(amountUsd, usdToPkrRate);
  const isWallet = paymentMethod === 'Easypaisa' || paymentMethod === 'JazzCash';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(easypaisaNumber).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (!isWallet) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs leading-relaxed text-stone-700">
        <p className="font-semibold text-stone-950">Mashal Tech Payment Instructions</p>
        <p className="mt-1">
          Send{' '}
          <strong className="font-mono text-[#E85D22] tabular-nums">
            ${amountUsd.toLocaleString()}
          </strong>{' '}
          via <strong>{paymentMethod}</strong> and enter your transaction reference below to confirm your order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-emerald-950">
              Pay via {paymentMethod} (Direct Account)
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-800">
              Account Title: <strong>{easypaisaAccountName}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:border-emerald-500"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-700" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" aria-hidden="true" />
              <span>Copy #</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200/80 bg-white px-3 py-2">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-stone-500">
            {paymentMethod} Number
          </span>
          <span className="font-mono text-sm font-bold text-stone-950 tabular-nums">
            {easypaisaNumber}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wider text-stone-500">
            Amount to Send
          </span>
          <span className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
            PKR {pkrAmount.toLocaleString()}{' '}
            <span className="text-[11px] font-medium text-stone-500">(${amountUsd})</span>
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor={`sender-wallet-${compact ? 'bag' : 'form'}`}
          className="block text-[11px] font-semibold text-emerald-950"
        >
          Your {paymentMethod} Mobile # (Sender Account)
        </label>
        <input
          id={`sender-wallet-${compact ? 'bag' : 'form'}`}
          type="tel"
          value={senderAccount}
          onChange={(e) => onSenderAccountChange(e.target.value)}
          placeholder="03XX-XXXXXXX"
          className="mt-1 h-9 w-full rounded-lg border border-emerald-200 bg-white px-2.5 font-mono text-xs text-stone-950 focus:border-emerald-600 focus:outline-none"
        />
      </div>
    </div>
  );
}
