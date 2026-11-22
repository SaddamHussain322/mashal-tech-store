import {
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileCheck2,
  Globe,
  Inbox,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Monitor,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Smartphone,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { FREE_DOMAIN_OPTIONS } from '../data/domains';
import {
  buildAppShareUrl,
  formatPkrEstimate,
  isInternalPreviewHost,
} from '../utils/storeLogic';
import { QrCodeSvg } from './QrCodeSvg';
import type {
  InquiryRecord,
  InquiryStatus,
  PaymentStatus,
  Product,
  ProductCategory,
  StoreSettings,
  TestimonialRecord,
  VisitorRecord,
} from '../types/store';

interface OwnerDashboardProps {
  apps: Product[];
  inquiries: InquiryRecord[];
  visitors: VisitorRecord[];
  testimonials: TestimonialRecord[];
  visitorSummary: {
    totalVisits: number;
    uniqueVisitors: number;
    namedClients: number;
    mobileCount?: number;
  };
  settings: StoreSettings;
  activeStoreOrigin: string;
  displayHostLabel: string;
  loading: boolean;
  onInquiryUpdated: (updated: InquiryRecord) => void;
  onInquiryDeleted: (id: string) => void;
  onAppPublished: (app: Product) => void;
  onAppUpdated: (app: Product) => void;
  onAppDeleted: (appId: string) => void;
  onTestimonialDeleted: (id: string) => void;
  onSettingsUpdated: (next: StoreSettings) => void;
  onRefreshVisitors: () => void;
  onClearVisitors: () => void;
}

type AdminTab = 'apps' | 'visitors' | 'orders' | 'reviews' | 'domain-settings';

const STATUS_OPTIONS: Array<'All' | InquiryStatus> = [
  'All',
  'New',
  'In Review',
  'Replied',
  'Completed',
];

const MILESTONE_STAGES = [
  'Requirements Locked',
  'UI/UX Prototype',
  'Core Build & Offline Sync',
  'Testing & QA',
  'Final Delivery',
];

const QUICK_REPLIES = [
  'Thank you for ordering with Mashal Tech. Easypaisa payment verified — your Tracking Key progress has been updated.',
  'Beta installer build is ready for testing. Message WhatsApp 0370-0818276 for direct installation help.',
  'Final production build and templates delivered. Your project is now at 100% completion.',
];

const ALL_CATEGORIES: Array<Exclude<ProductCategory, 'All'>> = [
  'Business & POS',
  'M Cloud & Sync',
  'Productivity',
  'Developer Tools',
  'Mobile Utilities',
  'Templates & Design',
];

const FALLBACK_ADMIN_PIN = '4820';
const DEFAULT_GMAIL = '6saddamhussain9@gmail.com';

export function OwnerDashboard({
  apps,
  inquiries,
  visitors,
  testimonials,
  visitorSummary,
  settings,
  activeStoreOrigin,
  displayHostLabel,
  loading,
  onInquiryUpdated,
  onInquiryDeleted,
  onAppPublished,
  onAppUpdated,
  onAppDeleted,
  onTestimonialDeleted,
  onSettingsUpdated,
  onRefreshVisitors,
  onClearVisitors,
}: OwnerDashboardProps) {
  const [activePin, setActivePin] = useState<string>(
    () => (settings.adminPin || FALLBACK_ADMIN_PIN).trim()
  );
  const [unlocked, setUnlocked] = useState(false);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState(false);

  // Gmail PIN Recovery State
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [savingRecoveryPin, setSavingRecoveryPin] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('apps');

  // Upload New App Form State
  const [uploadPlatform, setUploadPlatform] = useState<'PC' | 'Mobile' | 'Templates'>('PC');
  const [appName, setAppName] = useState('');
  const [osLabel, setOsLabel] = useState('Windows x64 (10 / 11)');
  const [fileFormat, setFileFormat] = useState('.EXE');
  const [fileSize, setFileSize] = useState('28.5 MB');
  const [version, setVersion] = useState('v1.0.0');
  const [appCategory, setAppCategory] = useState<Exclude<ProductCategory, 'All'>>('Business & POS');
  const [appPrice, setAppPrice] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [storedFileName, setStoredFileName] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [publishingApp, setPublishingApp] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedBanner, setPublishedBanner] = useState<Product | null>(null);

  // Edit Existing App Modal State
  const [editingApp, setEditingApp] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<Exclude<ProductCategory, 'All'>>('Business & POS');
  const [editOsLabel, setEditOsLabel] = useState('');
  const [editFileSize, setEditFileSize] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editFullDesc, setEditFullDesc] = useState('');
  const [editSpecsText, setEditSpecsText] = useState('');
  const [editFeatured, setEditFeatured] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // QR Preview Modal inside Admin
  const [adminQrApp, setAdminQrApp] = useState<Product | null>(null);

  // Orders & Keys State
  const [statusFilter, setStatusFilter] = useState<'All' | InquiryStatus>('All');
  const [orderQuery, setOrderQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(inquiries[0]?.id ?? null);
  const [progressInput, setProgressInput] = useState<number>(25);
  const [milestoneInput, setMilestoneInput] = useState<string>(MILESTONE_STAGES[0]);
  const [paymentStatusInput, setPaymentStatusInput] = useState<PaymentStatus>('Pending Verification');
  const [developerNoteInput, setDeveloperNoteInput] = useState<string>('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressSavedMsg, setProgressSavedMsg] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Store Settings & Live DNS Check State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({
    ...settings,
    contactEmail: settings.contactEmail || DEFAULT_GMAIL,
    adminPin: settings.adminPin || FALLBACK_ADMIN_PIN,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [checkingDns, setCheckingDns] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<{
    domain: string;
    resolvable: boolean;
    records: string[];
    errorCode?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const resolvedPin = (settings.adminPin || FALLBACK_ADMIN_PIN).trim();
    setActivePin(resolvedPin);
    setSettingsForm({
      ...settings,
      contactEmail: settings.contactEmail || DEFAULT_GMAIL,
      adminPin: resolvedPin,
    });
  }, [settings]);

  const registeredGmail = (
    settingsForm.contactEmail ||
    settings.contactEmail ||
    DEFAULT_GMAIL
  )
    .trim()
    .toLowerCase();

  const handleCheckDomainDns = async (domainToTest?: string) => {
    const targetDomain = (domainToTest ?? settingsForm.domain).trim();
    if (!targetDomain) return;
    setCheckingDns(true);
    try {
      const res = await fetch(`/api/domain-check?domain=${encodeURIComponent(targetDomain)}`);
      const data = await res.json();
      if (data && typeof data.resolvable === 'boolean') {
        setDnsStatus(data);
      }
    } catch {
      setDnsStatus({
        domain: targetDomain,
        resolvable: false,
        records: [],
        errorCode: 'CHECK_FAILED',
        message: 'Could not run DNS check right now.',
      });
    } finally {
      setCheckingDns(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.referenceCode.toLowerCase().includes(q) ||
        (item.trackingKey || '').toLowerCase().includes(q) ||
        (item.paymentReference || '').toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, orderQuery]);

  const activeInquiry =
    filteredInquiries.find((i) => i.id === selectedOrderId) ?? filteredInquiries[0] ?? null;

  useEffect(() => {
    if (activeInquiry) {
      setProgressInput(activeInquiry.progressPercent ?? 15);
      setMilestoneInput(activeInquiry.milestoneStage || MILESTONE_STAGES[0]);
      setPaymentStatusInput(activeInquiry.paymentStatus || 'Pending Verification');
      setDeveloperNoteInput(activeInquiry.developerNote || '');
      setProgressSavedMsg(null);
    }
  }, [activeInquiry?.id]);

  const handleUnlock = (e: FormEvent) => {
    e.preventDefault();
    if (pinAttempt.trim() === activePin.trim()) {
      setUnlocked(true);
      setPinError(false);
      setPinAttempt('');
    } else {
      setPinError(true);
    }
  };

  const handleGmailPinReset = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoveryMsg(null);

    const enteredEmail = recoveryEmailInput.trim().toLowerCase();
    const cleanNewPin = newPinInput.trim();

    if (!enteredEmail || enteredEmail !== registeredGmail) {
      setRecoveryError(
        `Gmail does not match the registered admin email (${registeredGmail}).`
      );
      return;
    }

    if (cleanNewPin.length < 4) {
      setRecoveryError('New PIN must be at least 4 characters.');
      return;
    }

    setSavingRecoveryPin(true);
    const updatedSettings: StoreSettings = {
      ...settingsForm,
      contactEmail: registeredGmail,
      adminPin: cleanNewPin,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      const data = await res.json();
      const savedNext: StoreSettings =
        res.ok && data.settings
          ? { ...updatedSettings, ...data.settings, adminPin: cleanNewPin }
          : updatedSettings;

      setActivePin(cleanNewPin);
      setSettingsForm(savedNext);
      onSettingsUpdated(savedNext);
      setRecoveryMsg('Gmail verified and PIN updated! You can now unlock with your new PIN.');
      setPinAttempt(cleanNewPin);
      setNewPinInput('');
      setRecoveryMode(false);
    } catch {
      // Even if backend is offline/stateless, update local session PIN so user isn't locked out
      setActivePin(cleanNewPin);
      setSettingsForm(updatedSettings);
      onSettingsUpdated(updatedSettings);
      setRecoveryMsg('Gmail verified and PIN updated for this session.');
      setPinAttempt(cleanNewPin);
      setNewPinInput('');
      setRecoveryMode(false);
    } finally {
      setSavingRecoveryPin(false);
    }
  };

  const handlePlatformSwitch = (plat: 'PC' | 'Mobile' | 'Templates') => {
    setUploadPlatform(plat);
    setPublishError(null);
    if (plat === 'PC') {
      setOsLabel('Windows x64 (10 / 11)');
      setFileFormat('.EXE');
      setFileSize('28.5 MB');
      setAppCategory('Business & POS');
    } else if (plat === 'Mobile') {
      setOsLabel('Android 10+ (.APK)');
      setFileFormat('.APK');
      setFileSize('24 MB');
      setAppCategory('Mobile Utilities');
    } else {
      setOsLabel('MS Office / PDF');
      setFileFormat('.XLSX / .DOCX');
      setFileSize('12 MB');
      setAppCategory('Templates & Design');
    }
  };

  const uploadBinaryFile = async (file: File) => {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed.');
    }
    return data as {
      storedFileName: string;
      originalFileName: string;
      fileSize: string;
      fileFormat: string;
    };
  };

  const handleFormFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPublishError(null);
    setUploadingFile(true);
    try {
      const uploaded = await uploadBinaryFile(file);
      setStoredFileName(uploaded.storedFileName);
      setOriginalFileName(uploaded.originalFileName);
      setFileSize(uploaded.fileSize);
      setFileFormat(uploaded.fileFormat);
      if (!appName.trim()) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        setAppName(cleanTitle);
      }
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAttachBinaryToExistingApp = async (
    appId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachingId(appId);
    try {
      const uploaded = await uploadBinaryFile(file);
      const patchRes = await fetch(`/api/apps/${encodeURIComponent(appId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploaded),
      });
      const data = await patchRes.json();
      if (patchRes.ok && data.app) {
        onAppUpdated(data.app);
      }
    } catch {
      // ignore silently
    } finally {
      setAttachingId(null);
    }
  };

  const handlePublishApp = async (e: FormEvent) => {
    e.preventDefault();
    setPublishError(null);
    setPublishedBanner(null);
    setPublishingApp(true);

    try {
      const specs = specsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appName,
          platform: uploadPlatform,
          osLabel,
          fileFormat,
          fileSize,
          version,
          category: appCategory,
          price: appPrice,
          downloadUrl,
          storedFileName,
          originalFileName,
          shortDesc,
          fullDesc: fullDesc || shortDesc,
          specs,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not publish app.');

      onAppPublished(data.app);
      setPublishedBanner(data.app);
      setAppName('');
      setShortDesc('');
      setFullDesc('');
      setSpecsText('');
      setDownloadUrl('');
      setStoredFileName('');
      setOriginalFileName('');
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Publishing failed.');
    } finally {
      setPublishingApp(false);
    }
  };

  const openEditModal = (app: Product) => {
    setEditingApp(app);
    setEditName(app.name);
    setEditVersion(app.version);
    setEditPrice(app.price);
    setEditCategory(app.category);
    setEditOsLabel(app.osLabel);
    setEditFileSize(app.fileSize);
    setEditShortDesc(app.shortDesc);
    setEditFullDesc(app.fullDesc);
    setEditSpecsText(app.specs.join(', '));
    setEditFeatured(Boolean(app.featured));
  };

  const handleSaveAppEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/apps/${encodeURIComponent(editingApp.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          version: editVersion,
          price: Number(editPrice) || 0,
          category: editCategory,
          osLabel: editOsLabel,
          fileSize: editFileSize,
          shortDesc: editShortDesc,
          fullDesc: editFullDesc,
          specs: editSpecsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          featured: editFeatured,
        }),
      });
      const data = await res.json();
      if (res.ok && data.app) {
        onAppUpdated(data.app);
        setEditingApp(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    const res = await fetch(`/api/apps/${encodeURIComponent(appId)}`, { method: 'DELETE' });
    if (res.ok) {
      onAppDeleted(appId);
    }
  };

  const handleSaveProgress = async () => {
    if (!activeInquiry) return;
    setSavingProgress(true);
    setProgressSavedMsg(null);
    setReplyError(null);

    try {
      const response = await fetch(`/api/inquiries/${activeInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressPercent: progressInput,
          milestoneStage: milestoneInput,
          paymentStatus: paymentStatusInput,
          developerNote: developerNoteInput,
          status: progressInput === 100 ? 'Completed' : 'In Review',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update project progress.');
      onInquiryUpdated(data.inquiry);
      setProgressSavedMsg('Progress, Easypaisa status & tracking key updated live.');
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Progress update failed.');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeInquiry || replyText.trim().length < 2) return;
    setSavingReply(true);
    setReplyError(null);

    try {
      const response = await fetch(`/api/inquiries/${activeInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage: replyText.trim(),
          replyAuthor: `${settings.easypaisaAccountName} · Mashal Tech`,
          status: 'Replied',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reply.');
      onInquiryUpdated(data.inquiry);
      setReplyText('');
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Unable to save reply.');
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      onInquiryDeleted(id);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      onTestimonialDeleted(id);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedMsg(null);

    const nextPin = (settingsForm.adminPin || '').trim() || FALLBACK_ADMIN_PIN;
    const payload: StoreSettings = {
      ...settingsForm,
      contactEmail: (settingsForm.contactEmail || DEFAULT_GMAIL).trim(),
      adminPin: nextPin,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const merged: StoreSettings =
        res.ok && data.settings
          ? { ...payload, ...data.settings, adminPin: data.settings.adminPin || nextPin }
          : payload;

      setActivePin(merged.adminPin);
      setSettingsForm(merged);
      onSettingsUpdated(merged);
      setSettingsSavedMsg(`Settings saved live. Active Admin PIN is now "${merged.adminPin}".`);
    } finally {
      setSavingSettings(false);
    }
  };

  const copyText = (slug: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(slug).catch(() => {});
    }
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 1500);
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        {!recoveryMode ? (
          <form
            onSubmit={handleUnlock}
            className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-950 text-white">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-stone-950">Admin Console Locked</h1>
            <p className="mt-1 text-xs text-stone-500">
              Owner access only. Enter your Admin PIN to manage apps, visitors, and orders.
            </p>
            <label htmlFor="admin-pin-input" className="sr-only">
              Admin PIN
            </label>
            <input
              id="admin-pin-input"
              type="password"
              value={pinAttempt}
              onChange={(e) => setPinAttempt(e.target.value)}
              placeholder="Enter Admin PIN"
              className="mt-5 h-11 w-full rounded-lg border border-stone-300 px-3 text-center font-mono text-sm tracking-widest text-stone-950"
            />
            {pinError && <p className="mt-2 text-xs font-medium text-red-600">Incorrect PIN.</p>}
            {recoveryMsg && (
              <p className="mt-2 text-xs font-medium text-emerald-700">{recoveryMsg}</p>
            )}
            <button
              type="submit"
              className="mt-4 min-h-[42px] w-full rounded-lg bg-stone-950 px-4 py-2 text-xs font-semibold text-white hover:bg-[#E85D22]"
            >
              Unlock Admin Console
            </button>
            <button
              type="button"
              onClick={() => {
                setRecoveryMode(true);
                setRecoveryError(null);
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Forgot PIN? Reset with Gmail</span>
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleGmailPinReset}
            className="space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-stone-950">
                  Gmail PIN Recovery
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryMode(false)}
                className="rounded-lg border border-stone-200 p-1 text-stone-500 hover:text-stone-950"
                aria-label="Back to PIN login"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Confirm your registered Gmail address to set a new Admin PIN immediately.
            </p>

            <div>
              <label htmlFor="recovery-gmail" className="block text-xs font-semibold text-stone-700">
                Registered Gmail Address
              </label>
              <input
                id="recovery-gmail"
                type="email"
                required
                value={recoveryEmailInput}
                onChange={(e) => setRecoveryEmailInput(e.target.value)}
                placeholder={registeredGmail}
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
              />
            </div>

            <div>
              <label htmlFor="recovery-new-pin" className="block text-xs font-semibold text-stone-700">
                New Admin PIN
              </label>
              <input
                id="recovery-new-pin"
                type="text"
                required
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Enter new PIN (4+ chars)"
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
              />
            </div>

            {recoveryError && <p className="text-xs font-medium text-red-600">{recoveryError}</p>}

            <button
              type="submit"
              disabled={savingRecoveryPin}
              className="min-h-[42px] w-full rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369a1]"
            >
              {savingRecoveryPin ? 'Updating PIN...' : 'Verify Gmail & Set New PIN'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Admin Header + Clean 5-Tab Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="font-mono text-xs font-medium text-[#0284C7]">
              {displayHostLabel} · Full Store Maintenance &amp; Analytics
            </p>
            <button
              type="button"
              onClick={() => setUnlocked(false)}
              className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:border-stone-950 hover:text-stone-950"
            >
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>Lock Console</span>
            </button>
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-stone-950">
            Mashal Tech Admin Studio
          </h1>
        </div>

        <div className="flex flex-wrap rounded-xl border border-stone-200 bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'apps'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white/70 hover:text-stone-950'
            }`}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Apps ({apps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visitors')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'visitors'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white/70 hover:text-stone-950'
            }`}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Visitors ({visitorSummary.totalVisits})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'orders'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white/70 hover:text-stone-950'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Orders ({inquiries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white/70 hover:text-stone-950'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reviews ({testimonials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('domain-settings')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'domain-settings'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white/70 hover:text-stone-950'
            }`}
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Domain &amp; Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPS & UPLOAD (AUTO QR + FULL EDIT + DELETE) */}
      {activeTab === 'apps' && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form
            onSubmit={handlePublishApp}
            className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-950">
                  Publish New App &amp; Auto-Generate QR
                </h2>
                <p className="text-xs text-stone-500">
                  Upload .EXE, .APK, or Templates — an automatic shareable QR code is created immediately.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs font-semibold">
                {(['PC', 'Mobile', 'Templates'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => handlePlatformSwitch(plat)}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                      uploadPlatform === plat ? 'bg-stone-950 text-white' : 'text-stone-600'
                    }`}
                  >
                    {plat === 'PC' && <Monitor className="h-3 w-3" aria-hidden="true" />}
                    {plat === 'Mobile' && <Smartphone className="h-3 w-3" aria-hidden="true" />}
                    <span>{plat}</span>
                  </button>
                ))}
              </div>
            </div>

            {publishedBanner && (
              <div
                data-testid="published-qr-banner"
                className="flex flex-col items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row"
              >
                <QrCodeSvg
                  value={buildAppShareUrl(publishedBanner.id, activeStoreOrigin)}
                  size={112}
                  showActions
                  downloadFileName={`${publishedBanner.id}-qr.png`}
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>App Published &amp; QR Code Ready!</span>
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-stone-950">
                    {publishedBanner.name} ({publishedBanner.sku})
                  </h3>
                  <p className="mt-1 text-xs text-emerald-900">
                    Save this QR code image or copy its link so users can scan &amp; share Mashal Tech anywhere.
                  </p>
                  <p className="mt-1.5 truncate rounded bg-white px-2.5 py-1 font-mono text-[11px] text-stone-600">
                    {isInternalPreviewHost(activeStoreOrigin)
                      ? `Share QR Ready (${publishedBanner.sku}) · Click Copy Link`
                      : buildAppShareUrl(publishedBanner.id, activeStoreOrigin)}
                  </p>
                </div>
              </div>
            )}

            {/* Binary Upload Dropzone */}
            <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 text-center">
              <label
                htmlFor="pub-binary-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-[#009FE3]" aria-hidden="true" />
                    <span className="text-xs font-semibold text-stone-800">
                      Uploading package to Mashal Tech server...
                    </span>
                  </>
                ) : storedFileName ? (
                  <>
                    <FileCheck2 className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                    <span className="text-xs font-bold text-emerald-900">
                      Attached Binary: {originalFileName} ({fileSize})
                    </span>
                    <span className="text-[11px] text-emerald-700">Click to replace file</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-[#E85D22]" aria-hidden="true" />
                    <span className="text-xs font-bold text-stone-950">
                      Select {uploadPlatform} Package File ({fileFormat})
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Up to 60 MB direct upload · Auto-detects format &amp; file size
                    </span>
                  </>
                )}
                <input
                  id="pub-binary-file"
                  type="file"
                  accept=".exe,.msi,.dmg,.appimage,.apk,.aab,.zip,.rar,.xlsx,.docx,.pdf,.txt"
                  onChange={handleFormFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pub-app-name" className="block text-xs font-semibold text-stone-700">
                  Software / App Name *
                </label>
                <input
                  id="pub-app-name"
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g., Mashal Khata Pro"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950"
                />
              </div>

              <div>
                <label htmlFor="pub-category" className="block text-xs font-semibold text-stone-700">
                  Category
                </label>
                <select
                  id="pub-category"
                  value={appCategory}
                  onChange={(e) => setAppCategory(e.target.value as Exclude<ProductCategory, 'All'>)}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs font-medium text-stone-900"
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pub-os" className="block text-xs font-semibold text-stone-700">
                  Target OS
                </label>
                <input
                  id="pub-os"
                  type="text"
                  value={osLabel}
                  onChange={(e) => setOsLabel(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="pub-format" className="block text-xs font-semibold text-stone-700">
                    Format
                  </label>
                  <input
                    id="pub-format"
                    type="text"
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-2 font-mono text-xs text-stone-950"
                  />
                </div>
                <div>
                  <label htmlFor="pub-ver" className="block text-xs font-semibold text-stone-700">
                    Version
                  </label>
                  <input
                    id="pub-ver"
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-2 font-mono text-xs text-stone-950"
                  />
                </div>
                <div>
                  <label htmlFor="pub-price" className="block text-xs font-semibold text-stone-700">
                    Price ($)
                  </label>
                  <input
                    id="pub-price"
                    type="number"
                    min={0}
                    value={appPrice}
                    onChange={(e) => setAppPrice(Math.max(0, Number(e.target.value)))}
                    className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-2 font-mono text-xs tabular-nums text-stone-950"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pub-size" className="block text-xs font-semibold text-stone-700">
                  Package Size
                </label>
                <input
                  id="pub-size"
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="pub-url" className="block text-xs font-semibold text-stone-700">
                  External Release Link (optional)
                </label>
                <input
                  id="pub-url"
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://github.com/SaddamHussain322/..."
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pub-short" className="block text-xs font-semibold text-stone-700">
                Short Summary *
              </label>
              <input
                id="pub-short"
                type="text"
                required
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Concise description shown on the store card..."
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-950"
              />
            </div>

            <div>
              <label htmlFor="pub-specs" className="block text-xs font-semibold text-stone-700">
                Key Features (comma-separated)
              </label>
              <input
                id="pub-specs"
                type="text"
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
                placeholder="Offline SQLite, Barcode Print, M Cloud Sync"
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
              />
            </div>

            {publishError && <p className="text-xs font-medium text-red-600">{publishError}</p>}

            <button
              type="submit"
              disabled={publishingApp || uploadingFile}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E85D22] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#cf4e18] disabled:opacity-60"
            >
              {publishingApp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Publishing &amp; Creating QR...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Publish App &amp; Generate QR Code</span>
                </>
              )}
            </button>
          </form>

          {/* Right: Full Store Inventory Maintenance */}
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-5">
            <h2 className="font-display text-lg font-bold text-stone-950">
              Manage All Store Apps ({apps.length})
            </h2>
            <p className="text-xs text-stone-500">
              Edit details, attach installers, download Share QRs, or remove apps anytime.
            </p>
            <div className="max-h-[700px] space-y-2.5 overflow-y-auto pr-1 pt-1">
              {apps.map((item) => (
                <div
                  key={item.id}
                  data-testid="admin-app-row"
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500">
                        <span className="font-semibold text-stone-700">{item.platform}</span>
                        <span>·</span>
                        <span>{item.version}</span>
                        <span>·</span>
                        <span>{item.fileFormat}</span>
                      </div>
                      <p className="mt-0.5 truncate font-display text-sm font-bold text-stone-950">
                        {item.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs font-semibold text-[#E85D22] tabular-nums">
                        {item.price === 0 ? 'Free' : `$${item.price.toLocaleString()}`} ·{' '}
                        <span className="text-stone-600">
                          {item.downloads === 1 ? '1 download' : `${item.downloads} downloads`}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdminQrApp(item)}
                        className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-700 hover:border-stone-950 hover:text-stone-950"
                        aria-label={`View QR code for ${item.name}`}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-700 hover:border-[#009FE3] hover:text-[#009FE3]"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteApp(item.id)}
                        className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-500 hover:border-red-300 hover:text-red-600"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-stone-200/80 pt-2 text-[11px]">
                    <span className="truncate font-mono text-stone-500">
                      {item.storedFileName
                        ? `File: ${item.originalFileName || item.storedFileName}`
                        : 'Manifest / Link'}
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-stone-300 bg-white px-2 py-0.5 font-semibold text-stone-800 hover:border-stone-950">
                      <Upload className="h-3 w-3" aria-hidden="true" />
                      <span>{attachingId === item.id ? 'Uploading...' : 'Attach File'}</span>
                      <input
                        type="file"
                        accept=".exe,.msi,.dmg,.apk,.aab,.zip,.xlsx,.docx,.pdf,.txt"
                        onChange={(e) => handleAttachBinaryToExistingApp(item.id, e)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISITOR & CLIENT NAME ANALYTICS */}
      {activeTab === 'visitors' && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="text-xs font-medium text-stone-500">Total Store Visits</span>
              <p
                data-testid="stat-total-visits"
                className="mt-1 font-mono text-3xl font-bold text-stone-950 tabular-nums"
              >
                {visitorSummary.totalVisits}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="text-xs font-medium text-stone-500">Unique Visitors</span>
              <p className="mt-1 font-mono text-3xl font-bold text-[#0284C7] tabular-nums">
                {visitorSummary.uniqueVisitors}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="text-xs font-medium text-stone-500">Named Clients Recorded</span>
              <p
                data-testid="stat-named-clients"
                className="mt-1 font-mono text-3xl font-bold text-[#E85D22] tabular-nums"
              >
                {visitorSummary.namedClients}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="text-xs font-medium text-stone-500">Mobile Visitors</span>
              <p className="mt-1 font-mono text-3xl font-bold text-emerald-700 tabular-nums">
                {visitorSummary.mobileCount ?? visitors.filter((v) => v.device === 'Mobile').length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-950">
                  Client &amp; Visitor Activity Log
                </h2>
                <p className="text-xs text-stone-500">
                  Automatically captures client names when they check in via the top bar or submit an order/inquiry.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefreshVisitors}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:border-stone-950"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={onClearVisitors}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear Log</span>
                </button>
              </div>
            </div>

            {visitors.length === 0 ? (
              <p className="py-10 text-center text-sm text-stone-500">No visitor activity recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500">
                      <th className="py-2.5 pr-4 font-semibold">Client / Visitor Name</th>
                      <th className="py-2.5 pr-4 font-semibold">Device</th>
                      <th className="py-2.5 pr-4 font-semibold">Last View</th>
                      <th className="py-2.5 pr-4 font-semibold">Last Action</th>
                      <th className="py-2.5 pr-4 font-semibold">Visits</th>
                      <th className="py-2.5 font-semibold">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {visitors.map((v) => {
                      const isNamed = v.visitorName && v.visitorName !== 'Guest';
                      return (
                        <tr key={v.id} data-testid="visitor-row">
                          <td className="py-3 pr-4">
                            <span
                              className={`font-semibold ${
                                isNamed ? 'text-stone-950' : 'text-stone-400 italic'
                              }`}
                            >
                              {v.visitorName || 'Guest'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-mono text-stone-600">{v.device}</td>
                          <td className="py-3 pr-4 text-stone-700">{v.lastView}</td>
                          <td className="py-3 pr-4 text-stone-600">{v.lastAction}</td>
                          <td className="py-3 pr-4 font-mono font-semibold text-stone-900 tabular-nums">
                            {v.visitCount}
                          </td>
                          <td className="py-3 font-mono text-[11px] text-stone-500">
                            {new Date(v.lastVisitedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS, EASYPAISA VERIFICATION & TRACKING KEYS */}
      {activeTab === 'orders' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-stone-950 text-white'
                        : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-80">
              <label htmlFor="dashboard-search" className="sr-only">
                Search orders, tracking key, customer
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <input
                id="dashboard-search"
                type="search"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Search client, MT-KEY, Easypaisa TID..."
                className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-950 placeholder:text-stone-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
              Loading customer orders...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-600">
              No orders or inquiries match the current filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-5">
                {filteredInquiries.map((item) => {
                  const selected = activeInquiry?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedOrderId(item.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-stone-950 bg-white shadow-xs'
                          : 'border-stone-200 bg-white/80 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-semibold text-[#E85D22]">
                          {item.trackingKey || item.referenceCode}
                        </span>
                        <span className="font-mono font-semibold text-stone-900 tabular-nums">
                          {item.progressPercent}% · {item.status}
                        </span>
                      </div>
                      <h3 className="mt-1.5 line-clamp-1 font-display text-sm font-bold text-stone-950">
                        {item.subject}
                      </h3>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-stone-600">
                        <span className="truncate font-medium">{item.customerName}</span>
                        <span className="shrink-0 font-mono text-[11px] text-emerald-700">
                          {item.paymentMethod || item.source}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeInquiry && (
                <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-7">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#E85D22]">
                          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                          {activeInquiry.trackingKey || activeInquiry.referenceCode}
                        </span>
                        <span>·</span>
                        <span>{activeInquiry.source}</span>
                      </div>
                      <h2 className="mt-1.5 font-display text-xl font-bold text-stone-950">
                        {activeInquiry.subject}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteInquiry(activeInquiry.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Delete Order</span>
                    </button>
                  </div>

                  {/* Client Contact & Easypaisa Verification Summary */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs sm:grid-cols-3">
                    <div>
                      <span className="block text-[10px] uppercase text-stone-400">Client</span>
                      <span className="font-semibold text-stone-950">{activeInquiry.customerName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-stone-400">WhatsApp / Phone</span>
                      <span className="font-mono text-stone-800">
                        {activeInquiry.whatsappNumber || activeInquiry.mobileNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-stone-400">Country / Co.</span>
                      <span className="text-stone-800">
                        {activeInquiry.country || '—'} · {activeInquiry.companyName || 'Personal'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-stone-400">Payment Channel</span>
                      <span className="font-semibold text-emerald-800">
                        {activeInquiry.paymentMethod || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-stone-400">
                        Sender Account / TID
                      </span>
                      <span className="font-mono text-stone-800">
                        {activeInquiry.senderAccount ? `${activeInquiry.senderAccount} · ` : ''}
                        {activeInquiry.paymentReference || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-stone-400">Amount</span>
                      <span className="font-mono font-bold text-stone-950 tabular-nums">
                        ${activeInquiry.amountPaid ?? activeInquiry.quotedAmount ?? 0}{' '}
                        <span className="text-[10px] font-normal text-stone-500">
                          (PKR{' '}
                          {formatPkrEstimate(
                            activeInquiry.amountPaid ?? activeInquiry.quotedAmount ?? 0,
                            settings.usdToPkrRate
                          ).toLocaleString()}
                          )
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="whitespace-pre-line rounded-xl bg-stone-50 p-4 text-xs leading-relaxed text-stone-700">
                    {activeInquiry.message}
                  </p>

                  {/* 0-100% Tracking Key Progress Control */}
                  <div className="space-y-4 rounded-xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Update Client Progress % &amp; Payment Status
                      </span>
                      <span className="font-mono text-sm font-bold text-[#E85D22] tabular-nums">
                        {progressInput}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={progressInput}
                      onChange={(e) => setProgressInput(Number(e.target.value))}
                      aria-label="Project completion percentage"
                      className="w-full accent-[#E85D22]"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-stage" className="block text-[11px] font-semibold text-stone-600">
                          Current Milestone
                        </label>
                        <select
                          id="admin-stage"
                          value={milestoneInput}
                          onChange={(e) => setMilestoneInput(e.target.value)}
                          className="mt-1 h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-900"
                        >
                          {MILESTONE_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="admin-pay-status" className="block text-[11px] font-semibold text-stone-600">
                          Easypaisa / Payment Status
                        </label>
                        <select
                          id="admin-pay-status"
                          value={paymentStatusInput}
                          onChange={(e) => setPaymentStatusInput(e.target.value as PaymentStatus)}
                          className="mt-1 h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-900"
                        >
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Deposit Paid">Deposit Paid</option>
                          <option value="Paid in Full">Paid in Full</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="admin-dev-note" className="block text-[11px] font-semibold text-stone-600">
                        Developer Note (Visible when client enters Tracking Key)
                      </label>
                      <input
                        id="admin-dev-note"
                        type="text"
                        value={developerNoteInput}
                        onChange={(e) => setDeveloperNoteInput(e.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleSaveProgress}
                        disabled={savingProgress}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-stone-950 px-4 py-2 text-xs font-semibold text-white hover:bg-[#009FE3]"
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{savingProgress ? 'Saving...' : 'Save Live Progress'}</span>
                      </button>
                      {progressSavedMsg && (
                        <span className="text-xs font-medium text-emerald-700">{progressSavedMsg}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Replies */}
                  <form onSubmit={handleSendReply} className="space-y-3 border-t border-stone-100 pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_REPLIES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(tmpl)}
                          className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-700 hover:border-stone-400"
                        >
                          Quick Reply {idx + 1}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <label htmlFor="admin-reply-box" className="sr-only">
                        Reply to client
                      </label>
                      <input
                        id="admin-reply-box"
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write update message for this client..."
                        className="h-10 flex-1 rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                      />
                      <button
                        type="submit"
                        disabled={savingReply}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#E85D22] px-4 text-xs font-semibold text-white hover:bg-[#cf4e18]"
                      >
                        <Send className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Send</span>
                      </button>
                    </div>
                    {replyError && <p className="text-xs text-red-600">{replyError}</p>}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MASHALTECH.EU.ORG LIVE LAUNCH KIT + STORE MAINTENANCE SETTINGS */}
      {activeTab === 'domain-settings' && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Store Maintenance Settings Form */}
          <form
            onSubmit={handleSaveSettings}
            className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-6"
          >
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-display text-xl font-bold text-stone-950">
                Store Maintenance &amp; Easypaisa Settings
              </h2>
              <p className="text-xs text-stone-500">
                Control your store branding, Gmail recovery, Easypaisa account, and Admin PIN.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="set-store-name" className="block text-xs font-semibold text-stone-700">
                  Store Name
                </label>
                <input
                  id="set-store-name"
                  type="text"
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="set-domain" className="block text-xs font-semibold text-stone-700">
                  Target Custom Domain
                </label>
                <div className="mt-1 flex gap-1.5">
                  <input
                    id="set-domain"
                    type="text"
                    value={settingsForm.domain}
                    onChange={(e) => setSettingsForm({ ...settingsForm, domain: e.target.value })}
                    className="mt-0 h-10 min-w-0 flex-1 rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckDomainDns()}
                    disabled={checkingDns}
                    className="h-10 shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-3 text-xs font-semibold text-stone-900 hover:border-stone-950"
                  >
                    {checkingDns ? 'Checking...' : 'Check DNS'}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
              <input
                type="checkbox"
                checked={Boolean(settingsForm.useCustomDomainForQr)}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, useCustomDomainForQr: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#0284C7]"
              />
              <span>
                <strong className="text-stone-950">Use Custom Domain for QR Codes &amp; Share Links</strong> — Keep unchecked while{' '}
                <span className="font-mono">{settingsForm.domain}</span> shows NXDOMAIN so all QR codes open your{' '}
                <strong className="text-emerald-700">working live URL</strong>. Enable after DNS goes live.
              </span>
            </label>

            <div>
              <label htmlFor="set-banner" className="block text-xs font-semibold text-stone-700">
                Storefront Announcement Banner
              </label>
              <input
                id="set-banner"
                type="text"
                value={settingsForm.announcementBanner}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, announcementBanner: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="set-ep-num" className="block text-xs font-semibold text-stone-700">
                  Easypaisa Account Number
                </label>
                <input
                  id="set-ep-num"
                  type="text"
                  value={settingsForm.easypaisaNumber}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, easypaisaNumber: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="set-ep-name" className="block text-xs font-semibold text-stone-700">
                  Easypaisa Account Title
                </label>
                <input
                  id="set-ep-name"
                  type="text"
                  value={settingsForm.easypaisaAccountName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, easypaisaAccountName: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="set-rate" className="block text-xs font-semibold text-stone-700">
                  USD to PKR Rate (for Easypaisa)
                </label>
                <input
                  id="set-rate"
                  type="number"
                  min={100}
                  value={settingsForm.usdToPkrRate}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      usdToPkrRate: Math.max(100, Number(e.target.value)),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs tabular-nums text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="set-pin" className="block text-xs font-semibold text-stone-700">
                  Admin Lock PIN (Required)
                </label>
                <input
                  id="set-pin"
                  type="text"
                  required
                  value={settingsForm.adminPin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                  placeholder="e.g. 4820"
                  className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>
            </div>

            <div>
              <label htmlFor="set-gmail" className="block text-xs font-semibold text-stone-700">
                Admin Recovery Gmail
              </label>
              <input
                id="set-gmail"
                type="email"
                required
                value={settingsForm.contactEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                placeholder="6saddamhussain9@gmail.com"
                className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
              />
            </div>

            <label className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
              <input
                type="checkbox"
                checked={settingsForm.maintenanceMode}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })
                }
                className="h-4 w-4 accent-[#E85D22]"
              />
              <span>
                <strong className="text-stone-950">Maintenance Mode Notice</strong> — Display a store maintenance banner to visitors while updating releases.
              </span>
            </label>

            {settingsSavedMsg && (
              <p className="text-xs font-semibold text-emerald-700">{settingsSavedMsg}</p>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-stone-950 px-5 py-2 text-xs font-semibold text-white hover:bg-[#E85D22]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Store Settings'}</span>
            </button>
          </form>

          {/* Live Domain Status + Launch Kit for mashaltech.eu.org */}
          <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-6">
            <div className="flex items-start gap-2.5 border-b border-stone-100 pb-3">
              <Globe className="mt-0.5 h-5 w-5 text-[#E85D22]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl font-bold text-stone-950">
                  Live Store URL &amp; Domain Setup ($0/year)
                </h2>
                <p className="text-xs text-stone-500">
                  Your app store is live right now at your hosted URL. Registering{' '}
                  <strong className="font-mono text-stone-900">mashaltech.eu.org</strong> requires completing steps 1–3 in your own Cloudflare, nic.eu.org, and Vercel accounts.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-900">Working Storefront Link (Active Now)</span>
                <button
                  type="button"
                  onClick={() => copyText(activeStoreOrigin)}
                  className="rounded border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900"
                >
                  {copiedSlug === activeStoreOrigin ? 'Copied Link' : 'Copy Live Link'}
                </button>
              </div>
              <p className="mt-1.5 break-all font-mono text-[11px] text-emerald-950">
                {isInternalPreviewHost(activeStoreOrigin)
                  ? 'Live Hosted Storefront Ready (Preview host hidden · Use Copy Live Link)'
                  : activeStoreOrigin}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-stone-900">
                  Test Domain DNS: <span className="font-mono">{settingsForm.domain}</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsForm({ ...settingsForm, domain: 'mashal-tech-store.vercel.app' });
                      handleCheckDomainDns('mashal-tech-store.vercel.app');
                    }}
                    className="rounded border border-stone-300 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 hover:border-stone-950"
                  >
                    Use Vercel URL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheckDomainDns(settingsForm.domain)}
                    disabled={checkingDns}
                    className="rounded bg-stone-950 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#E85D22]"
                  >
                    {checkingDns ? 'Testing...' : 'Verify Live DNS'}
                  </button>
                </div>
              </div>

              {dnsStatus && (
                <div
                  data-testid="dns-check-result"
                  className={`mt-2.5 rounded-lg border px-3 py-2 text-[11px] ${
                    dnsStatus.resolvable
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-amber-200 bg-amber-50 text-amber-950'
                  }`}
                >
                  <p className="font-bold">
                    {dnsStatus.resolvable
                      ? `Live & Resolving (${dnsStatus.domain})`
                      : `Not Reachable Yet (${dnsStatus.errorCode || 'NXDOMAIN'})`}
                  </p>
                  <p className="mt-0.5">{dnsStatus.message}</p>
                </div>
              )}
            </div>

            <ol className="space-y-3 text-xs leading-relaxed text-stone-700">
              <li className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
                <strong className="block text-stone-950">
                  1. Add mashaltech.eu.org to Free Cloudflare DNS
                </strong>
                Create a free account at <span className="font-mono">dash.cloudflare.com</span>, add{' '}
                <span className="font-mono font-semibold">mashaltech.eu.org</span>, and create this CNAME record:
                <div className="mt-2 flex items-center justify-between rounded-lg bg-stone-950 px-3 py-2 font-mono text-[11px] text-sky-300">
                  <span>CNAME @ &rarr; cname.vercel-dns.com</span>
                  <button
                    type="button"
                    onClick={() => copyText('cname.vercel-dns.com')}
                    className="rounded border border-stone-700 px-2 py-0.5 text-[10px] text-white"
                  >
                    {copiedSlug === 'cname.vercel-dns.com' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </li>

              <li className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
                <strong className="block text-stone-950">
                  2. Register mashaltech.eu.org on nic.eu.org ($0 Forever)
                </strong>
                Sign up at <span className="font-mono">nic.eu.org/arf/en/contact/create</span>, choose{' '}
                <span className="font-mono font-semibold">mashaltech.eu.org</span>, and paste your two assigned Cloudflare nameservers (e.g.,{' '}
                <span className="font-mono">ns1.cloudflare.com</span>).
              </li>

              <li className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
                <strong className="block text-stone-950">
                  3. Bind Custom Domain in Vercel &amp; Publish GitHub Code
                </strong>
                In <span className="font-mono">SaddamHussain322/mashal-tech-store</span> on Vercel &rarr;{' '}
                <strong>Settings &rarr; Domains</strong>, add{' '}
                <span className="font-mono font-semibold">mashaltech.eu.org</span> (your free{' '}
                <span className="font-mono">mashal-tech-store.vercel.app</span> URL is already active).
              </li>
            </ol>

            <div className="border-t border-stone-100 pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Instant $0 Alternatives (Same-Day Live)
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FREE_DOMAIN_OPTIONS.slice(0, 2).map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="block font-semibold text-stone-900">{opt.platform}</span>
                      <span className="font-mono text-[11px] text-[#0284C7]">{opt.exampleUrl}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLIENT TESTIMONIALS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="font-display text-xl font-bold text-stone-950">
              Manage Client Testimonials ({testimonials.length})
            </h2>
            <p className="text-xs text-stone-500">
              Reviews submitted by past customers appear immediately on your storefront. Remove any unwanted review below.
            </p>
          </div>
          {testimonials.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">No client testimonials yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-stone-100">
              {testimonials.map((t) => (
                <div key={t.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-stone-950">{t.clientName}</span>
                      <span className="text-stone-400">·</span>
                      <span className="text-stone-600">{t.companyOrRole}</span>
                      <span className="text-stone-400">·</span>
                      <span className="font-mono font-semibold text-amber-600">{t.rating}★</span>
                      <span className="text-stone-400">·</span>
                      <span className="font-mono text-[11px] text-[#0284C7]">{t.projectOrApp}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone-700">“{t.quote}”</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTestimonial(t.id)}
                    aria-label={`Delete review by ${t.clientName}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit App Modal */}
      {editingApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${editingApp.name}`}
        >
          <form
            onSubmit={handleSaveAppEdit}
            className="relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-display text-lg font-bold text-stone-950">Edit App Listing</h3>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-stone-950"
                aria-label="Close edit modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-app-name" className="block text-xs font-semibold text-stone-700">
                  App Name
                </label>
                <input
                  id="edit-app-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="edit-app-cat" className="block text-xs font-semibold text-stone-700">
                  Category
                </label>
                <select
                  id="edit-app-cat"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Exclude<ProductCategory, 'All'>)}
                  className="mt-1 h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-900"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-app-ver" className="block text-xs font-semibold text-stone-700">
                  Version
                </label>
                <input
                  id="edit-app-ver"
                  type="text"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="edit-app-price" className="block text-xs font-semibold text-stone-700">
                  Price ($ · 0=Free)
                </label>
                <input
                  id="edit-app-price"
                  type="number"
                  min={0}
                  value={editPrice}
                  onChange={(e) => setEditPrice(Math.max(0, Number(e.target.value)))}
                  className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs tabular-nums text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="edit-app-os" className="block text-xs font-semibold text-stone-700">
                  OS Compatibility
                </label>
                <input
                  id="edit-app-os"
                  type="text"
                  value={editOsLabel}
                  onChange={(e) => setEditOsLabel(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
                />
              </div>
              <div>
                <label htmlFor="edit-app-size" className="block text-xs font-semibold text-stone-700">
                  Package Size
                </label>
                <input
                  id="edit-app-size"
                  type="text"
                  value={editFileSize}
                  onChange={(e) => setEditFileSize(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 font-mono text-xs text-stone-950"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-app-short" className="block text-xs font-semibold text-stone-700">
                Summary Description
              </label>
              <input
                id="edit-app-short"
                type="text"
                value={editShortDesc}
                onChange={(e) => setEditShortDesc(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
              />
            </div>

            <div>
              <label htmlFor="edit-app-specs" className="block text-xs font-semibold text-stone-700">
                Features (comma-separated)
              </label>
              <input
                id="edit-app-specs"
                type="text"
                value={editSpecsText}
                onChange={(e) => setEditSpecsText(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-stone-300 px-3 text-xs text-stone-950"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={editFeatured}
                onChange={(e) => setEditFeatured(e.target.checked)}
                className="h-4 w-4 accent-[#E85D22]"
              />
              <span>Pin as Featured App in Storefront</span>
            </label>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950 px-4 py-2 text-xs font-semibold text-white hover:bg-[#E85D22]"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{savingEdit ? 'Saving...' : 'Save App Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin QR Share Modal */}
      {adminQrApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`QR Code for ${adminQrApp.name}`}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setAdminQrApp(null)}
              className="absolute right-4 top-4 rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-stone-950"
              aria-label="Close QR preview"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-lg font-bold text-stone-950">{adminQrApp.name}</h3>
            <p className="mt-1 text-xs text-stone-500">
              Share this QR code so users scan straight into{' '}
              <span className="font-mono">{displayHostLabel}</span>
            </p>
            <div className="my-5 flex justify-center">
              <QrCodeSvg
                value={buildAppShareUrl(adminQrApp.id, activeStoreOrigin)}
                size={180}
                showActions
                downloadFileName={`${adminQrApp.id}-qr.png`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
