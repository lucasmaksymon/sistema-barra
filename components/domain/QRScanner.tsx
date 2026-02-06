'use client';

import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface QRScannerProps {
  onScan: (value: string) => void;
  onError?: (error: Error) => void;
  title?: string;
  allowManualInput?: boolean;
  isScanning?: boolean;
  onToggleScanner?: () => void;
}

export const QRScanner = ({
  onScan,
  onError,
  title = 'Escanear QR',
  allowManualInput = true,
  isScanning = false,
  onToggleScanner,
}: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [qrDetected, setQrDetected] = useState(false);
  
  useEffect(() => {
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isScanning]);
  
  const startScanner = async () => {
    try {
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('Elemento de video no encontrado');
      }
      
      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
      });
      
      videoElement.srcObject = stream;
      videoElement.setAttribute('playsinline', 'true');
      await videoElement.play();
      
      // Iniciar decodificación
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      
      reader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, error) => {
          if (result && !qrDetected) {
            setQrDetected(true);
            onScan(result.getText());
            setTimeout(() => setQrDetected(false), 2000);
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Error al decodificar:', error);
          }
        }
      );
    } catch (error: any) {
      console.error('Error al iniciar escáner:', error);
      
      let mensaje = 'Error al acceder a la cámara';
      if (error.name === 'NotAllowedError') {
        mensaje = 'Debes permitir el acceso a la cámara';
      } else if (error.name === 'NotFoundError') {
        mensaje = 'No se encontró ninguna cámara';
      } else if (error.name === 'NotReadableError') {
        mensaje = 'La cámara está siendo usada por otra aplicación';
      }
      
      onError?.(new Error(mensaje));
      onToggleScanner?.();
    }
  };
  
  const stopScanner = () => {
    // Detener la decodificación
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    
    // Detener el stream de video
    const videoElement = videoRef.current;
    if (videoElement?.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  };
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };
  
  return (
    <Card padding="md">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      
      <div className="space-y-4">
        {/* Scanner de cámara */}
        <div>
          <Button
            variant={isScanning ? 'danger' : 'primary'}
            onClick={onToggleScanner}
            fullWidth
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isScanning ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                )}
              </svg>
            }
          >
            {isScanning ? 'Detener escáner' : 'Iniciar escáner'}
          </Button>
          
          {isScanning && (
            <div className="mt-4 relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                playsInline
              />
              
              {/* Overlay con guías */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-blue-500 rounded-lg" />
              </div>
              
              {qrDetected && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-2xl">
                    ✓ QR Detectado
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Entrada manual */}
        {allowManualInput && (
          <div>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a1f2e] text-gray-400">O ingresar manualmente</span>
              </div>
            </div>
            
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Código QR o Token"
                className="flex-1"
              />
              <Button type="submit" variant="primary" disabled={!manualCode.trim()}>
                Validar
              </Button>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
};
