import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadIcon, CameraIcon } from './Icons';
import LiveAnalysis from './LiveAnalysis';
import { AppMode } from '../types';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  appMode: AppMode;
}

type Mode = 'upload' | 'live';

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesChange, appMode }) => {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('upload');
  const MAX_TIMELINE_IMAGES = 10;
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  
  const isRealityInputMode = appMode === AppMode.FORESIGHT_REALITY_INPUT;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Some files were rejected. Please upload valid image files (PNG, JPG, WEBP) or video files (MP4, WEBM, MOV).');
      return;
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    const videoFiles = acceptedFiles.filter((file) => file.type.startsWith('video/'));
    if (videoFiles.length > 0) {
        if (isRealityInputMode) {
            setError('Video uploads are not supported when providing the "Reality" image. Please select a single photo.');
            return;
        }
        if (acceptedFiles.length > 1) {
            setError('Please upload one video at a time.');
            return;
        }
        onFilesChange(videoFiles);
        return;
    }

    if (isRealityInputMode) {
        if (acceptedFiles.length !== 1) {
            setError('Please upload one "Reality" image to compare with the AI prophecy.');
            return;
        }
    } else {
        if (acceptedFiles.length > MAX_TIMELINE_IMAGES) {
          setError(`Please select no more than ${MAX_TIMELINE_IMAGES} images for a timeline upload.`);
          return;
        }
    }
    onFilesChange(acceptedFiles);
  }, [onFilesChange, isRealityInputMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/png': ['.png'], 
      'image/jpeg': ['.jpg', '.jpeg'], 
      'image/webp': ['.webp'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov']
    },
    multiple: true,
  });

  const handleVideoButtonClick = () => {
    if (isRealityInputMode) {
        setError('Video uploads are not supported when providing the "Reality" image.');
        return;
    }
    videoInputRef.current?.click();
  };

  const handleVideoInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
        setError('Please choose an MP4, WEBM, or MOV video file.');
        return;
    }
    onFilesChange([file]);
  };
  
  const getUploaderText = () => {
    if (isRealityInputMode) {
        return {
            title: 'Upload "Reality" Image',
            subtitle: 'Provide your actual "After" image to perform the Delta Analysis against the AI Prophecy.'
        };
    }
    return {
      title: 'Upload Media for Analysis',
      subtitle: `Drag & drop up to ${MAX_TIMELINE_IMAGES} images (PNG, JPG, WEBP) or upload a short MP4/WEBM/MOV clip. Provide 2+ frames for timeline comparison.`
    }
  }

  const renderUploader = () => (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 group
        ${isDragActive ? 'uploader-drag-active' : 'border-gray-400 dark:border-gray-600 hover:border-f1-accent-cyan/50'}`}
    >
      <input {...getInputProps()} />
      <motion.div
        className="flex flex-col items-center justify-center"
        animate={{ scale: isDragActive ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <UploadIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 group-hover:text-f1-accent-cyan transition-colors" />
        {isDragActive ? (
          <p className="mt-4 text-lg font-semibold text-f1-accent-cyan">Drop file(s) to initiate analysis...</p>
        ) : (
          <>
            <p className="mt-4 text-lg font-semibold text-f1-text-light dark:text-f1-text">{getUploaderText().title}</p>
            <p className="text-sm text-f1-text-darker-light dark:text-f1-text-darker">{getUploaderText().subtitle}</p>
          </>
        )}
      </motion.div>
      <div className="mt-6 flex flex-col items-center gap-3">
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleVideoInputChange}
        />
        <button
          type="button"
          onClick={handleVideoButtonClick}
          className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${isRealityInputMode ? 'border-gray-500 text-gray-400 cursor-not-allowed' : 'border-f1-accent-cyan text-f1-accent-cyan hover:bg-f1-accent-cyan/10'}`}
          disabled={isRealityInputMode}
        >
          Select a video (samples 10 frames)
        </button>
        <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker max-w-md">
          We'll randomly sample up to 10 frames from your clip so you can compare them just like a timeline upload.
        </p>
      </div>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
  
  return (
    <div className="glassmorphism p-4 rounded-lg">
        <div className="flex justify-center mb-4 border-b border-gray-300/50 dark:border-gray-700/50">
            <button 
                onClick={() => setMode('upload')}
                className={`relative px-6 py-2 text-sm font-semibold transition-colors ${mode === 'upload' ? 'text-f1-text-light dark:text-white' : 'text-f1-text-darker-light dark:text-f1-text-darker hover:text-f1-text-light dark:hover:text-white'}`}
            >
                <UploadIcon className="inline-block w-5 h-5 mr-2" />
                Upload Files
                 {mode === 'upload' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-f1-accent-cyan" layoutId="tab-underline" />}
            </button>
            <button 
                onClick={() => setMode('live')}
                className={`relative px-6 py-2 text-sm font-semibold transition-colors ${mode === 'live' ? 'text-f1-text-light dark:text-white' : 'text-f1-text-darker-light dark:text-f1-text-darker hover:text-f1-text-light dark:hover:text-white'}`}
            >
                <CameraIcon className="inline-block w-5 h-5 mr-2" />
                Use Live Camera
                {mode === 'live' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-f1-accent-cyan" layoutId="tab-underline" />}
            </button>
        </div>
        <AnimatePresence mode="wait">
            <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {mode === 'upload' ? renderUploader() : <LiveAnalysis onFilesChange={onFilesChange} appMode={appMode}/>}
            </motion.div>
        </AnimatePresence>
    </div>
  );
};

export default ImageUploader;