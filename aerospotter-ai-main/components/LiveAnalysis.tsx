
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, ErrorIcon } from './Icons';
import { AppMode } from '../types';

interface LiveAnalysisProps {
  onFilesChange: (files: File[]) => void;
  appMode: AppMode;
}

const LiveAnalysis: React.FC<LiveAnalysisProps> = ({ onFilesChange, appMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const isRealityInputMode = appMode === AppMode.FORESIGHT_REALITY_INPUT;

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setError("Could not access camera. It might be in use by another application.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const handleCanPlay = () => setIsCameraReady(true);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || capturedImages.length >= 5) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(blob => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                setCapturedImages(prev => isRealityInputMode ? [file] : [...prev, file]);
            }
        }, 'image/png');
    }
  };
  
  const handleFinalize = () => {
      if (isRealityInputMode && capturedImages.length === 1) {
          onFilesChange(capturedImages);
      } else if (capturedImages.length >= (isRealityInputMode ? 1 : 2)) {
          onFilesChange(capturedImages);
      }
  };

  const handleReset = () => setCapturedImages([]);

  const getButtonLabel = () => {
    if (isRealityInputMode) return 'Capture "Reality"';
    if (capturedImages.length === 0) return 'Capture "Before"';
    if (capturedImages.length === 1) return 'Capture "After"';
    if (capturedImages.length < 5) return `Capture Step ${capturedImages.length}`;
    return 'Limit Reached';
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-2xl aspect-video bg-gray-200 dark:bg-f1-dark rounded-lg overflow-hidden relative border border-gray-300 dark:border-gray-600">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" onCanPlay={handleCanPlay}></video>
        <AnimatePresence>
        {!isCameraReady && !error && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity:0}} className="absolute inset-0 flex items-center justify-center bg-f1-light dark:bg-f1-dark/80">
                <p className="text-f1-text-darker-light dark:text-f1-text-darker animate-pulse">Initializing Camera...</p>
            </motion.div>
        )}
        </AnimatePresence>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>

      <AnimatePresence>
        {error && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-4 text-center text-red-500 dark:text-red-400 flex items-center gap-2">
                <ErrorIcon className="w-8 h-8"/><div><p className="font-semibold">Camera Error</p><p className="text-sm">{error}</p></div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap justify-center items-center gap-4 w-full">
         <div className="flex space-x-2">
            {capturedImages.map((img, index) => ( <motion.img key={index} src={URL.createObjectURL(img)} className="w-16 h-16 object-cover rounded-md border-2 border-f1-accent-cyan" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} /> ))}
        </div>
        <div className="flex gap-2">
          <button onClick={captureImage} disabled={!isCameraReady || capturedImages.length >= (isRealityInputMode ? 1 : 5)} className="bg-f1-accent-cyan text-f1-dark font-bold py-2 px-4 rounded-md disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              <CameraIcon className="w-5 h-5 text-f1-dark"/> {getButtonLabel()}
          </button>
          {capturedImages.length > 0 && <button onClick={handleReset} className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Reset</button>}
        </div>
      </div>
       {(capturedImages.length >= (isRealityInputMode ? 1 : 2)) && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleFinalize} className="mt-4 w-full max-w-md bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500 text-white dark:text-gray-900 font-bold py-3 px-6 rounded-md transition-colors">
                Finalize and Prepare for Analysis ({capturedImages.length} image{capturedImages.length > 1 ? 's': ''})
            </motion.button>
        )}
    </div>
  );
};

export default LiveAnalysis;