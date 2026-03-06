
import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { CloseIcon, ExclamationTriangleIcon, QrCodeIcon } from '../icons';

interface QRScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = async (codeReader: BrowserMultiFormatReader) => {
      setError(null);
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError('No camera device found.');
          return;
        }
        
        // Prefer rear camera
        const rearCamera = videoInputDevices.find(device => device.label && (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')));
        const selectedDeviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0].deviceId;
        
        if (videoRef.current) {
          codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
            if (result) {
              onScan(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              // console.error('QR Scan Error:', err); // Suppress harmless not found errors logs
            }
          });
        }
      } catch (err) {
        console.error('Camera access error:', err);
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
             setError('Permission Denied: Please allow camera access in your browser settings.');
        } else {
             setError('Camera initialization failed. Please ensure you are using HTTPS.');
        }
      }
    };

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    const timer = setTimeout(() => {
      startScanning(codeReader);
    }, 0);
    return () => {
      clearTimeout(timer);
      codeReader.reset();
    };
  }, [onScan]);

  const handleSimulateScan = () => {
      // Simulate scanning a sample worker
      onScan(JSON.stringify({
          fullName: "Kobus Dlamini",
          language: "en-ZA",
          workerId: "2025001"
      }));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <h2 className="text-2xl font-bold text-white text-center mb-4">Scan QR Code</h2>
        <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden border-4 border-slate-500 shadow-2xl bg-black">
            {!error && <video ref={videoRef} className="w-full h-full object-cover" />}
            {!error && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2/3 h-2/3 border-4 border-dashed border-white/50 rounded-xl" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-white font-semibold mb-4">{error}</p>
                    <div className="flex gap-2">
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brand-secondary text-white rounded-lg hover:bg-blue-600 transition-colors">
                            Reload Page
                        </button>
                        <button onClick={handleSimulateScan} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors flex items-center gap-2">
                            <QrCodeIcon className="w-4 h-4" /> Simulate Scan
                        </button>
                    </div>
                </div>
            )}
        </div>
        <p className="text-slate-300 mt-4 text-center">{error ? "Unable to scan." : "Position the QR code inside the frame."}</p>
        <button onClick={onClose} className="mt-6 flex items-center gap-2 px-6 py-2 bg-slate-700 text-white font-semibold rounded-full hover:bg-slate-600 transition-colors">
            <CloseIcon className="w-5 h-5" />
            Cancel
        </button>
    </div>
  );
};
