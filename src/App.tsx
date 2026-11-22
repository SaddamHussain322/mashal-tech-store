import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssignmentsSection } from './components/AssignmentsSection';
import { CartDrawer } from './components/CartDrawer';
import { CatalogSection } from './components/CatalogSection';
import { ContactSection } from './components/ContactSection';
import { JournalSection } from './components/JournalSection';
import { Navbar } from './components/Navbar';
import { OwnerDashboard } from './components/OwnerDashboard';
import { SoftwareAdvisor } from './components/SoftwareAdvisor';
import { TestimonialsSection } from './components/TestimonialsSection';
import { TrackProjectSection } from './components/TrackProjectSection';
import { SEED_APPS } from './data/catalog';
import {
  calculateCartTotals,
  formatDisplayHost,
  resolveActiveStoreOrigin,
} from './utils/storeLogic';
import type {
  AppPlatformFilter,
  AppView,
  CartItem,
  InquiryRecord,
  Product,
  StoreSettings,
  TestimonialRecord,
  VisitorRecord,
} from './types/store';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Mashal Tech App Store',
  domain: 'mashaltech.eu.org',
  useCustomDomainForQr: false,
  announcementBanner:
    'Official Storefront · Direct PC (.EXE) & Android (.APK) Downloads · Easypaisa Accepted (0370-0818276)',
  contactEmail: '6saddamhussain9@gmail.com',
  easypaisaNumber: '0370-0818276',
  easypaisaAccountName: 'Saddam Hussain',
  location: 'Mardan & Peshawar, PK',
  usdToPkrRate: 278,
  adminPin: '',
  maintenanceMode: false,
};

function getOrCreateVisitorKey(): string {
  if (typeof window === 'undefined') return 'anon-ssr';
  const existing = window.localStorage.getItem('mashal_visitor_key');
  if (existing) return existing;
  const fresh = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem('mashal_visitor_key', fresh);
  return fresh;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('store');
  const [platformFilter, setPlatformFilter] = useState<AppPlatformFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTrackKey, setActiveTrackKey] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [deepLinkedAppId, setDeepLinkedAppId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('app');
  });

  const [visitorKey] = useState<string>(() => getOrCreateVisitorKey());
  const [visitorName, setVisitorName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Guest';
    return window.localStorage.getItem('mashal_visitor_name') || 'Guest';
  });

  const [apps, setApps] = useState<Product[]>(SEED_APPS);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([]);
  const [visitorSummary, setVisitorSummary] = useState<{
    totalVisits: number;
    uniqueVisitors: number;
    namedClients: number;
    mobileCount?: number;
  }>({ totalVisits: 0, uniqueVisitors: 0, namedClients: 0, mobileCount: 0 });
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  const refreshVisitors = useCallback(() => {
    fetch('/api/visits')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.visitors)) setVisitors(data.visitors);
        if (data.summary) setVisitorSummary(data.summary);
      })
      .catch(() => {});
  }, []);

  const recordVisit = useCallback(
    (nameOverride?: string, viewLabel = 'Apps', actionLabel = 'Visited Storefront', increment = false) => {
      fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorKey,
          visitorName: nameOverride ?? visitorName,
          lastView: viewLabel,
          lastAction: actionLabel,
          incrementVisit: increment,
        }),
      })
        .then((res) => res.json())
        .then(() => {
          refreshVisitors();
        })
        .catch(() => {});
    },
    [visitorKey, visitorName, refreshVisitors]
  );

  useEffect(() => {
    let active = true;

    fetch('/api/apps')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.apps) && data.apps.length > 0) {
          setApps(data.apps);
        }
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => {});

    fetch('/api/inquiries')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.inquiries)) {
          setInquiries(data.inquiries);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingInquiries(false);
      });

    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials);
        }
      })
      .catch(() => {});

    recordVisit(undefined, 'Apps', 'Opened Storefront', true);

    return () => {
      active = false;
    };
    // Run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveVisitorName = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setVisitorName(clean);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mashal_visitor_name', clean);
    }
    recordVisit(clean, activeView, `Checked in as ${clean}`, false);
  };

  const cartTotals = useMemo(() => calculateCartTotals(cartItems), [cartItems]);

  const activeStoreOrigin = useMemo(
    () =>
      resolveActiveStoreOrigin({
        domain: settings.domain,
        useCustomDomainForQr: settings.useCustomDomainForQr,
        browserOrigin: typeof window !== 'undefined' ? window.location.origin : '',
      }),
    [settings.domain, settings.useCustomDomainForQr]
  );

  const activeHostLabel = useMemo(
    () =>
      formatDisplayHost(
        typeof window !== 'undefined' ? window.location.host : '',
        settings.domain,
        settings.useCustomDomainForQr
      ),
    [settings.domain, settings.useCustomDomainForQr]
  );

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleInquiryCreated = (record: InquiryRecord) => {
    setInquiries((prev) => [record, ...prev]);
    refreshVisitors();
  };

  const handleInquiryUpdated = (updated: InquiryRecord) => {
    setInquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleInquiryDeleted = (id: string) => {
    setInquiries((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAppPublished = (newApp: Product) => {
    setApps((prev) => [newApp, ...prev]);
  };

  const handleAppUpdated = (updatedApp: Product) => {
    setApps((prev) => prev.map((item) => (item.id === updatedApp.id ? updatedApp : item)));
  };

  const handleAppDeleted = (appId: string) => {
    setApps((prev) => prev.filter((item) => item.id !== appId));
  };

  const handleTestimonialCreated = (created: TestimonialRecord) => {
    setTestimonials((prev) => [created, ...prev]);
    refreshVisitors();
  };

  const handleTestimonialDeleted = (id: string) => {
    setTestimonials((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAppDownloaded = (appId: string) => {
    const appObj = apps.find((a) => a.id === appId);
    setApps((prev) =>
      prev.map((item) =>
        item.id === appId ? { ...item, downloads: (item.downloads || 0) + 1 } : item
      )
    );
    if (appObj) {
      recordVisit(undefined, 'Apps', `Downloaded ${appObj.name}`, false);
    }
  };

  const navigateAndScroll = (view: AppView) => {
    setActiveView(view);
    if (view === 'dashboard') {
      refreshVisitors();
    } else {
      recordVisit(undefined, view, `Viewed ${view}`, false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackKeyNavigation = (key: string) => {
    setActiveTrackKey(key);
    navigateAndScroll('track');
  };

  const handleClearVisitors = async () => {
    const res = await fetch('/api/visits', { method: 'DELETE' });
    if (res.ok) {
      setVisitors([]);
      setVisitorSummary({ totalVisits: 0, uniqueVisitors: 0, namedClients: 0, mobileCount: 0 });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-stone-950">
      <Navbar
        activeView={activeView}
        storeName={settings.storeName}
        domain={activeHostLabel}
        visitorName={visitorName}
        onSaveVisitorName={handleSaveVisitorName}
        onSelectView={navigateAndScroll}
        onSelectPlatform={setPlatformFilter}
        cartCount={cartTotals.itemCount}
        onOpenCart={() => setCartOpen(true)}
      />

      {settings.maintenanceMode && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-950">
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
            Store Maintenance Notice: Mashal Tech is updating installers on {activeHostLabel}. Downloads and Easypaisa orders remain available via WhatsApp ({settings.easypaisaNumber}).
          </span>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'store' && (
          <>
            <CatalogSection
              apps={apps}
              settings={settings}
              activeStoreOrigin={activeStoreOrigin}
              displayHostLabel={activeHostLabel}
              deepLinkedAppId={deepLinkedAppId}
              onClearDeepLink={() => setDeepLinkedAppId(null)}
              platformFilter={platformFilter}
              searchQuery={searchQuery}
              onPlatformChange={setPlatformFilter}
              onSearchChange={setSearchQuery}
              onAddToCart={handleAddToCart}
              onAppDownloaded={handleAppDownloaded}
              onNavigateView={navigateAndScroll}
            />
            <TestimonialsSection
              testimonials={testimonials}
              apps={apps}
              visitorKey={visitorKey}
              onTestimonialCreated={handleTestimonialCreated}
              onClientIdentified={handleSaveVisitorName}
            />
          </>
        )}
        {activeView === 'order-app' && (
          <SoftwareAdvisor
            settings={settings}
            visitorKey={visitorKey}
            onClientIdentified={handleSaveVisitorName}
            onNavigateView={navigateAndScroll}
            onInquiryCreated={handleInquiryCreated}
            onTrackKey={handleTrackKeyNavigation}
          />
        )}
        {activeView === 'assignments' && (
          <AssignmentsSection
            settings={settings}
            visitorKey={visitorKey}
            onClientIdentified={handleSaveVisitorName}
            onOrderCreated={handleInquiryCreated}
            onTrackKey={handleTrackKeyNavigation}
            onNavigateView={navigateAndScroll}
          />
        )}
        {activeView === 'track' && <TrackProjectSection initialKey={activeTrackKey} />}
        {activeView === 'journal' && <JournalSection />}
        {activeView === 'contact' && (
          <ContactSection
            visitorKey={visitorKey}
            onClientIdentified={handleSaveVisitorName}
            onInquiryCreated={handleInquiryCreated}
          />
        )}
        {activeView === 'dashboard' && (
          <OwnerDashboard
            apps={apps}
            inquiries={inquiries}
            visitors={visitors}
            testimonials={testimonials}
            visitorSummary={visitorSummary}
            settings={settings}
            activeStoreOrigin={activeStoreOrigin}
            displayHostLabel={activeHostLabel}
            loading={loadingInquiries}
            onInquiryUpdated={handleInquiryUpdated}
            onInquiryDeleted={handleInquiryDeleted}
            onAppPublished={handleAppPublished}
            onAppUpdated={handleAppUpdated}
            onAppDeleted={handleAppDeleted}
            onTestimonialDeleted={handleTestimonialDeleted}
            onSettingsUpdated={setSettings}
            onRefreshVisitors={refreshVisitors}
            onClearVisitors={handleClearVisitors}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Mashal_Tech_45a4d83b.png"
              alt="Mashal Tech mark"
              referrerPolicy="no-referrer"
              className="h-7 w-7 object-contain"
            />
            <div>
              <p className="font-display text-sm font-bold text-stone-950">
                {settings.storeName} · <span className="font-mono text-xs">{activeHostLabel}</span>
              </p>
              <p className="text-xs text-stone-500">
                {settings.location} · {settings.contactEmail} · Easypaisa / WhatsApp{' '}
                {settings.easypaisaNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600">
            <button type="button" onClick={() => navigateAndScroll('store')} className="hover:text-stone-950">
              Apps
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('store');
                window.setTimeout(() => {
                  document.getElementById('client-testimonials')?.scrollIntoView({ behavior: 'smooth' });
                }, 60);
              }}
              className="hover:text-stone-950"
            >
              Testimonials
            </button>
            <button type="button" onClick={() => navigateAndScroll('order-app')} className="hover:text-stone-950">
              Order App
            </button>
            <button type="button" onClick={() => navigateAndScroll('assignments')} className="hover:text-stone-950">
              Services
            </button>
            <button type="button" onClick={() => navigateAndScroll('track')} className="hover:text-stone-950">
              Track Key
            </button>
            <button type="button" onClick={() => navigateAndScroll('journal')} className="hover:text-stone-950">
              Journal
            </button>
            <button type="button" onClick={() => navigateAndScroll('contact')} className="hover:text-stone-950">
              Contact
            </button>
            <button type="button" onClick={() => navigateAndScroll('dashboard')} className="hover:text-stone-950">
              Admin
            </button>
          </div>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        settings={settings}
        visitorKey={visitorKey}
        onClientIdentified={handleSaveVisitorName}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        onOrderPlaced={handleInquiryCreated}
        onTrackKey={handleTrackKeyNavigation}
      />
    </div>
  );
}
