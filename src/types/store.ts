export type AppPlatformFilter = 'All' | 'PC' | 'Mobile' | 'Templates';

export type ProductCategory =
  | 'All'
  | 'Business & POS'
  | 'M Cloud & Sync'
  | 'Productivity'
  | 'Developer Tools'
  | 'Mobile Utilities'
  | 'Templates & Design';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc';

export type PriceBracket = 'all' | 'free' | 'under-100' | '100-500' | 'over-500';

export type AppIconTheme = 'cyan' | 'orange' | 'emerald' | 'indigo' | 'slate';

export interface Product {
  id: string;
  sku: string;
  name: string;
  platform: Exclude<AppPlatformFilter, 'All'>;
  osLabel: string;
  fileFormat: string;
  fileSize: string;
  version: string;
  category: Exclude<ProductCategory, 'All'>;
  price: number;
  rating: number;
  reviewCount: number;
  downloads: number;
  image: string;
  iconTheme?: AppIconTheme;
  verifiedLabel?: string;
  shortDesc: string;
  fullDesc: string;
  specs: string[];
  tags: string[];
  availability: 'Instant Download' | 'License Key' | 'Coming Soon';
  featured?: boolean;
  downloadUrl?: string;
  storedFileName?: string;
  originalFileName?: string;
  shareUrl?: string;
}

export interface FilterState {
  query: string;
  platform: AppPlatformFilter;
  category: ProductCategory;
  priceBracket: PriceBracket;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number;
  sortBy: SortOption;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: 'Architecture' | 'M Cloud' | 'Design Craft' | 'Deployment';
  publishedAt: string;
  readTime: string;
  author: string;
  authorRole: string;
  image: string;
  excerpt: string;
  content: string[];
}

export type InquiryStatus = 'New' | 'In Review' | 'Replied' | 'Completed';

export type InquirySource =
  | 'Contact Form'
  | 'Custom App Order'
  | 'Assignment & Service'
  | 'Custom Design Order'
  | 'App Store Purchase';

export type PaymentMethod =
  | 'Easypaisa'
  | 'JazzCash'
  | 'Bank Transfer / IBAN'
  | 'Credit / Debit Card'
  | 'Payoneer / Wise';

export type PaymentStatus = 'Pending Verification' | 'Deposit Paid' | 'Paid in Full';

export interface InquiryReply {
  id: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface ClientContactDetails {
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  mobileNumber: string;
  whatsappNumber: string;
  country: string;
  companyName: string;
}

export interface InquiryRecord {
  id: string;
  referenceCode: string;
  trackingKey?: string;
  source: InquirySource;
  customerName: string;
  customerEmail: string;
  contactNumber?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  country?: string;
  companyName?: string;
  subject: string;
  category: string;
  message: string;
  status: InquiryStatus;
  progressPercent: number;
  milestoneStage: string;
  developerNote?: string;
  paymentMethod?: PaymentMethod;
  paymentPlan?: '40% Deposit' | '100% Full Payment';
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  senderAccount?: string;
  quotedAmount?: number;
  amountPaid?: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
  replies: InquiryReply[];
}

export interface VisitorRecord {
  id: string;
  visitorKey: string;
  visitorName: string;
  device: 'Desktop' | 'Mobile';
  lastView: string;
  lastAction: string;
  visitCount: number;
  firstVisitedAt: string;
  lastVisitedAt: string;
}

export interface StoreSettings {
  storeName: string;
  domain: string;
  useCustomDomainForQr?: boolean;
  announcementBanner: string;
  contactEmail: string;
  easypaisaNumber: string;
  easypaisaAccountName: string;
  location: string;
  usdToPkrRate: number;
  adminPin: string;
  maintenanceMode: boolean;
}

export interface TestimonialRecord {
  id: string;
  clientName: string;
  companyOrRole: string;
  country: string;
  projectOrApp: string;
  rating: number;
  quote: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export type DesignAssetType =
  | 'Brand Illustration Pack'
  | 'UI/UX Design System'
  | 'Product 3D Render'
  | 'Logo & Identity Suite'
  | 'Motion Graphics Kit';

export type DesignArtStyle =
  | 'Minimalist Vector'
  | 'Isometric Technical'
  | 'Editorial Ink'
  | 'Photorealistic 3D'
  | 'Brand Monochrome';

export type DesignTurnaround = 'standard' | 'express';
export type DesignLicense = 'standard' | 'exclusive';

export interface DesignOrderConfig {
  assetType: DesignAssetType;
  artStyle: DesignArtStyle;
  assetCount: number;
  revisions: number;
  formats: string[];
  turnaround: DesignTurnaround;
  license: DesignLicense;
  primaryColor: string;
  secondaryColor: string;
}

export interface DesignQuoteBreakdown {
  basePrice: number;
  quantityCost: number;
  revisionCost: number;
  expressFee: number;
  licenseFee: number;
  totalPrice: number;
  estimatedDays: number;
}

export interface SoftwareBlueprintSuggestion {
  projectTitle: string;
  valueProposition: string;
  dealPitch: string;
  architectureSummary: string;
  recommendedMode: 'Online Cloud' | 'Offline Local' | 'Hybrid Online + Offline' | 'Web Platform';
  recommendedStack: string[];
  coreModules: Array<{
    name: string;
    purpose: string;
    priority: 'Essential' | 'Recommended' | 'Optional';
  }>;
  userRoles: string[];
  estimatedTimeline: string;
  estimatedPriceUsd: number;
  securityNotes: string[];
}

export interface FreeDomainOption {
  id: string;
  platform: string;
  domainFormat: string;
  exampleUrl: string;
  cost: string;
  sslIncluded: boolean;
  customSubdomain: boolean;
  bestFor: string;
  steps: string[];
}

export interface ServicePackage {
  id: string;
  title: string;
  category:
    | 'Assignments'
    | 'Excel Templates'
    | 'MS Word Templates'
    | 'PDF Services'
    | 'Graphic Design'
    | 'Suggested Services';
  startingPrice: number;
  deliveryWindow: string;
  deliverables: string[];
  description: string;
}

export type AppView =
  | 'store'
  | 'order-app'
  | 'assignments'
  | 'track'
  | 'dashboard'
  | 'journal'
  | 'contact';
