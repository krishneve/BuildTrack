import React, { useRef, useState, useCallback, useEffect } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or unavailable.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    onCapture(capturedImage);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <h3 className="text-white font-bold uppercase tracking-widest text-xs">Material Scanner</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-amber-500/50 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500" />
                </div>
            </div>
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                 <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl backdrop-blur-xl">
                    <p className="text-red-400 font-bold mb-4">{error}</p>
                    <button onClick={startCamera} className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold uppercase text-xs">Retry</button>
                 </div>
              </div>
            )}
          </>
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        )}
      </div>

      <div className="p-8 bg-black/40 backdrop-blur-2xl border-t border-white/5">
        {!capturedImage ? (
          <div className="flex justify-center">
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 border-4 border-slate-900 rounded-full flex items-center justify-center">
                <div className="w-14 h-14 bg-amber-500 rounded-full" />
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleConfirm}
              className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-xl uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.3)]"
            >
              Use This Image
            </button>
            <button 
              onClick={handleRetake}
              className="w-full py-4 bg-white/10 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-white/20 transition-colors"
            >
              Retake Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
