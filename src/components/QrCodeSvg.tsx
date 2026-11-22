import { Check, Copy, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  showActions?: boolean;
  downloadFileName?: string;
}

export async function downloadQrPng(value: string, filename = 'mashaltech-app-qr.png'): Promise<void> {
  try {
    const dataUrl = await QRCode.toDataURL(value, {
      width: 512,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // ignore QR export failure silently
  }
}

export function QrCodeSvg({
  value,
  size = 140,
  className = '',
  showActions = false,
  downloadFileName = 'mashaltech-qr.png',
}: QrCodeSvgProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      color: {
        dark: '#111318',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        if (active) setSvgMarkup(svg);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value, size]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="inline-flex flex-col items-center">
      {!svgMarkup ? (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 font-mono text-[10px] text-stone-400 ${className}`}
        >
          QR
        </div>
      ) : (
        <div
          style={{ width: size, height: size }}
          className={`overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-xs ${className}`}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
          aria-label={`QR code for ${value}`}
        />
      )}

      {showActions && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => downloadQrPng(value, downloadFileName)}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:border-stone-950 hover:text-stone-950"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Save QR PNG</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:text-stone-950"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
