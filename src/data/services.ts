import { ServicePackage } from '../types/store';

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'srv-assign',
    title: 'Academic, Coding & Research Assignments',
    category: 'Assignments',
    startingPrice: 25,
    deliveryWindow: '24 – 72 hours',
    deliverables: ['Clean Source Code / Reports', 'Step-by-Step Explanation Notes', 'Proper Citations & Formatting'],
    description:
      'Complete technical help for Python, Java, C++, Web Development, SQL database tasks, thesis formatting, and structured lab reports.',
  },
  {
    id: 'srv-excel',
    title: 'Custom Excel Templates & Automated Dashboards',
    category: 'Excel Templates',
    startingPrice: 30,
    deliveryWindow: '1 – 3 days',
    deliverables: ['.XLSX Automated Workbook', 'Pivot Charts & Conditional Rules', 'User Guide Sheet'],
    description:
      'Bespoke Excel spreadsheets for business inventory, payroll, school grading, expense tracking, and automated invoice calculation.',
  },
  {
    id: 'srv-word',
    title: 'MS Word Executive Templates & Document Formatting',
    category: 'MS Word Templates',
    startingPrice: 20,
    deliveryWindow: '24 – 48 hours',
    deliverables: ['Editable .DOCX Master Template', 'Auto Table of Contents & Styles', 'Print-Ready Margins'],
    description:
      'Clean, corporate-grade MS Word layouts for business proposals, SOP manuals, company profiles, CVs, and university dissertations.',
  },
  {
    id: 'srv-pdf',
    title: 'PDF Engineering, Fillable Forms & Conversion',
    category: 'PDF Services',
    startingPrice: 18,
    deliveryWindow: 'Same Day – 24 hours',
    deliverables: ['Interactive Fillable PDF', 'High-Accuracy Word/Excel Export', 'Compressed Print PDF'],
    description:
      'Turn scanned documents or static forms into interactive fillable PDFs, merge/split multi-hundred-page packs, or extract clean tables.',
  },
  {
    id: 'srv-graphic',
    title: 'Graphic Design, Logos & Brand Collateral',
    category: 'Graphic Design',
    startingPrice: 45,
    deliveryWindow: '2 – 4 days',
    deliverables: ['Vector SVG / AI Source', 'High-Res PNG / Print PDF', 'Brand Color & Font Guide'],
    description:
      'Logos, social media kits, product packaging, banners, and app store promotional graphics aligned to your brand aesthetic.',
  },
  {
    id: 'srv-pitch',
    title: 'PowerPoint Pitch Decks & Investor Presentations',
    category: 'Suggested Services',
    startingPrice: 40,
    deliveryWindow: '2 – 3 days',
    deliverables: ['Editable .PPTX + PDF Deck', 'Custom Charts & Icons', 'Clean Minimalist Slide Grid'],
    description:
      'Recommended service: Transform rough notes into sharp 12–20 slide business, startup, or academic defense presentations.',
  },
  {
    id: 'srv-data',
    title: 'Data Entry, CSV Cleanup & Web Scraping Automation',
    category: 'Suggested Services',
    startingPrice: 35,
    deliveryWindow: '1 – 3 days',
    deliverables: ['Clean Normalized CSV / Excel', 'Duplicate Removal Script', 'Verified Summary Report'],
    description:
      'Recommended service: Clean messy customer lists, merge supplier spreadsheets, and automate repetitive copy-paste workflows.',
  },
  {
    id: 'srv-speed',
    title: 'Website Bug Fixing, SEO & Mobile Speed Audit',
    category: 'Suggested Services',
    startingPrice: 55,
    deliveryWindow: '2 – 4 days',
    deliverables: ['Fixed HTML/CSS/React Code', 'Mobile Responsiveness Pass', 'Before/After Load Audit'],
    description:
      'Recommended service: Fix broken layouts, speed up slow pages, and make existing websites mobile-friendly and ready for customers.',
  },
];
