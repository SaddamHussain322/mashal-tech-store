import { Check, Menu, ShoppingBag, User, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { AppPlatformFilter, AppView } from '../types/store';

interface NavbarProps {
  activeView: AppView;
  storeName: string;
  domain: string;
  visitorName: string;
  onSaveVisitorName: (name: string) => void;
  onSelectView: (view: AppView) => void;
  onSelectPlatform: (platform: AppPlatformFilter) => void;
  cartCount: number;
  onOpenCart: () => void;
}

const PRIMARY_TABS: Array<{ id: AppView; label: string }> = [
  { id: 'store', label: 'Apps' },
  { id: 'order-app', label: 'Order App' },
  { id: 'assignments', label: 'Services' },
  { id: 'track', label: 'Track Key' },
  { id: 'dashboard', label: 'Admin' },
];

export function Navbar({
  activeView,
  storeName,
  domain,
  visitorName,
  onSaveVisitorName,
  onSelectView,
  onSelectPlatform,
  cartCount,
  onOpenCart,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [namePopoverOpen, setNamePopoverOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(visitorName === 'Guest' ? '' : visitorName);

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    onSaveVisitorName(trimmed);
    setNamePopoverOpen(false);
  };

  const hasCustomName = Boolean(visitorName && visitorName !== 'Guest');

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            onSelectPlatform('All');
            onSelectView('store');
            setMobileMenuOpen(false);
          }}
          className="flex shrink-0 items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E85D22]"
          aria-label={`${storeName} Home`}
        >
          <img
            src="/assets/aistudio/Mashal_Tech_45a4d83b.png"
            alt="Mashal Tech mark"
            referrerPolicy="no-referrer"
            className="h-7 w-7 shrink-0 object-contain"
          />
          <div className="leading-tight">
            <span className="block font-display text-base font-bold tracking-tight text-stone-950">
              Mashal Tech
            </span>
            <span className="hidden font-mono text-[10px] font-medium text-stone-500 sm:block">
              {domain}
            </span>
          </div>
        </button>

        {/* Clean Minimalist 5-Link Center Navigation */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {PRIMARY_TABS.map((tab) => {
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onSelectView(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-stone-950 text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Visitor Identity + Bag + Mobile Trigger */}
        <div className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNameDraft(visitorName === 'Guest' ? '' : visitorName);
              setNamePopoverOpen((prev) => !prev);
            }}
            aria-expanded={namePopoverOpen}
            aria-label={hasCustomName ? `Visitor name ${visitorName}` : 'Set your visitor name'}
            className={`hidden sm:inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              hasCustomName
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400 hover:text-stone-950'
            }`}
          >
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="max-w-[120px] truncate">
              {hasCustomName ? `Hi, ${visitorName}` : 'Set Name'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-stone-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E85D22] whitespace-nowrap shrink-0"
            aria-label={`Open shopping bag with ${cartCount} items`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Bag</span>
            <span className="font-mono tabular-nums">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-800 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Desktop Visitor Name Capture Popover */}
          {namePopoverOpen && (
            <div
              role="dialog"
              aria-label="Enter your name for Mashal Tech store visits"
              className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-stone-200 bg-white p-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xs font-bold text-stone-950">
                  Client Check-In (Optional)
                </p>
                <button
                  type="button"
                  onClick={() => setNamePopoverOpen(false)}
                  className="rounded p-1 text-stone-400 hover:text-stone-800"
                  aria-label="Close name prompt"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                Let Saddam Hussain know who is visiting {domain} for faster support.
              </p>
              <form onSubmit={handleNameSubmit} className="mt-3 flex gap-2">
                <label htmlFor="visitor-name-input" className="sr-only">
                  Your Name
                </label>
                <input
                  id="visitor-name-input"
                  type="text"
                  required
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Enter your name..."
                  className="h-9 min-w-0 flex-1 rounded-lg border border-stone-300 px-2.5 text-xs text-stone-950 focus:border-[#009FE3] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-[#009FE3] px-3 text-xs font-semibold text-white hover:bg-[#0284C7]"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {[
              ...PRIMARY_TABS,
              { id: 'journal' as AppView, label: 'Journal & Updates' },
              { id: 'contact' as AppView, label: 'Contact Developer' },
            ].map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 text-left text-sm font-medium ${
                    isActive
                      ? 'bg-stone-950 text-white'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-xs text-[#E85D22]">Active</span>}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleNameSubmit} className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
            <label htmlFor="mobile-visitor-name" className="sr-only">
              Your Name
            </label>
            <input
              id="mobile-visitor-name"
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your name (optional check-in)"
              className="h-10 min-w-0 flex-1 rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-lg bg-[#009FE3] px-3.5 text-xs font-semibold text-white"
            >
              Check In
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
