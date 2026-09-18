import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [scannerMode, setScannerMode] = useState<'camera' | 'file'>('camera');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    if (scannerMode === 'camera') {
      startCamera();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, scannerMode]);

  const startCamera = async () => {
    setErrorMessage(null);
    setIsStartingCamera(true);

    try {
      if (scannerInstanceRef.current) {
        try {
          await scannerInstanceRef.current.stop();
        } catch {
          // ignore
        }
      }

      const scanner = new Html5Qrcode('qr-reader-target');
      scannerInstanceRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText);
        },
        () => {
          // ignore frames without QR
        }
      );
      setIsStartingCamera(false);
    } catch (err: unknown) {
      console.warn('Camera scan error:', err);
      setIsStartingCamera(false);
      setErrorMessage(
        'Không thể mở camera (có thể do quyền truy cập bị từ chối hoặc thiết bị không có camera). Bạn có thể chọn tải file ảnh mã QR để quét.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
      } catch (err) {
        console.warn('Stop scanner error:', err);
      }
      scannerInstanceRef.current = null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file-temp');
      const result = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      onScanSuccess(result);
    } catch (err) {
      setErrorMessage('Không tìm thấy mã QR hợp lệ trong hình ảnh này. Vui lòng thử lại với ảnh rõ nét hơn.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Quét Mã QR Điểm Danh</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Camera vs File Upload */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1">
          <button
            onClick={() => setScannerMode('camera')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              scannerMode === 'camera'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" /> Bằng Camera
          </button>
          <button
            onClick={() => setScannerMode('file')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              scannerMode === 'file'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" /> Tải ảnh mã QR
          </button>
        </div>

        {/* Viewport content */}
        <div className="p-4 flex flex-col items-center justify-center min-h-[300px]">
          {scannerMode === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              <div 
                id="qr-reader-target" 
                className="w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border-2 border-dashed border-indigo-300 bg-slate-950 flex items-center justify-center"
              />
              {isStartingCamera && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang khởi động camera...
                </div>
              )}
              <p className="text-xs text-slate-500 text-center mt-3">
                Hướng camera điện thoại vào mã QR của giảng viên trên màn hình hoặc máy chiếu
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center py-6 text-center">
              <div id="qr-reader-file-temp" style={{ display: 'none' }} />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50/40"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800 mb-1">
                  Chọn ảnh chứa mã QR
                </span>
                <span className="text-xs text-slate-500">Hỗ trợ JPG, PNG, WEBP</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {errorMessage && (
            <div className="w-full mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
