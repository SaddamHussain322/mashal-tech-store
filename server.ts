import 'dotenv/config';
import express, { Request, Response } from 'express';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { SEED_APPS } from './src/data/catalog';
import {
  buildAppShareUrl,
  calculateDesignQuote,
  calculateProjectPayment,
  calculateTestimonialStats,
  generateTrackingKey,
  validateClientOrderDetails,
  validateContactSubmission,
  validateTestimonialSubmission,
} from './src/utils/storeLogic';
import type {
  DesignOrderConfig,
  InquiryRecord,
  InquiryStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  SoftwareBlueprintSuggestion,
  StoreSettings,
  TestimonialRecord,
  VisitorRecord,
} from './src/types/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'store-db.json');

interface StoreDatabase {
  apps: Product[];
  inquiries: InquiryRecord[];
  visitors: VisitorRecord[];
  testimonials: TestimonialRecord[];
  settings: StoreSettings;
}

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

const SEED_INQUIRIES: InquiryRecord[] = [
  {
    id: 'inq-2041',
    referenceCode: 'MT-APP-2041',
    trackingKey: 'MT-KEY-4820-M9X2',
    source: 'Custom App Order',
    customerName: 'Tariq Mahmood',
    customerEmail: 'tariq@northstarretail.pk',
    contactNumber: '+92 42 35718820',
    mobileNumber: '+92 300 4129901',
    whatsappNumber: '+92 300 4129901',
    country: 'Pakistan',
    companyName: 'NorthStar Retail Group',
    subject: 'Offline + Cloud Retail Billing Desktop & Android App',
    category: 'Hybrid PC + Mobile App',
    message:
      'Purpose: Manage 4 electronics stores with barcode checkout even when internet drops.\nLimitations: Existing PCs run 4GB RAM Windows 10.\nMode: Hybrid Online + Offline.',
    status: 'In Review',
    progressPercent: 65,
    milestoneStage: 'Core Build & Offline Sync',
    developerNote: 'SQLite offline ledger and thermal receipt printer driver completed. Building M Cloud sync module next.',
    paymentMethod: 'Bank Transfer / IBAN',
    paymentPlan: '40% Deposit',
    paymentStatus: 'Deposit Paid',
    paymentReference: 'IBAN-PK-884120',
    quotedAmount: 850,
    amountPaid: 340,
    createdAt: '2026-11-16T10:15:00.000Z',
    metadata: {
      deploymentMode: 'Hybrid Online + Offline',
      platformTarget: 'Windows PC (.EXE) + Android (.APK)',
      estimatedTimeline: '3–4 weeks',
    },
    replies: [
      {
        id: 'rep-201',
        author: 'Saddam Hussain · Mashal Tech',
        message: 'Deposit verified. Your beta Windows installer preview will be ready within 48 hours.',
        timestamp: '2026-11-16T14:30:00.000Z',
      },
    ],
  },
  {
    id: 'inq-2042',
    referenceCode: 'MT-SRV-2042',
    trackingKey: 'MT-KEY-7194-AS4K',
    source: 'Assignment & Service',
    customerName: 'Hina Siddiqui',
    customerEmail: 'hina.s@outlook.com',
    contactNumber: '+971 50 4821900',
    mobileNumber: '+971 50 4821900',
    whatsappNumber: '+971 50 4821900',
    country: 'UAE',
    companyName: 'Cedar Trading LLC',
    subject: 'Automated Excel Inventory & Profit Dashboard + PDF Invoice Pack',
    category: 'Excel Templates',
    message: 'Need a multi-sheet Excel inventory workbook with automatic reorder alerts and fillable PDF delivery notes.',
    status: 'In Review',
    progressPercent: 85,
    milestoneStage: 'Testing & QA',
    developerNote: 'All dynamic lookup formulas and print layouts tested in Excel 2021. Final PDF form polish underway.',
    paymentMethod: 'Payoneer / Wise',
    paymentPlan: '100% Full Payment',
    paymentStatus: 'Paid in Full',
    paymentReference: 'WISE-992014',
    quotedAmount: 75,
    amountPaid: 71,
    createdAt: '2026-11-16T16:40:00.000Z',
    replies: [],
  },
  {
    id: 'inq-2043',
    referenceCode: 'MT-MSG-2043',
    trackingKey: 'MT-KEY-3091-EL8P',
    source: 'Contact Form',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@nordicstudio.eu',
    country: 'Germany',
    companyName: 'Nordic Studio',
    subject: 'M Cloud Desktop Sync Vault Team Licensing',
    category: 'M Cloud & Sync',
    message: 'Hello Mashal Tech team, we want 10 PC license seats for M Cloud Desktop Sync Vault with private LAN backup.',
    status: 'Replied',
    progressPercent: 100,
    milestoneStage: 'Final Delivery',
    developerNote: '10-seat enterprise key bundle issued and verified.',
    paymentMethod: 'Credit / Debit Card',
    paymentPlan: '100% Full Payment',
    paymentStatus: 'Paid in Full',
    quotedAmount: 845,
    amountPaid: 845,
    createdAt: '2026-11-15T11:40:00.000Z',
    replies: [
      {
        id: 'rep-202',
        author: 'Saddam Hussain · Mashal Tech',
        message: 'Your 10-seat license bundle is ready. Let us know if you need custom installer branding.',
        timestamp: '2026-11-15T12:30:00.000Z',
      },
    ],
  },
];

const SEED_VISITORS: VisitorRecord[] = [
  {
    id: 'vis-seed-1',
    visitorKey: 'seed-tariq-pk',
    visitorName: 'Tariq Mahmood',
    device: 'Desktop',
    lastView: 'Order App',
    lastAction: 'Submitted Custom App Order (MT-APP-2041)',
    visitCount: 3,
    firstVisitedAt: '2026-11-16T09:45:00.000Z',
    lastVisitedAt: '2026-11-16T10:15:00.000Z',
  },
  {
    id: 'vis-seed-2',
    visitorKey: 'seed-hina-uae',
    visitorName: 'Hina Siddiqui',
    device: 'Mobile',
    lastView: 'Services',
    lastAction: 'Ordered Excel Inventory Dashboard',
    visitCount: 2,
    firstVisitedAt: '2026-11-16T16:10:00.000Z',
    lastVisitedAt: '2026-11-16T16:40:00.000Z',
  },
];

const SEED_TESTIMONIALS: TestimonialRecord[] = [
  {
    id: 'test-101',
    clientName: 'Tariq Mahmood',
    companyOrRole: 'Director · NorthStar Retail Group',
    country: 'Lahore, PK',
    projectOrApp: 'Custom Offline + Cloud Retail POS',
    rating: 5,
    quote:
      'We run 4 retail branches on older 4GB RAM PCs. Saddam delivered an offline-first Windows billing app that syncs automatically over M Cloud and prints thermal receipts without lag.',
    verifiedPurchase: true,
    createdAt: '2026-11-12T10:30:00.000Z',
  },
  {
    id: 'test-102',
    clientName: 'Hina Siddiqui',
    companyOrRole: 'Operations Lead · Cedar Trading LLC',
    country: 'Dubai, UAE',
    projectOrApp: 'Executive Excel & MS Word Business Suite',
    rating: 5,
    quote:
      'The automated inventory workbooks and fillable PDF delivery notes saved our accounts team at least 10 hours a week. Easy ordering via Tracking Key and fast delivery.',
    verifiedPurchase: true,
    createdAt: '2026-11-14T15:15:00.000Z',
  },
  {
    id: 'test-103',
    clientName: 'Usman Farooq',
    companyOrRole: 'Proprietor · Al-Falah Pharmacy',
    country: 'Mardan, PK',
    projectOrApp: 'Clinic & Pharmacy Token Queue App',
    rating: 5,
    quote:
      'Paid easily through Easypaisa and followed every build stage with our MT-KEY code. Our patient queue display and Android companion app work smoothly all day.',
    verifiedPurchase: true,
    createdAt: '2026-11-15T11:20:00.000Z',
  },
  {
    id: 'test-104',
    clientName: 'Elena Rostova',
    companyOrRole: 'Founder · Nordic Studio',
    country: 'Berlin, Germany',
    projectOrApp: 'M-Cloud Setup v1.0.0',
    rating: 5,
    quote:
      'Clean Windows installer with zero bloatware. Our 10-seat team license was verified the same day and encrypted local backups run silently in the background.',
    verifiedPurchase: true,
    createdAt: '2026-11-16T09:05:00.000Z',
  },
];

function ensureDatabase(): StoreDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: StoreDatabase = {
      apps: SEED_APPS.map((a) => ({
        ...a,
        shareUrl: a.shareUrl || buildAppShareUrl(a.id, DEFAULT_SETTINGS.domain),
      })),
      inquiries: SEED_INQUIRIES,
      visitors: SEED_VISITORS,
      testimonials: SEED_TESTIMONIALS,
      settings: DEFAULT_SETTINGS,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreDatabase>;
    const settings: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {}),
    };
    const apps = (Array.isArray(parsed.apps) && parsed.apps.length > 0 ? parsed.apps : SEED_APPS).map(
      (a) => ({
        ...a,
        shareUrl: a.shareUrl || buildAppShareUrl(a.id, settings.domain),
      })
    );
    const inquiries = Array.isArray(parsed.inquiries)
      ? parsed.inquiries.map((item) => ({
          ...item,
          progressPercent: typeof item.progressPercent === 'number' ? item.progressPercent : 15,
          milestoneStage: item.milestoneStage || 'Requirements Locked',
        }))
      : SEED_INQUIRIES;

    const hasSeedAppOrder = inquiries.some((i) => i.trackingKey === 'MT-KEY-4820-M9X2');
    const finalInquiries = hasSeedAppOrder ? inquiries : [...SEED_INQUIRIES, ...inquiries];
    const visitors = Array.isArray(parsed.visitors) ? parsed.visitors : SEED_VISITORS;
    const testimonials = Array.isArray(parsed.testimonials) ? parsed.testimonials : SEED_TESTIMONIALS;

    return { apps, inquiries: finalInquiries, visitors, testimonials, settings };
  } catch {
    const fallback: StoreDatabase = {
      apps: SEED_APPS.map((a) => ({
        ...a,
        shareUrl: a.shareUrl || buildAppShareUrl(a.id, DEFAULT_SETTINGS.domain),
      })),
      inquiries: SEED_INQUIRIES,
      visitors: SEED_VISITORS,
      testimonials: SEED_TESTIMONIALS,
      settings: DEFAULT_SETTINGS,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveDatabase(db: StoreDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function recordNamedClientVisit(
  db: StoreDatabase,
  name: string,
  action: string,
  view: string,
  visitorKey?: string
): void {
  const cleanName = name.trim();
  const key = (visitorKey || `client-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).slice(0, 64);
  const now = new Date().toISOString();
  const existing = db.visitors.find((v) => v.visitorKey === key);
  if (existing) {
    if (cleanName && cleanName !== 'Guest') {
      existing.visitorName = cleanName;
    }
    existing.lastView = view;
    existing.lastAction = action;
    existing.visitCount += 1;
    existing.lastVisitedAt = now;
  } else {
    db.visitors.unshift({
      id: `vis-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      visitorKey: key,
      visitorName: cleanName || 'Guest',
      device: 'Desktop',
      lastView: view,
      lastAction: action,
      visitCount: 1,
      firstVisitedAt: now,
      lastVisitedAt: now,
    });
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileName(rawName: string): string {
  const base = path.basename(rawName || 'mashal-installer.bin');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function generateReferenceCode(prefix: string): string {
  const num = Math.floor(1050 + Math.random() * 8900);
  return `${prefix}-${num}`;
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();

  // Raw binary file upload endpoint for .exe, .msi, .apk, .zip, .xlsx, .pdf installers
  app.post(
    '/api/upload',
    express.raw({ type: '*/*', limit: '60mb' }),
    (req: Request, res: Response) => {
      try {
        const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
        if (buffer.length === 0) {
          res.status(400).json({ error: 'Uploaded file is empty.' });
          return;
        }

        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        const rawName = String(req.query.filename || req.headers['x-file-name'] || 'app-package.bin');
        const safeOriginal = sanitizeFileName(rawName);
        const storedFileName = `${Date.now()}-${safeOriginal}`;
        const destPath = path.join(UPLOADS_DIR, storedFileName);
        fs.writeFileSync(destPath, buffer);

        const ext = path.extname(safeOriginal).toUpperCase() || '.BIN';
        res.status(201).json({
          storedFileName,
          originalFileName: safeOriginal,
          fileSize: formatBytes(buffer.length),
          fileFormat: ext,
        });
      } catch (err: unknown) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'File upload failed.',
        });
      }
    }
  );

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'mashal-tech-app-store', domain: 'mashaltech.eu.org' });
  });

  app.get('/api/domain-check', async (req: Request, res: Response) => {
    const rawDomain = String(req.query.domain || 'mashaltech.eu.org')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-z0-9.-]/g, '');

    if (!rawDomain || !rawDomain.includes('.')) {
      res.status(400).json({ error: 'Please provide a valid domain name to check.' });
      return;
    }

    try {
      const records: string[] = [];
      try {
        const aRecords = await dns.resolve4(rawDomain);
        aRecords.forEach((ip) => records.push(`A ${ip}`));
      } catch {
        // try CNAME/NS next
      }
      try {
        const cnameRecords = await dns.resolveCname(rawDomain);
        cnameRecords.forEach((c) => records.push(`CNAME ${c}`));
      } catch {
        // ignore
      }
      try {
        const nsRecords = await dns.resolveNs(rawDomain);
        nsRecords.forEach((ns) => records.push(`NS ${ns}`));
      } catch {
        // ignore
      }

      if (records.length > 0) {
        res.json({
          domain: rawDomain,
          resolvable: true,
          records,
          message: `${rawDomain} resolves on public DNS (${records.slice(0, 2).join(', ')}).`,
          checkedAt: new Date().toISOString(),
        });
        return;
      }

      // Probe lookup error code explicitly
      try {
        await dns.lookup(rawDomain);
      } catch (lookupErr: unknown) {
        const code =
          lookupErr && typeof lookupErr === 'object' && 'code' in lookupErr
            ? String((lookupErr as { code?: string }).code)
            : 'ENOTFOUND';
        res.json({
          domain: rawDomain,
          resolvable: false,
          records: [],
          errorCode: code,
          message: `${rawDomain} is not registered or DNS has not propagated yet (${code}).`,
          checkedAt: new Date().toISOString(),
        });
        return;
      }

      res.json({
        domain: rawDomain,
        resolvable: false,
        records: [],
        errorCode: 'NXDOMAIN',
        message: `${rawDomain} has no live DNS records yet.`,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      res.json({
        domain: rawDomain,
        resolvable: false,
        records: [],
        errorCode: 'DNS_ERROR',
        message: err instanceof Error ? err.message : 'DNS lookup failed.',
        checkedAt: new Date().toISOString(),
      });
    }
  });

  // Store Settings (Admin Maintenance & Easypaisa Config)
  app.get('/api/settings', (_req: Request, res: Response) => {
    const db = ensureDatabase();
    res.json({ settings: db.settings });
  });

  app.patch('/api/settings', (req: Request, res: Response) => {
    const db = ensureDatabase();
    const patch = req.body ?? {};
    const next: StoreSettings = {
      ...db.settings,
      storeName:
        typeof patch.storeName === 'string' && patch.storeName.trim()
          ? patch.storeName.trim()
          : db.settings.storeName,
      domain:
        typeof patch.domain === 'string' && patch.domain.trim()
          ? patch.domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
          : db.settings.domain,
      useCustomDomainForQr:
        typeof patch.useCustomDomainForQr === 'boolean'
          ? patch.useCustomDomainForQr
          : db.settings.useCustomDomainForQr,
      announcementBanner:
        typeof patch.announcementBanner === 'string'
          ? patch.announcementBanner.trim()
          : db.settings.announcementBanner,
      contactEmail:
        typeof patch.contactEmail === 'string' && patch.contactEmail.trim()
          ? patch.contactEmail.trim()
          : db.settings.contactEmail,
      easypaisaNumber:
        typeof patch.easypaisaNumber === 'string' && patch.easypaisaNumber.trim()
          ? patch.easypaisaNumber.trim()
          : db.settings.easypaisaNumber,
      easypaisaAccountName:
        typeof patch.easypaisaAccountName === 'string' && patch.easypaisaAccountName.trim()
          ? patch.easypaisaAccountName.trim()
          : db.settings.easypaisaAccountName,
      location:
        typeof patch.location === 'string' && patch.location.trim()
          ? patch.location.trim()
          : db.settings.location,
      usdToPkrRate:
        typeof patch.usdToPkrRate === 'number' && patch.usdToPkrRate > 50
          ? Math.round(patch.usdToPkrRate)
          : db.settings.usdToPkrRate,
      adminPin: typeof patch.adminPin === 'string' ? patch.adminPin.trim() : db.settings.adminPin,
      maintenanceMode:
        typeof patch.maintenanceMode === 'boolean'
          ? patch.maintenanceMode
          : db.settings.maintenanceMode,
    };

    db.settings = next;
    saveDatabase(db);
    res.json({ settings: db.settings });
  });

  // Visitor & Client Name Analytics
  app.get('/api/visits', (_req: Request, res: Response) => {
    const db = ensureDatabase();
    const sorted = [...db.visitors].sort(
      (a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()
    );
    const totalVisits = sorted.reduce((sum, v) => sum + (v.visitCount || 1), 0);
    const uniqueVisitors = sorted.length;
    const namedClients = sorted.filter((v) => v.visitorName && v.visitorName !== 'Guest').length;
    const mobileCount = sorted.filter((v) => v.device === 'Mobile').length;
    res.json({
      visitors: sorted,
      summary: { totalVisits, uniqueVisitors, namedClients, mobileCount },
    });
  });

  app.post('/api/visits', (req: Request, res: Response) => {
    const {
      visitorKey = '',
      visitorName = '',
      lastView = 'Apps',
      lastAction = 'Visited Storefront',
      incrementVisit = true,
    } = req.body ?? {};

    const cleanKey = String(visitorKey || `anon-${Date.now()}`).trim().slice(0, 64);
    const cleanName = String(visitorName || '').trim().slice(0, 60);
    const ua = String(req.headers['user-agent'] || '');
    const device: 'Desktop' | 'Mobile' = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop';
    const now = new Date().toISOString();

    const db = ensureDatabase();
    let existing = db.visitors.find((v) => v.visitorKey === cleanKey);
    if (existing) {
      if (cleanName && cleanName !== 'Guest') {
        existing.visitorName = cleanName;
      }
      existing.device = device;
      existing.lastView = String(lastView || existing.lastView);
      existing.lastAction = String(lastAction || existing.lastAction);
      if (incrementVisit !== false) {
        existing.visitCount += 1;
      }
      existing.lastVisitedAt = now;
    } else {
      existing = {
        id: `vis-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        visitorKey: cleanKey,
        visitorName: cleanName || 'Guest',
        device,
        lastView: String(lastView || 'Apps'),
        lastAction: String(lastAction || 'Visited Storefront'),
        visitCount: 1,
        firstVisitedAt: now,
        lastVisitedAt: now,
      };
      db.visitors.unshift(existing);
    }

    saveDatabase(db);
    const totalVisits = db.visitors.reduce((sum, v) => sum + (v.visitCount || 1), 0);
    const uniqueVisitors = db.visitors.length;
    const namedClients = db.visitors.filter((v) => v.visitorName && v.visitorName !== 'Guest').length;
    res.json({
      visitor: existing,
      summary: { totalVisits, uniqueVisitors, namedClients },
    });
  });

  app.delete('/api/visits', (_req: Request, res: Response) => {
    const db = ensureDatabase();
    db.visitors = [];
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Client Testimonials (Read, Submit & Admin Moderate)
  app.get('/api/testimonials', (_req: Request, res: Response) => {
    const db = ensureDatabase();
    const sorted = [...db.testimonials].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      testimonials: sorted,
      stats: calculateTestimonialStats(sorted),
    });
  });

  app.post('/api/testimonials', (req: Request, res: Response) => {
    const {
      clientName = '',
      companyOrRole = '',
      country = '',
      projectOrApp = '',
      rating = 5,
      quote = '',
      visitorKey = '',
    } = req.body ?? {};

    const check = validateTestimonialSubmission({
      clientName: String(clientName),
      projectOrApp: String(projectOrApp),
      rating: Number(rating),
      quote: String(quote),
    });

    if (!check.valid) {
      res.status(400).json({
        error: Object.values(check.errors)[0] || 'Please check your testimonial fields.',
        errors: check.errors,
      });
      return;
    }

    const db = ensureDatabase();
    const cleanName = String(clientName).trim().slice(0, 60);
    const cleanProject = String(projectOrApp).trim().slice(0, 80);
    const record: TestimonialRecord = {
      id: `test-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      clientName: cleanName,
      companyOrRole: String(companyOrRole).trim().slice(0, 80) || 'Verified Client',
      country: String(country).trim().slice(0, 50) || 'Global',
      projectOrApp: cleanProject,
      rating: Math.max(1, Math.min(5, Math.round(Number(rating) || 5))),
      quote: String(quote).trim().slice(0, 600),
      verifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    db.testimonials.unshift(record);
    recordNamedClientVisit(
      db,
      cleanName,
      `Left ${record.rating}★ Review (${cleanProject})`,
      'Testimonials',
      typeof visitorKey === 'string' && visitorKey ? visitorKey : undefined
    );
    saveDatabase(db);
    res.status(201).json({
      testimonial: record,
      stats: calculateTestimonialStats(db.testimonials),
    });
  });

  app.delete('/api/testimonials/:id', (req: Request, res: Response) => {
    const db = ensureDatabase();
    const next = db.testimonials.filter((item) => item.id !== req.params.id);
    if (next.length === db.testimonials.length) {
      res.status(404).json({ error: 'Testimonial not found.' });
      return;
    }
    db.testimonials = next;
    saveDatabase(db);
    res.json({ ok: true });
  });

  // App Store Catalog (PC & Mobile Apps + Templates)
  app.get('/api/apps', (_req: Request, res: Response) => {
    const db = ensureDatabase();
    res.json({ apps: db.apps });
  });

  app.post('/api/apps', (req: Request, res: Response) => {
    const {
      name = '',
      platform = 'PC',
      osLabel = '',
      fileFormat = '',
      fileSize = '',
      version = 'v1.0.0',
      category = 'Business & POS',
      price = 0,
      shortDesc = '',
      fullDesc = '',
      specs = [],
      tags = [],
      downloadUrl = '',
      storedFileName = '',
      originalFileName = '',
      iconTheme = '',
      verifiedLabel = '',
    } = req.body ?? {};

    if (String(name).trim().length < 2 || String(shortDesc).trim().length < 10) {
      res.status(400).json({
        error: 'Please enter an App Name and a clear summary description (min 10 characters).',
      });
      return;
    }

    const cleanPlatform = platform === 'Mobile' || platform === 'Templates' ? platform : 'PC';
    const defaultImg =
      cleanPlatform === 'PC'
        ? '/src/assets/images/product_workstation_pro_1794924166440.jpg'
        : cleanPlatform === 'Mobile'
        ? '/src/assets/images/journal_architecture_desk_1794924165043.jpg'
        : '/src/assets/images/product_design_kit_1794924165298.jpg';

    const db = ensureDatabase();
    const numericPrice = Math.max(0, Number(price) || 0);
    const skuPrefix = cleanPlatform === 'PC' ? 'MT-PC' : cleanPlatform === 'Mobile' ? 'MT-MB' : 'MT-TP';
    const cleanVersion = String(version).trim() || 'v1.0.0';

    const newAppId = `app-${cleanPlatform.toLowerCase()}-${Date.now()}`;
    const newApp: Product = {
      id: newAppId,
      sku: `${skuPrefix}-${Math.floor(100 + Math.random() * 899)}`,
      name: String(name).trim(),
      platform: cleanPlatform,
      osLabel:
        String(osLabel).trim() ||
        (cleanPlatform === 'PC'
          ? 'Windows x64 (10 / 11)'
          : cleanPlatform === 'Mobile'
          ? 'Android 10+ (.APK)'
          : 'MS Office / PDF'),
      fileFormat:
        String(fileFormat).trim() ||
        (cleanPlatform === 'PC' ? '.EXE' : cleanPlatform === 'Mobile' ? '.APK' : '.XLSX / .DOCX'),
      fileSize: String(fileSize).trim() || (cleanPlatform === 'Mobile' ? '24 MB' : '48 MB'),
      version: cleanVersion,
      category,
      price: numericPrice,
      rating: 5.0,
      reviewCount: 1,
      downloads: 1,
      image: defaultImg,
      iconTheme:
        iconTheme === 'cyan' || iconTheme === 'orange' || iconTheme === 'emerald' || iconTheme === 'indigo'
          ? iconTheme
          : cleanPlatform === 'Mobile'
          ? 'emerald'
          : 'cyan',
      verifiedLabel: String(verifiedLabel).trim() || `Verified ${cleanVersion}`,
      shortDesc: String(shortDesc).trim(),
      fullDesc: String(fullDesc).trim() || String(shortDesc).trim(),
      specs: Array.isArray(specs) && specs.length > 0 ? specs : ['Verified Mashal Tech Build', 'Direct Installer Package'],
      tags:
        Array.isArray(tags) && tags.length > 0
          ? tags
          : [cleanPlatform.toLowerCase(), String(category).toLowerCase(), String(name).toLowerCase()],
      availability: numericPrice === 0 ? 'Instant Download' : 'License Key',
      featured: true,
      downloadUrl: String(downloadUrl).trim() || undefined,
      storedFileName: String(storedFileName).trim() || undefined,
      originalFileName: String(originalFileName).trim() || undefined,
      shareUrl: buildAppShareUrl(newAppId, db.settings.domain),
    };

    db.apps.unshift(newApp);
    saveDatabase(db);
    res.status(201).json({ app: newApp });
  });

  // Full Admin App Editing + Binary Attachment
  app.patch('/api/apps/:id', (req: Request, res: Response) => {
    const db = ensureDatabase();
    const target = db.apps.find((item) => item.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'App not found.' });
      return;
    }

    const {
      name,
      platform,
      osLabel,
      storedFileName,
      originalFileName,
      fileSize,
      fileFormat,
      downloadUrl,
      version,
      category,
      price,
      shortDesc,
      fullDesc,
      specs,
      featured,
      verifiedLabel,
    } = req.body ?? {};

    if (typeof name === 'string' && name.trim().length >= 2) target.name = name.trim();
    if (platform === 'PC' || platform === 'Mobile' || platform === 'Templates') {
      target.platform = platform;
    }
    if (typeof osLabel === 'string' && osLabel.trim()) target.osLabel = osLabel.trim();
    if (typeof storedFileName === 'string' && storedFileName.trim()) {
      target.storedFileName = storedFileName.trim();
    }
    if (typeof originalFileName === 'string' && originalFileName.trim()) {
      target.originalFileName = originalFileName.trim();
    }
    if (typeof fileSize === 'string' && fileSize.trim()) target.fileSize = fileSize.trim();
    if (typeof fileFormat === 'string' && fileFormat.trim()) target.fileFormat = fileFormat.trim();
    if (typeof downloadUrl === 'string') target.downloadUrl = downloadUrl.trim() || undefined;
    if (typeof version === 'string' && version.trim()) {
      target.version = version.trim();
      target.verifiedLabel = `Verified ${target.version}`;
    }
    if (typeof category === 'string' && category.trim()) {
      target.category = category.trim() as Product['category'];
    }
    if (typeof price === 'number' && !Number.isNaN(price) && price >= 0) {
      target.price = price;
      target.availability = price === 0 ? 'Instant Download' : 'License Key';
    }
    if (typeof shortDesc === 'string' && shortDesc.trim().length >= 5) {
      target.shortDesc = shortDesc.trim();
    }
    if (typeof fullDesc === 'string' && fullDesc.trim().length >= 5) {
      target.fullDesc = fullDesc.trim();
    }
    if (Array.isArray(specs)) {
      target.specs = specs.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof featured === 'boolean') target.featured = featured;
    if (typeof verifiedLabel === 'string' && verifiedLabel.trim()) {
      target.verifiedLabel = verifiedLabel.trim();
    }
    target.shareUrl = target.shareUrl || buildAppShareUrl(target.id, db.settings.domain);

    saveDatabase(db);
    res.json({ app: target });
  });

  // Real download handler: serves uploaded binary, redirects external release link, or provides verified manifest
  app.get('/api/apps/:id/download', (req: Request, res: Response) => {
    const db = ensureDatabase();
    const target = db.apps.find((item) => item.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'App package not found.' });
      return;
    }

    target.downloads = (target.downloads || 0) + 1;
    saveDatabase(db);

    if (target.storedFileName) {
      const filePath = path.join(UPLOADS_DIR, path.basename(target.storedFileName));
      if (fs.existsSync(filePath)) {
        res.download(filePath, target.originalFileName || target.storedFileName);
        return;
      }
    }

    if (target.downloadUrl && /^https?:\/\//i.test(target.downloadUrl)) {
      res.redirect(target.downloadUrl);
      return;
    }

    const cleanSlug = target.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const manifestText = [
      `MASHAL TECH APP STORE — VERIFIED INSTALLER PACKAGE`,
      `====================================================`,
      `App Name:       ${target.name}`,
      `SKU / Build:    ${target.sku} (${target.version})`,
      `Platform / OS:  ${target.platform} · ${target.osLabel}`,
      `Format / Size:  ${target.fileFormat} · ${target.fileSize}`,
      `Status:         ${target.verifiedLabel || 'Verified Build'}`,
      ``,
      `Description:`,
      `${target.fullDesc}`,
      ``,
      `Note for Store Owner: Upload your real ${target.fileFormat} binary in Owner Studio -> Attach Binary so buyers download the compiled installer directly.`,
      ``,
      `Direct Developer Support:`,
      `Email:          6saddamhussain9@gmail.com`,
      `Phone/WhatsApp: 0370-0818276`,
      `Location:       Mardan & Peshawar, PK`,
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanSlug}-${target.version}-Info.txt"`);
    res.send(manifestText);
  });

  app.delete('/api/apps/:id', (req: Request, res: Response) => {
    const db = ensureDatabase();
    const nextApps = db.apps.filter((item) => item.id !== req.params.id);
    if (nextApps.length === db.apps.length) {
      res.status(404).json({ error: 'App not found.' });
      return;
    }
    db.apps = nextApps;
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Track Project Progress by Tracking Key
  app.get('/api/track/:key', (req: Request, res: Response) => {
    const queryKey = decodeURIComponent(req.params.key || '').trim().toUpperCase();
    if (!queryKey) {
      res.status(400).json({ error: 'Please enter a valid tracking key.' });
      return;
    }

    const db = ensureDatabase();
    const match = db.inquiries.find(
      (item) =>
        (item.trackingKey && item.trackingKey.toUpperCase() === queryKey) ||
        item.referenceCode.toUpperCase() === queryKey
    );

    if (!match) {
      res.status(404).json({
        error: `No project or order found matching key "${queryKey}". Check your key and try again.`,
      });
      return;
    }

    res.json({ record: match });
  });

  // All Inquiries / Orders (Owner Dashboard)
  app.get('/api/inquiries', (_req: Request, res: Response) => {
    const db = ensureDatabase();
    const sorted = [...db.inquiries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ inquiries: sorted });
  });

  // Contact Form Submission
  app.post('/api/inquiries', (req: Request, res: Response) => {
    const {
      customerName = '',
      customerEmail = '',
      subject = '',
      category = 'General Inquiry',
      message = '',
      source = 'Contact Form',
      websiteHoneypot = '',
      metadata,
    } = req.body ?? {};

    const validation = validateContactSubmission({
      name: String(customerName),
      email: String(customerEmail),
      subject: String(subject),
      message: String(message),
      websiteHoneypot: String(websiteHoneypot),
    });

    if (!validation.valid) {
      res.status(validation.isSpam ? 403 : 400).json({
        error: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const db = ensureDatabase();
    const trackingKey = generateTrackingKey();
    const record: InquiryRecord = {
      id: `inq-${Date.now()}`,
      referenceCode: generateReferenceCode('MT-MSG'),
      trackingKey,
      source,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      subject: String(subject).trim(),
      category: String(category).trim(),
      message: String(message).trim(),
      status: 'New',
      progressPercent: 10,
      milestoneStage: 'Inquiry Logged',
      developerNote: 'Received by Mashal Tech Desk.',
      createdAt: new Date().toISOString(),
      metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
      replies: [],
    };

    db.inquiries.unshift(record);
    recordNamedClientVisit(
      db,
      String(customerName),
      `Sent Inquiry: ${String(subject).trim().slice(0, 40)}`,
      'Contact',
      typeof req.body?.visitorKey === 'string' ? req.body.visitorKey : undefined
    );
    saveDatabase(db);
    res.status(201).json({ inquiry: record });
  });

  // Detailed Custom App Order with Client Info + Payment + Tracking Key
  app.post('/api/orders/custom-app', (req: Request, res: Response) => {
    const {
      customerName = '',
      customerEmail = '',
      contactNumber = '',
      mobileNumber = '',
      whatsappNumber = '',
      country = '',
      companyName = '',
      appTitle = '',
      targetPlatform = 'Windows PC App (.EXE)',
      deploymentMode = 'Hybrid Online + Offline',
      purpose = '',
      specifications = '',
      limitations = '',
      quotedAmount = 450,
      paymentPlan = '40% Deposit',
      paymentMethod = 'Easypaisa',
      paymentReference = '',
      senderAccount = '',
      visitorKey = '',
      aiModules = [],
    } = req.body ?? {};

    const clientCheck = validateClientOrderDetails({
      customerName: String(customerName),
      customerEmail: String(customerEmail),
      contactNumber: String(contactNumber),
      mobileNumber: String(mobileNumber),
      whatsappNumber: String(whatsappNumber),
      country: String(country),
      companyName: String(companyName),
      paymentMethod,
      paymentReference,
    });

    if (!clientCheck.valid || String(purpose).trim().length < 10) {
      res.status(400).json({
        error:
          String(purpose).trim().length < 10
            ? 'Please explain the purpose of your app in at least 10 characters.'
            : 'Please complete all required client contact fields.',
        errors: clientCheck.errors,
      });
      return;
    }

    const plan = paymentPlan === '100% Full Payment' ? '100% Full Payment' : '40% Deposit';
    const paymentCalc = calculateProjectPayment(Number(quotedAmount) || 450, plan);
    const trackingKey = generateTrackingKey();

    const db = ensureDatabase();
    const record: InquiryRecord = {
      id: `app-ord-${Date.now()}`,
      referenceCode: generateReferenceCode('MT-APP'),
      trackingKey,
      source: 'Custom App Order',
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      contactNumber: String(contactNumber).trim() || String(mobileNumber).trim(),
      mobileNumber: String(mobileNumber).trim(),
      whatsappNumber: String(whatsappNumber).trim(),
      country: String(country).trim(),
      companyName: String(companyName).trim(),
      subject: String(appTitle).trim() || `${targetPlatform} · ${String(companyName).trim()}`,
      category: `${targetPlatform} (${deploymentMode})`,
      message: [
        `Purpose: ${String(purpose).trim()}`,
        `Specifications: ${String(specifications || 'Standard custom workflow').trim()}`,
        `Limitations / Constraints: ${String(limitations || 'None specified').trim()}`,
        Array.isArray(aiModules) && aiModules.length > 0 ? `Selected Modules: ${aiModules.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      status: 'New',
      progressPercent: 15,
      milestoneStage: 'Requirements & Deposit Logged',
      developerNote: 'Order received and assigned a tracking key. Architect reviewing specifications.',
      paymentMethod: paymentMethod as PaymentMethod,
      paymentPlan: plan,
      paymentStatus: 'Pending Verification',
      paymentReference: String(paymentReference).trim() || 'Awaiting Transfer Receipt',
      senderAccount: String(senderAccount).trim() || undefined,
      quotedAmount: paymentCalc.finalTotal,
      amountPaid: paymentCalc.dueNow,
      createdAt: new Date().toISOString(),
      metadata: {
        targetPlatform,
        deploymentMode,
        country,
        companyName,
        whatsappNumber,
        senderAccount: String(senderAccount).trim() || undefined,
        dueNow: paymentCalc.dueNow,
        remainingBalance: paymentCalc.remainingBalance,
      },
      replies: [],
    };

    db.inquiries.unshift(record);
    recordNamedClientVisit(
      db,
      String(customerName),
      `Submitted Custom App Order (${record.referenceCode})`,
      'Order App',
      visitorKey ? String(visitorKey) : undefined
    );
    saveDatabase(db);
    res.status(201).json({ order: record, payment: paymentCalc });
  });

  // Assignments & Digital Services Order (Excel, Word, PDF, Graphic Design, Assignments)
  app.post('/api/orders/assignments', (req: Request, res: Response) => {
    const {
      customerName = '',
      customerEmail = '',
      mobileNumber = '',
      whatsappNumber = '',
      country = '',
      companyName = 'Personal / Student',
      serviceCategory = 'Assignments',
      serviceTitle = '',
      deadline = '48 Hours',
      details = '',
      quotedAmount = 35,
      paymentPlan = '100% Full Payment',
      paymentMethod = 'Easypaisa',
      paymentReference = '',
      senderAccount = '',
      visitorKey = '',
    } = req.body ?? {};

    if (
      String(customerName).trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim()) ||
      String(whatsappNumber).trim().length < 7 ||
      String(details).trim().length < 10
    ) {
      res.status(400).json({
        error: 'Please enter your name, valid email, WhatsApp number, and task instructions (min 10 characters).',
      });
      return;
    }

    const plan = paymentPlan === '40% Deposit' ? '40% Deposit' : '100% Full Payment';
    const paymentCalc = calculateProjectPayment(Number(quotedAmount) || 35, plan);
    const trackingKey = generateTrackingKey();

    const db = ensureDatabase();
    const record: InquiryRecord = {
      id: `srv-${Date.now()}`,
      referenceCode: generateReferenceCode('MT-SRV'),
      trackingKey,
      source: 'Assignment & Service',
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      mobileNumber: String(mobileNumber || whatsappNumber).trim(),
      whatsappNumber: String(whatsappNumber).trim(),
      country: String(country || 'International').trim(),
      companyName: String(companyName || 'Personal').trim(),
      subject: `${String(serviceCategory)}: ${String(serviceTitle || 'Custom Service Request').trim()}`,
      category: String(serviceCategory),
      message: `Deadline: ${String(deadline)}\n\nTask Brief:\n${String(details).trim()}`,
      status: 'New',
      progressPercent: 20,
      milestoneStage: 'Task Assigned to Specialist',
      developerNote: 'Assignment/service brief logged. Preparing initial draft.',
      paymentMethod: paymentMethod as PaymentMethod,
      paymentPlan: plan,
      paymentStatus: 'Pending Verification',
      paymentReference: String(paymentReference).trim() || 'Submitted via Checkout',
      senderAccount: String(senderAccount).trim() || undefined,
      quotedAmount: paymentCalc.finalTotal,
      amountPaid: paymentCalc.dueNow,
      createdAt: new Date().toISOString(),
      metadata: {
        serviceCategory,
        deadline,
        whatsappNumber,
        senderAccount: String(senderAccount).trim() || undefined,
        dueNow: paymentCalc.dueNow,
      },
      replies: [],
    };

    db.inquiries.unshift(record);
    recordNamedClientVisit(
      db,
      String(customerName),
      `Ordered Service: ${String(serviceCategory)}`,
      'Services',
      visitorKey ? String(visitorKey) : undefined
    );
    saveDatabase(db);
    res.status(201).json({ order: record, payment: paymentCalc });
  });

  // Custom Design / Illustration Order
  app.post('/api/orders/design', (req: Request, res: Response) => {
    const {
      customerName = '',
      customerEmail = '',
      projectTitle = '',
      brief = '',
      targetPlatform = '',
      dimensions = '',
      config,
    } = req.body ?? {};

    if (
      String(customerName).trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim()) ||
      String(projectTitle).trim().length < 3 ||
      String(brief).trim().length < 15 ||
      !config
    ) {
      res.status(400).json({
        error: 'Please complete your name, valid email, project title, and creative brief (min 15 characters).',
      });
      return;
    }

    const typedConfig = config as DesignOrderConfig;
    const quote = calculateDesignQuote(typedConfig);
    const trackingKey = generateTrackingKey();

    const db = ensureDatabase();
    const record: InquiryRecord = {
      id: `des-${Date.now()}`,
      referenceCode: generateReferenceCode('MT-DES'),
      trackingKey,
      source: 'Custom Design Order',
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      subject: `${String(projectTitle).trim()} (${typedConfig.assetType} · ${typedConfig.assetCount}x)`,
      category: typedConfig.assetType,
      message: String(brief).trim(),
      status: 'New',
      progressPercent: 15,
      milestoneStage: 'Brief Confirmed',
      developerNote: 'Design studio reviewing color palette and vector grid specs.',
      quotedAmount: quote.totalPrice,
      createdAt: new Date().toISOString(),
      metadata: {
        ...typedConfig,
        targetPlatform: String(targetPlatform || 'Web & Digital'),
        dimensions: String(dimensions || 'Scalable Vector / 4K'),
        quotedTotal: quote.totalPrice,
        estimatedDays: quote.estimatedDays,
      },
      replies: [],
    };

    db.inquiries.unshift(record);
    saveDatabase(db);
    res.status(201).json({ order: record, quote });
  });

  // App Store Cart Checkout with Detailed Payment Method
  app.post('/api/orders/checkout', (req: Request, res: Response) => {
    const {
      customerName = '',
      customerEmail = '',
      whatsappNumber = '',
      country = '',
      paymentMethod = 'Easypaisa',
      paymentReference = '',
      senderAccount = '',
      visitorKey = '',
      items = [],
      total = 0,
    } = req.body ?? {};

    if (
      String(customerName).trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail).trim()) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      res.status(400).json({
        error: 'Please enter a valid name, email, and at least one app in your bag.',
      });
      return;
    }

    const db = ensureDatabase();
    const trackingKey = generateTrackingKey();
    const itemSummary = items
      .map((entry: { name: string; quantity: number; price: number }) => `${entry.quantity}x ${entry.name} ($${entry.price})`)
      .join(', ');

    const record: InquiryRecord = {
      id: `ord-${Date.now()}`,
      referenceCode: generateReferenceCode('MT-ORD'),
      trackingKey,
      source: 'App Store Purchase',
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      whatsappNumber: String(whatsappNumber || '').trim() || undefined,
      country: String(country || '').trim() || undefined,
      subject: `App Store License Order (${items.length} item${items.length > 1 ? 's' : ''} · $${Number(total).toLocaleString()})`,
      category: 'App Store Checkout',
      message: `Purchased Apps: ${itemSummary}\nPayment Method: ${paymentMethod}\nTransaction Ref: ${paymentReference || 'Card / Instant Authorization'}`,
      status: 'New',
      progressPercent: 100,
      milestoneStage: 'License & Download Ready',
      developerNote: 'App package license key generated. Download links unlocked.',
      paymentMethod: paymentMethod as PaymentMethod,
      paymentPlan: '100% Full Payment',
      paymentStatus: paymentMethod === 'Credit / Debit Card' ? 'Paid in Full' : 'Pending Verification',
      paymentReference: String(paymentReference || 'CARD-AUTH').trim(),
      senderAccount: String(senderAccount || '').trim() || undefined,
      quotedAmount: Number(total),
      amountPaid: Number(total),
      createdAt: new Date().toISOString(),
      metadata: { items, total, paymentMethod, senderAccount: String(senderAccount || '').trim() || undefined },
      replies: [],
    };

    db.inquiries.unshift(record);
    recordNamedClientVisit(
      db,
      String(customerName),
      `Purchased App License (${record.referenceCode})`,
      'Bag Checkout',
      visitorKey ? String(visitorKey) : undefined
    );
    saveDatabase(db);
    res.status(201).json({ order: record });
  });

  // Owner Update: Status, Progress %, Milestone Stage, Developer Note, Payment Status & Reply
  app.patch('/api/inquiries/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      status,
      progressPercent,
      milestoneStage,
      developerNote,
      paymentStatus,
      replyMessage,
      replyAuthor = 'Saddam Hussain · Mashal Tech',
    } = req.body ?? {};

    const db = ensureDatabase();
    const target = db.inquiries.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: 'Order/inquiry record not found.' });
      return;
    }

    const validStatuses: InquiryStatus[] = ['New', 'In Review', 'Replied', 'Completed'];
    if (status && validStatuses.includes(status)) {
      target.status = status;
    }

    if (typeof progressPercent === 'number' && !Number.isNaN(progressPercent)) {
      target.progressPercent = Math.max(0, Math.min(100, Math.round(progressPercent)));
    }

    if (typeof milestoneStage === 'string' && milestoneStage.trim()) {
      target.milestoneStage = milestoneStage.trim();
    }

    if (typeof developerNote === 'string') {
      target.developerNote = developerNote.trim();
    }

    const validPayments: PaymentStatus[] = ['Pending Verification', 'Deposit Paid', 'Paid in Full'];
    if (paymentStatus && validPayments.includes(paymentStatus)) {
      target.paymentStatus = paymentStatus;
    }

    if (replyMessage && String(replyMessage).trim().length > 0) {
      target.replies.push({
        id: `rep-${Date.now()}`,
        author: String(replyAuthor).trim() || 'Saddam Hussain · Mashal Tech',
        message: String(replyMessage).trim(),
        timestamp: new Date().toISOString(),
      });
      if (!status) {
        target.status = 'Replied';
      }
    }

    saveDatabase(db);
    res.json({ inquiry: target });
  });

  app.delete('/api/inquiries/:id', (req: Request, res: Response) => {
    const db = ensureDatabase();
    const next = db.inquiries.filter((item) => item.id !== req.params.id);
    if (next.length === db.inquiries.length) {
      res.status(404).json({ error: 'Order/inquiry record not found.' });
      return;
    }
    db.inquiries = next;
    saveDatabase(db);
    res.json({ ok: true });
  });

  // AI Custom Software Advisor & Persuasive Deal Bot
  app.post('/api/ai/software-suggestions', async (req: Request, res: Response) => {
    const {
      purpose = '',
      specifications = '',
      limitations = '',
      deploymentMode = 'Hybrid Online + Offline',
      targetPlatform = 'Windows PC App (.EXE)',
      budgetPreference = 'Best ROI Value',
    } = req.body ?? {};

    if (String(purpose).trim().length < 8) {
      res.status(400).json({
        error: 'Please describe your app purpose in at least 8 characters so AI can advise you.',
      });
      return;
    }

    try {
      const ai = createGeminiClient();
      const prompt = [
        `A potential customer is visiting Mashal Tech App Store to order a custom app/software.`,
        `Target Platform: ${String(targetPlatform)}`,
        `Deployment Mode: ${String(deploymentMode)}`,
        `App Purpose: ${String(purpose).trim()}`,
        `Requested Specifications: ${String(specifications || 'Standard features')}`,
        `Client Limitations / Constraints: ${String(limitations || 'None stated')}`,
        `Budget Goal: ${String(budgetPreference)}`,
        `Analyze what is genuinely useful for this client (explain Online vs Offline trade-offs, hardware/OS constraints, and recommended features), AND write a persuasive, trustworthy business pitch ('valueProposition' and 'dealPitch') explaining why locking in a 40% kickoff deposit or 5%-discounted full payment with Mashal Tech today saves them time, prevents revenue leakage, and gives them a dedicated Tracking Key.`,
        `Set 'estimatedPriceUsd' to a realistic number between 120 and 2400 matching the scope.`,
      ].join('\n');

      const requestConfig = {
        systemInstruction:
          'You are the Senior Solutions Architect & Sales Advisor at Mashal Tech App Store. Be practical, honest about technical limitations, deeply helpful, and persuasively show the business ROI so the client feels confident ordering and paying today.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectTitle: { type: Type.STRING },
            valueProposition: { type: Type.STRING },
            dealPitch: { type: Type.STRING },
            architectureSummary: { type: Type.STRING },
            recommendedMode: { type: Type.STRING },
            recommendedStack: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            coreModules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  priority: { type: Type.STRING },
                },
                required: ['name', 'purpose', 'priority'],
              },
            },
            userRoles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            estimatedTimeline: { type: Type.STRING },
            estimatedPriceUsd: { type: Type.NUMBER },
            securityNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'projectTitle',
            'valueProposition',
            'dealPitch',
            'architectureSummary',
            'recommendedMode',
            'recommendedStack',
            'coreModules',
            'userRoles',
            'estimatedTimeline',
            'estimatedPriceUsd',
            'securityNotes',
          ],
        },
      };

      const candidateModels = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
      let responseText = '';
      let lastError: unknown = null;

      for (let attempt = 0; attempt < candidateModels.length; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: candidateModels[attempt],
            contents: prompt,
            config: requestConfig,
          });
          responseText = (response.text ?? '').trim();
          if (responseText) {
            lastError = null;
            break;
          }
        } catch (err: unknown) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
          if (!isTransient || attempt === candidateModels.length - 1) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        }
      }

      if (lastError) {
        throw lastError;
      }

      if (!responseText) {
        res.status(502).json({ error: 'The AI model returned an empty response. Please try again.' });
        return;
      }

      const suggestion = JSON.parse(responseText) as SoftwareBlueprintSuggestion;
      res.json({ suggestion });
    } catch (err: unknown) {
      let message = 'Unable to generate custom software suggestions right now.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          message = parsed?.error?.message || err.message;
        } catch {
          message = err.message;
        }
      }
      console.error('Gemini software suggestion error:', err);
      res.status(503).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Mashal Tech App Store running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Mashal Tech App Store server:', err);
  process.exit(1);
});
