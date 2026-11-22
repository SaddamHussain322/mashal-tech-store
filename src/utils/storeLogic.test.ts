import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_APPS } from '../data/catalog';
import {
  buildAppShareUrl,
  calculateCartTotals,
  calculateDesignQuote,
  calculateProjectPayment,
  calculateTestimonialStats,
  filterAndSortProducts,
  formatDisplayHost,
  formatPkrEstimate,
  generateTrackingKey,
  isInternalPreviewHost,
  resolveActiveStoreOrigin,
  validateClientOrderDetails,
  validateContactSubmission,
  validateTestimonialSubmission,
} from './storeLogic';
import { FilterState, TestimonialRecord } from '../types/store';

const baseFilters: FilterState = {
  query: '',
  platform: 'All',
  category: 'All',
  priceBracket: 'all',
  minPrice: null,
  maxPrice: null,
  minRating: 0,
  sortBy: 'featured',
};

test('filterAndSortProducts filters by platform (PC/Mobile/Templates), query, and rating', () => {
  const pcApps = filterAndSortProducts(SEED_APPS, {
    ...baseFilters,
    platform: 'PC',
    minRating: 4.5,
  });
  assert.ok(pcApps.length >= 3);
  assert.ok(pcApps.every((app) => app.platform === 'PC' && app.rating >= 4.5));

  const mobilePos = filterAndSortProducts(SEED_APPS, {
    ...baseFilters,
    platform: 'Mobile',
    query: 'apk',
  });
  assert.ok(mobilePos.length >= 2);
  assert.ok(mobilePos.every((app) => app.platform === 'Mobile'));

  const freeApps = filterAndSortProducts(SEED_APPS, {
    ...baseFilters,
    priceBracket: 'free',
  });
  assert.ok(freeApps.length >= 3);
  assert.ok(freeApps.every((app) => app.price === 0));
});

test('generateTrackingKey produces valid MT-KEY format and calculateProjectPayment computes deposit vs full payment', () => {
  const key = generateTrackingKey(4821);
  assert.match(key, /^MT-KEY-4821-[A-Z0-9]{4}$/);

  const depositPlan = calculateProjectPayment(1000, '40% Deposit');
  assert.equal(depositPlan.dueNow, 400);
  assert.equal(depositPlan.remainingBalance, 600);
  assert.equal(depositPlan.discount, 0);

  const fullPlan = calculateProjectPayment(1000, '100% Full Payment');
  assert.equal(fullPlan.discount, 50);
  assert.equal(fullPlan.finalTotal, 950);
  assert.equal(fullPlan.dueNow, 950);
  assert.equal(fullPlan.remainingBalance, 0);
});

test('validateClientOrderDetails enforces full client intake fields', () => {
  const missing = validateClientOrderDetails({
    customerName: 'A',
    customerEmail: 'bad',
    contactNumber: '',
    mobileNumber: '123',
    whatsappNumber: '',
    country: '',
    companyName: '',
  });
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.customerName);
  assert.ok(missing.errors.customerEmail);
  assert.ok(missing.errors.mobileNumber);
  assert.ok(missing.errors.whatsappNumber);
  assert.ok(missing.errors.country);
  assert.ok(missing.errors.companyName);

  const ok = validateClientOrderDetails({
    customerName: 'Bilal Ahmed',
    customerEmail: 'bilal@apexretail.pk',
    contactNumber: '+923001234567',
    mobileNumber: '+923001234567',
    whatsappNumber: '+923001234567',
    country: 'Pakistan',
    companyName: 'Apex Retail',
  });
  assert.equal(ok.valid, true);
});

test('calculateDesignQuote and calculateCartTotals compute deterministic prices', () => {
  const quote = calculateDesignQuote({
    assetType: 'Brand Illustration Pack',
    artStyle: 'Minimalist Vector',
    assetCount: 4,
    revisions: 2,
    formats: ['SVG', 'Figma'],
    turnaround: 'standard',
    license: 'standard',
    primaryColor: '#E85D22',
    secondaryColor: '#009FE3',
  });
  assert.equal(quote.totalPrice, 315);

  const erpApp = SEED_APPS.find((a) => a.price === 149)!;
  const clinicApp = SEED_APPS.find((a) => a.price === 195)!;
  const bundle = calculateCartTotals([
    { product: erpApp, quantity: 1 },
    { product: clinicApp, quantity: 1 },
  ]);
  // 149 + 195 = 344; 5% discount at >=300 = 17 -> 327
  assert.equal(bundle.subtotal, 344);
  assert.equal(bundle.enterpriseDiscount, 17);
  assert.equal(bundle.total, 327);
});

test('validateContactSubmission enforces field rules and rejects honeypot spam', () => {
  const spam = validateContactSubmission({
    name: 'Bot',
    email: 'bot@example.com',
    subject: 'Spam offer',
    message: 'Click this link right now please',
    websiteHoneypot: 'http://spam.example',
  });
  assert.equal(spam.valid, false);
  assert.equal(spam.isSpam, true);
});

test('formatPkrEstimate and buildAppShareUrl handle Easypaisa PKR math and mashaltech.eu.org QR links', () => {
  assert.equal(formatPkrEstimate(10, 278), 2780);
  assert.equal(formatPkrEstimate(0, 278), 0);
  assert.equal(
    buildAppShareUrl('app-m-cloud-setup', 'mashaltech.eu.org/'),
    'https://mashaltech.eu.org/?app=app-m-cloud-setup'
  );
  assert.equal(
    buildAppShareUrl('app custom', 'https://mashaltech.eu.org'),
    'https://mashaltech.eu.org/?app=app%20custom'
  );
});

test('resolveActiveStoreOrigin prefers live browserOrigin until custom domain is verified live', () => {
  assert.equal(
    resolveActiveStoreOrigin({
      domain: 'mashaltech.eu.org',
      useCustomDomainForQr: false,
      browserOrigin: 'https://mashal-tech-store.vercel.app/',
    }),
    'https://mashal-tech-store.vercel.app'
  );
  assert.equal(
    resolveActiveStoreOrigin({
      domain: 'mashaltech.eu.org',
      useCustomDomainForQr: true,
      browserOrigin: 'https://mashal-tech-store.vercel.app',
    }),
    'https://mashaltech.eu.org'
  );
});

test('formatDisplayHost hides ais-dev run.app and localhost preview URLs cleanly', () => {
  assert.equal(
    isInternalPreviewHost('https://ais-dev-xyvayzf2ymqrzuu2bre2xv-620372527250.asia-east1.run.app'),
    true
  );
  assert.equal(
    formatDisplayHost(
      'https://ais-dev-xyvayzf2ymqrzuu2bre2xv-620372527250.asia-east1.run.app',
      'mashaltech.eu.org',
      false
    ),
    'Official App Store'
  );
  assert.equal(
    formatDisplayHost('https://mashal-tech-store.vercel.app', 'mashaltech.eu.org', false),
    'mashal-tech-store.vercel.app'
  );
  assert.equal(
    formatDisplayHost(
      'https://ais-dev-xyvayzf2ymqrzuu2bre2xv-620372527250.asia-east1.run.app',
      'mashaltech.eu.org',
      true
    ),
    'mashaltech.eu.org'
  );
});

test('validateTestimonialSubmission and calculateTestimonialStats enforce fields and compute average rating', () => {
  const invalid = validateTestimonialSubmission({
    clientName: 'A',
    projectOrApp: '',
    rating: 5,
    quote: 'Too short',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.clientName);
  assert.ok(invalid.errors.projectOrApp);
  assert.ok(invalid.errors.quote);

  const valid = validateTestimonialSubmission({
    clientName: 'Kamran Khan',
    projectOrApp: 'M-Cloud Setup v1.0.0',
    rating: 5,
    quote: 'Fast offline backup and great customer support via WhatsApp.',
  });
  assert.equal(valid.valid, true);

  const sample: TestimonialRecord[] = [
    {
      id: 't1',
      clientName: 'Tariq',
      companyOrRole: 'Owner',
      country: 'Pakistan',
      projectOrApp: 'POS App',
      rating: 5,
      quote: 'Great software.',
      verifiedPurchase: true,
      createdAt: '2026-11-16T00:00:00.000Z',
    },
    {
      id: 't2',
      clientName: 'Hina',
      companyOrRole: 'Manager',
      country: 'UAE',
      projectOrApp: 'Excel Pack',
      rating: 4,
      quote: 'Very reliable sheets.',
      verifiedPurchase: true,
      createdAt: '2026-11-16T00:00:00.000Z',
    },
  ];
  const stats = calculateTestimonialStats(sample);
  assert.equal(stats.count, 2);
  assert.equal(stats.averageRating, 4.5);
});
