import {
  Activity,
  BookOpen,
  Cloud,
  Database,
  FileSpreadsheet,
  Smartphone,
  Terminal,
  Wallet,
} from 'lucide-react';
import type { Product } from '../types/store';

interface AppIconTileProps {
  app: Product;
  size?: 'sm' | 'md' | 'lg';
}

const THEME_STYLES: Record<NonNullable<Product['iconTheme']>, string> = {
  cyan: 'bg-gradient-to-br from-[#009FE3] to-[#026AA7] text-white',
  orange: 'bg-gradient-to-br from-[#E85D22] to-[#B93D0B] text-white',
  emerald: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
  indigo: 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white',
  slate: 'bg-gradient-to-br from-stone-800 to-stone-950 text-white',
};

export function AppIconTile({ app, size = 'md' }: AppIconTileProps) {
  const themeClass = THEME_STYLES[app.iconTheme || (app.platform === 'Mobile' ? 'emerald' : 'cyan')];

  const dimClass =
    size === 'sm'
      ? 'h-11 w-11 rounded-xl'
      : size === 'lg'
      ? 'h-16 w-16 rounded-2xl'
      : 'h-14 w-14 rounded-xl';

  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7';

  const renderGlyph = () => {
    const lower = app.name.toLowerCase();
    if (lower.includes('cloud')) return <Cloud className={iconSize} aria-hidden="true" />;
    if (lower.includes('record') || lower.includes('book'))
      return <BookOpen className={iconSize} aria-hidden="true" />;
    if (lower.includes('utility')) return <Terminal className={iconSize} aria-hidden="true" />;
    if (lower.includes('erp') || lower.includes('inventory'))
      return <Database className={iconSize} aria-hidden="true" />;
    if (lower.includes('khata') || lower.includes('ledger'))
      return <Wallet className={iconSize} aria-hidden="true" />;
    if (lower.includes('clinic')) return <Activity className={iconSize} aria-hidden="true" />;
    if (app.platform === 'Templates')
      return <FileSpreadsheet className={iconSize} aria-hidden="true" />;
    if (app.platform === 'Mobile') return <Smartphone className={iconSize} aria-hidden="true" />;
    return <Terminal className={iconSize} aria-hidden="true" />;
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center shadow-xs ${dimClass} ${themeClass}`}
    >
      {renderGlyph()}
    </div>
  );
}
