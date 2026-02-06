'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface QRDisplayProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  showDownload?: boolean;
  onDownload?: () => void;
}

export const QRDisplay = ({
  value,
  title,
  subtitle,
  size = 256,
  showDownload = false,
  onDownload,
}: QRDisplayProps) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    
    // Default download behavior
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };
  
  return (
    <Card padding="lg" className="text-center">
      {title && (
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-400 mb-4">{subtitle}</p>
      )}
      
      <div className="bg-white p-6 rounded-xl inline-block mb-4">
        <QRCodeSVG
          id="qr-code-svg"
          value={value}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <p className="text-xs text-gray-400 mb-4 font-mono break-all">
        {value}
      </p>
      
      {showDownload && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownload}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
        >
          Descargar QR
        </Button>
      )}
    </Card>
  );
};

export const QRDisplayCompact = ({
  value,
  size = 128,
}: {
  value: string;
  size?: number;
}) => {
  return (
    <div className="bg-white p-3 rounded-lg inline-block">
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        includeMargin={false}
      />
    </div>
  );
};
