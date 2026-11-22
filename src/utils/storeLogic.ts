import {
  CartItem,
  ClientContactDetails,
  DesignOrderConfig,
  DesignQuoteBreakdown,
  FilterState,
  PaymentMethod,
  Product,
  TestimonialRecord,
} from '../types/store';

export function matchesPriceBracket(price: number, bracket: FilterState['priceBracket']): boolean {
  switch (bracket) {
    case 'free':
      return price === 0;
    case 'under-100':
      return price > 0 && price < 100;
    case '100-500':
      return price >= 100 && price <= 500;
    case 'over-500':
      return price > 500;
    case 'all':
    default:
      return true;
  }
}

export function filterAndSortProducts(products: Product[], filters: FilterState): Product[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filters.platform !== 'All' && product.platform !== filters.platform) {
      return false;
    }

    if (filters.category !== 'All' && product.category !== filters.category) {
      return false;
    }

    if (!matchesPriceBracket(product.price, filters.priceBracket)) {
      return false;
    }

    if (filters.minPrice !== null && product.price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== null && product.price > filters.maxPrice) {
      return false;
    }

    if (product.rating < filters.minRating) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const searchable = [
        product.name,
        product.sku,
        product.platform,
        product.osLabel,
        product.category,
        product.shortDesc,
        product.fullDesc,
        ...product.specs,
        ...product.tags,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price || b.rating - a.rating);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price || b.rating - a.rating);
      break;
    case 'rating-desc':
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        const featDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featDelta !== 0) return featDelta;
        return b.rating - a.rating;
      });
      break;
  }

  return sorted;
}

export function generateTrackingKey(seedDigits?: number): string {
  const num = seedDigits ?? Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MT-KEY-${num}-${suffix}`;
}

export function calculateProjectPayment(
  quotedAmount: number,
  plan: '40% Deposit' | '100% Full Payment'
): {
  quotedAmount: number;
  discount: number;
  finalTotal: number;
  dueNow: number;
  remainingBalance: number;
} {
  const safeQuote = Math.max(0, Math.round(quotedAmount));
  if (plan === '100% Full Payment') {
    const discount = Math.round(safeQuote * 0.05);
    const finalTotal = Math.max(0, safeQuote - discount);
    return {
      quotedAmount: safeQuote,
      discount,
      finalTotal,
      dueNow: finalTotal,
      remainingBalance: 0,
    };
  }
  const dueNow = Math.round(safeQuote * 0.4);
  return {
    quotedAmount: safeQuote,
    discount: 0,
    finalTotal: safeQuote,
    dueNow,
    remainingBalance: Math.max(0, safeQuote - dueNow),
  };
}

export function validateClientOrderDetails(
  details: ClientContactDetails & {
    paymentMethod?: PaymentMethod;
    paymentReference?: string;
  }
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (details.customerName.trim().length < 2) {
    errors.customerName = 'Full name is required.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.customerEmail.trim())) {
    errors.customerEmail = 'Valid email address is required.';
  }
  if (details.mobileNumber.trim().length < 7) {
    errors.mobileNumber = 'Mobile number is required (min 7 digits).';
  }
  if (details.whatsappNumber.trim().length < 7) {
    errors.whatsappNumber = 'WhatsApp number is required for fast project updates.';
  }
  if (details.country.trim().length < 2) {
    errors.country = 'Please specify your country.';
  }
  if (details.companyName.trim().length < 2) {
    errors.companyName = 'Company or organization name is required (or "Personal").';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

const ASSET_BASE_PRICES: Record<DesignOrderConfig['assetType'], number> = {
  'Brand Illustration Pack': 180,
  'UI/UX Design System': 420,
  'Product 3D Render': 320,
  'Logo & Identity Suite': 260,
  'Motion Graphics Kit': 360,
};

const ASSET_PER_ITEM_PRICES: Record<DesignOrderConfig['assetType'], number> = {
  'Brand Illustration Pack': 45,
  'UI/UX Design System': 35,
  'Product 3D Render': 75,
  'Logo & Identity Suite': 60,
  'Motion Graphics Kit': 85,
};

export function calculateDesignQuote(config: DesignOrderConfig): DesignQuoteBreakdown {
  const safeCount = Math.max(1, Math.min(50, Math.round(config.assetCount)));
  const safeRevisions = Math.max(1, Math.min(10, Math.round(config.revisions)));

  const basePrice = ASSET_BASE_PRICES[config.assetType];
  const perItem = ASSET_PER_ITEM_PRICES[config.assetType];
  const quantityCost = Math.max(0, safeCount - 1) * perItem;
  const extraRevisions = Math.max(0, safeRevisions - 2);
  const revisionCost = extraRevisions * 35;

  const subtotalBeforeModifiers = basePrice + quantityCost + revisionCost;
  const expressFee = config.turnaround === 'express' ? Math.round(subtotalBeforeModifiers * 0.35) : 0;
  const licenseFee = config.license === 'exclusive' ? Math.round(subtotalBeforeModifiers * 0.4) : 0;
  const totalPrice = subtotalBeforeModifiers + expressFee + licenseFee;

  const baseDays = Math.min(14, 4 + Math.ceil(safeCount / 3));
  const estimatedDays = config.turnaround === 'express' ? Math.max(2, Math.ceil(baseDays / 2)) : baseDays;

  return {
    basePrice,
    quantityCost,
    revisionCost,
    expressFee,
    licenseFee,
    totalPrice,
    estimatedDays,
  };
}

export function calculateCartTotals(items: CartItem[]): {
  itemCount: number;
  subtotal: number;
  enterpriseDiscount: number;
  total: number;
} {
  const itemCount = items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * Math.max(0, item.quantity), 0);
  const enterpriseDiscount = subtotal >= 300 ? Math.round(subtotal * 0.05) : 0;
  const total = Math.max(0, subtotal - enterpriseDiscount);

  return {
    itemCount,
    subtotal,
    enterpriseDiscount,
    total,
  };
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  isSpam: boolean;
}

export function validateContactSubmission(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  websiteHoneypot?: string;
}): ContactValidationResult {
  const errors: Record<string, string> = {};

  if (payload.websiteHoneypot && payload.websiteHoneypot.trim().length > 0) {
    return {
      valid: false,
      errors: { form: 'Automated submission rejected.' },
      isSpam: true,
    };
  }

  if (payload.name.trim().length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(payload.email.trim())) {
    errors.email = 'Please provide a valid business or personal email address.';
  }

  if (payload.subject.trim().length < 4) {
    errors.subject = 'Please provide a concise subject (at least 4 characters).';
  }

  if (payload.message.trim().length < 15) {
    errors.message = 'Please describe your inquiry in at least 15 characters so we can assist accurately.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    isSpam: false,
  };
}

export function formatPkrEstimate(amountUsd: number, usdToPkrRate = 278): number {
  const safeUsd = Math.max(0, Number(amountUsd) || 0);
  const safeRate = Math.max(1, Number(usdToPkrRate) || 278);
  return Math.round(safeUsd * safeRate);
}

export function buildAppShareUrl(appId: string, domainOrOrigin = 'https://mashaltech.eu.org'): string {
  const cleanedBase = domainOrOrigin.trim().replace(/\/+$/, '') || 'https://mashaltech.eu.org';
  const baseWithProtocol = /^https?:\/\//i.test(cleanedBase)
    ? cleanedBase
    : `https://${cleanedBase}`;
  return `${baseWithProtocol}/?app=${encodeURIComponent(appId)}`;
}

export function resolveActiveStoreOrigin(options: {
  domain: string;
  useCustomDomainForQr?: boolean;
  browserOrigin?: string;
}): string {
  const cleanDomain = (options.domain || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (options.useCustomDomainForQr && cleanDomain) {
    return `https://${cleanDomain}`;
  }
  const cleanOrigin = (options.browserOrigin || '').trim().replace(/\/+$/, '');
  if (cleanOrigin) {
    return cleanOrigin;
  }
  return cleanDomain ? `https://${cleanDomain}` : 'https://mashaltech.eu.org';
}

export function isInternalPreviewHost(originOrHost: string): boolean {
  const host = originOrHost
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
  return (
    host === '' ||
    host.includes('.run.app') ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1')
  );
}

export function formatDisplayHost(
  originOrHost: string,
  domain: string,
  useCustomDomainForQr?: boolean
): string {
  const cleanDomain = (domain || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (useCustomDomainForQr && cleanDomain) {
    return cleanDomain;
  }
  const cleanHost = (originOrHost || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
  if (isInternalPreviewHost(cleanHost)) {
    return 'Official App Store';
  }
  return cleanHost;
}

export function validateTestimonialSubmission(payload: {
  clientName: string;
  projectOrApp: string;
  rating: number;
  quote: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (payload.clientName.trim().length < 2) {
    errors.clientName = 'Please enter your name (at least 2 characters).';
  }
  if (payload.projectOrApp.trim().length < 2) {
    errors.projectOrApp = 'Please select or enter the app or service you used.';
  }
  const safeRating = Number(payload.rating);
  if (Number.isNaN(safeRating) || safeRating < 1 || safeRating > 5) {
    errors.rating = 'Please select a star rating between 1 and 5.';
  }
  if (payload.quote.trim().length < 12) {
    errors.quote = 'Please share at least 12 characters of feedback.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateTestimonialStats(testimonials: TestimonialRecord[]): {
  count: number;
  averageRating: number;
} {
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    return { count: 0, averageRating: 5.0 };
  }
  const total = testimonials.reduce(
    (sum, item) => sum + Math.max(1, Math.min(5, Number(item.rating) || 5)),
    0
  );
  return {
    count: testimonials.length,
    averageRating: Math.round((total / testimonials.length) * 10) / 10,
  };
}

