import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageFile, ProcessingState, DomainMode, DetectedChange, AppMode, SimulationData, SimulationVizData, RivalGhostData, ComparisonMode } from './types';
import ImageUploader from './components/ImageUploader';
import TimelineCarousel from './components/TimelineCarousel';
import ResultDisplay from './components/ResultDisplay';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import InteractiveChatPanel from './components/InteractiveChatPanel';
import ExportPanel from './components/ExportPanel';
import TelemetryPanel from './components/TelemetryPanel';
import ControlBar from './components/ControlBar';
import useVisionProcessor from './hooks/useVisionProcessor';
import { LogoIcon, ErrorIcon } from './components/Icons';
import { decode, decodeAudioData } from './utils/audio';



const MAX_TIMELINE_IMAGES = 10;

const App: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [domainMode, setDomainMode] = useState<DomainMode>('F1');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('baseline');
  const [selectedChange, setSelectedChange] = useState<DetectedChange | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [rivalGhost, setRivalGhost] = useState<RivalGhostData | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [simulationViz, setSimulationViz] = useState<SimulationVizData | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [timelineSliderAfterIndex, setTimelineSliderAfterIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [useRoboflowOverlay, setUseRoboflowOverlay] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploaderError, setUploaderError] = useState<string | null>(null);
  const comparisonModeRef = useRef<ComparisonMode>('baseline');
  const [panelSplit, setPanelSplit] = useState(() => {
    if (typeof window === 'undefined') {
      return 0.56;
    }
    const stored = window.localStorage.getItem('panelSplit');
    const parsed = stored ? parseFloat(stored) : NaN;
    if (Number.isFinite(parsed)) {
      return Math.min(0.7, Math.max(0.35, parsed));
    }
    return 0.56;
  });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth < 1024));
  const mainLayoutRef = useRef<HTMLDivElement | null>(null);
  
  const updateSplitFromPointer = useCallback((clientX: number) => {
    if (!mainLayoutRef.current) return;
    const rect = mainLayoutRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.min(0.7, Math.max(0.35, ratio));
    setPanelSplit(clamped);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('panelSplit', panelSplit.toString());
  }, [panelSplit]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateLayout = () => setIsCompactLayout(window.innerWidth < 1024);
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      updateSplitFromPointer(event.clientX);
    };
    const handleUp = () => setIsDraggingSplit(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isDraggingSplit, updateSplitFromPointer]);

  useEffect(() => {
    if (isCompactLayout && isDraggingSplit) {
      setIsDraggingSplit(false);
    }
  }, [isCompactLayout, isDraggingSplit]);

  const handleSplitPointerDown = useCallback((event: React.PointerEvent) => {
    if (isCompactLayout) return;
    setIsDraggingSplit(true);
    updateSplitFromPointer(event.clientX);
  }, [isCompactLayout, updateSplitFromPointer]);

  const gridTemplateColumns = useMemo(() => {
    if (isCompactLayout) return undefined;
    const analysisWidth = `${Math.round(panelSplit * 100)}%`;
    const chatWidth = `${Math.round((1 - panelSplit) * 100)}%`;
    return `minmax(320px, ${analysisWidth}) 12px minmax(320px, ${chatWidth})`;
  }, [isCompactLayout, panelSplit]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const { state, result, error, appMode, setAppMode, foresightResult, statusText, processImages, startForesight, processDeltaAnalysis, reset, progress } = useVisionProcessor();

  const isLoading = state !== ProcessingState.IDLE && state !== ProcessingState.DONE && state !== ProcessingState.ERROR;
  const timelineComparisons = result?.timeline?.comparisons || [];
  const latestComparison = timelineComparisons[timelineComparisons.length - 1];
  const activeComparison = useMemo(() => {
    if (!timelineComparisons.length) {
      return undefined;
    }
    if (selectedChange?.comparisonRef) {
      const match = timelineComparisons.find(
        (comparison) =>
          comparison.afterIndex === selectedChange.comparisonRef?.afterIndex &&
          comparison.beforeIndex === selectedChange.comparisonRef?.beforeIndex
      );
      if (match) {
        return match;
      }
    }
    if (timelineSliderAfterIndex !== null) {
      const manual = timelineComparisons.find(
        (comparison) => comparison.afterIndex === timelineSliderAfterIndex
      );
      if (manual) {
        return manual;
      }
    }
    return latestComparison;
  }, [timelineComparisons, latestComparison, selectedChange, timelineSliderAfterIndex]);
  const activeBeforeIndex = activeComparison?.beforeIndex ?? selectedChange?.comparisonRef?.beforeIndex ?? 0;
  const activeAfterIndex = activeComparison?.afterIndex ?? selectedChange?.comparisonRef?.afterIndex ?? Math.max(imageFiles.length - 1, 0);
  const roboflowArtifacts = latestComparison?.objectDiffArtifacts;
  const hasRoboflowArtifacts = Boolean(
    roboflowArtifacts?.overlay || roboflowArtifacts?.roboflowVisualizations?.length
  );
  
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = storedTheme || preferredTheme;
    
    setTheme(initialTheme);
    root.classList.add(initialTheme);
  }, []);

  useEffect(() => {
    comparisonModeRef.current = comparisonMode;
  }, [comparisonMode]);

  useEffect(() => {
    if (!hasRoboflowArtifacts && useRoboflowOverlay) {
      setUseRoboflowOverlay(false);
    }
  }, [hasRoboflowArtifacts, useRoboflowOverlay]);

  useEffect(() => {
    if (showHeatmap && useRoboflowOverlay) {
      setUseRoboflowOverlay(false);
    }
  }, [showHeatmap, useRoboflowOverlay]);

  const handleRoboflowToggle = useCallback((next: boolean) => {
    setUseRoboflowOverlay(next);
    if (next) {
      setShowHeatmap(false);
    }
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };


  const seekVideoAt = (video: HTMLVideoElement, time: number) =>
    new Promise<void>((resolve, reject) => {
      const handleSeeked = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error('Unable to decode video frame.'));
      };
      const cleanup = () => {
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);
      video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - 0.05, 0));
    });

  const extractRandomFramesFromVideo = useCallback(
    async (videoFile: File, frameTarget = 10): Promise<ImageFile[]> => {
      const videoUrl = URL.createObjectURL(videoFile);
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        const handleLoaded = () => {
          cleanup();
          resolve();
        };
        const handleError = () => {
          cleanup();
          reject(new Error('Unable to load video metadata.'));
        };
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoaded);
          video.removeEventListener('error', handleError);
        };
        video.addEventListener('loadedmetadata', handleLoaded);
        video.addEventListener('error', handleError);
      });

      if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration) || video.duration <= 0) {
        URL.revokeObjectURL(videoUrl);
        throw new Error('Video did not contain readable frames.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(videoUrl);
        throw new Error('Canvas context unavailable for frame extraction.');
      }

      const frameCount = Math.max(2, Math.min(frameTarget, MAX_TIMELINE_IMAGES));
      const timestamps = new Set<number>();
      timestamps.add(0);
      if (video.duration > 0.1) {
        timestamps.add(Math.max(video.duration - 0.05, 0));
      }
      while (timestamps.size < frameCount) {
        timestamps.add(Math.random() * video.duration);
      }
      const sortedTimes = Array.from(timestamps).sort((a, b) => a - b);
      if (!sortedTimes.length) {
        sortedTimes.push(0);
      }

      const frames: ImageFile[] = [];

      for (let index = 0; index < sortedTimes.length; index++) {
        const timestamp = sortedTimes[index];
        await seekVideoAt(video, timestamp);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error('Failed to capture video frame.'));
            }
          }, 'image/png');
        });
        const frameFile = new File([blob], `video-frame-${index + 1}.png`, { type: 'image/png' });
        frames.push({
          id: `${videoFile.name}-${Date.now()}-${index}`,
          file: frameFile,
          previewUrl: URL.createObjectURL(frameFile),
          label: `Frame ${index + 1}`,
        });
        setVideoProgress(Math.round(((index + 1) / sortedTimes.length) * 100));
      }

      URL.revokeObjectURL(videoUrl);
      return frames;
    },
    []
  );

  const processVideoUpload = useCallback(
    async (videoFile: File) => {
      setIsProcessingVideo(true);
      setVideoProgress(0);
      setUploaderError(null);
      try {
        const frames = await extractRandomFramesFromVideo(videoFile, 10);
        if (frames.length < 2) {
          setUploaderError('Need at least two frames from the video to run analysis. Try a longer clip.');
          return;
        }
        setImageFiles(frames);
        setAppMode(AppMode.STANDARD_ANALYSIS);
        setTimelineSliderAfterIndex(null);
      } catch (err) {
        console.error('Video processing failed', err);
        setUploaderError(err instanceof Error ? err.message : 'Failed to sample frames from video.');
      } finally {
        setIsProcessingVideo(false);
      }
    },
    [extractRandomFramesFromVideo, setAppMode, setTimelineSliderAfterIndex]
  );



  const handleSelectChange = useCallback((id: string | null) => {
    if (id === null) {
        setSelectedChange(null);
        return;
    }
    const change = result?.changes.find(c => c.id === id);
    setSelectedChange(change || null);
    if (change?.comparisonRef) {
      setTimelineSliderAfterIndex(change.comparisonRef.afterIndex);
    }
  }, [result]);

  const handleComparisonChange = useCallback((afterIndex: number) => {
    setTimelineSliderAfterIndex(afterIndex);
    setSelectedChange(null);
  }, []);

  const handleImageEdited = useCallback((newImage: {url: string; prompt: string}) => {
    setImageFiles(prevFiles => {
        if (prevFiles.length === 0) return prevFiles;
        const newFiles = [...prevFiles];
        const lastFile = newFiles[newFiles.length - 1];
        
        const blob = (dataURI: string) => {
          const splitDataURI = dataURI.split(',');
          const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1]);
          const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
          const ia = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          return new Blob([ia], { type: mimeString });
        }
        
        const updatedFile = {
            ...lastFile,
            file: new File([blob(newImage.url)], lastFile.file.name, {type: lastFile.file.type}),
            previewUrl: newImage.url,
        };
        newFiles[newFiles.length - 1] = updatedFile;
        return newFiles;
    });
  }, []);

  const handleFilesChange = useCallback(async (files: File[]) => {
    if (!files.length) {
      return;
    }

    setUploaderError(null);

    if (result || state !== ProcessingState.IDLE) {
      reset();
    }
    setTimelineSliderAfterIndex(null);

    const firstFile = files[0];
    if (firstFile && firstFile.type.startsWith('video/')) {
      if (appMode === AppMode.FORESIGHT_REALITY_INPUT) {
        setUploaderError('Video uploads are not supported while capturing the "Reality" image. Please upload a single photo.');
        return;
      }
      await processVideoUpload(firstFile);
      return;
    }

    const newImageFiles = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      label: `Image ${index + 1}`,
    }));
    
    if (appMode === AppMode.FORESIGHT_REALITY_INPUT) {
        if (newImageFiles.length === 1) {
            const allFiles = [...imageFiles, newImageFiles[0]];
            setImageFiles(allFiles);
            processDeltaAnalysis(allFiles[0], allFiles[1], foresightResult!.prophecyImageUrl, domainMode);
        } else {
            setUploaderError('Please upload exactly one "Reality" image to compare with the AI Prophecy.');
        }
    } else {
        if (newImageFiles.length > MAX_TIMELINE_IMAGES) {
          setUploaderError(`Please select no more than ${MAX_TIMELINE_IMAGES} images for a single run.`);
          return;
        }
        setImageFiles(newImageFiles);
        if (files.length === 1) {
            setAppMode(AppMode.FORESIGHT_INPUT);
        } else if (files.length >= 2) {
            setAppMode(AppMode.STANDARD_ANALYSIS);
        }
    }
  }, [result, state, reset, appMode, processVideoUpload, processDeltaAnalysis, imageFiles, foresightResult, domainMode, setAppMode]);

  const handleReorderImages = useCallback((newOrder: ImageFile[]) => {
    // Clone to detach from Framer Motion's internal mutable array while preserving preview URLs.
    setImageFiles(newOrder.map((image) => ({ ...image })));
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    let updatedImages: ImageFile[] = [];
    setImageFiles((previous) => {
      updatedImages = previous.filter((image) => image.id !== imageId);
      return updatedImages;
    });
    if (updatedImages.length <= 1) {
      setAppMode(AppMode.FORESIGHT_INPUT);
    } else {
      setAppMode(AppMode.STANDARD_ANALYSIS);
    }
  }, [setAppMode]);

  const handleAnalyzeClick = useCallback(() => {
    setTimelineSliderAfterIndex(null);
    setSelectedChange(null);
    setShowHeatmap(false);
    setPlayingMessageId(null);
    setIsAudioPaused(false);
    setRivalGhost(null);
    setSimulationData(null);
    setSimulationViz(null);
    setSuggestedQuestions([]);
    setUseRoboflowOverlay(false);
    setUploaderError(null);

    if (appMode === AppMode.STANDARD_ANALYSIS && imageFiles.length >= 2) {
      processImages(imageFiles, domainMode, comparisonMode);
    } else if (appMode === AppMode.FORESIGHT_INPUT && imageFiles.length === 1) {
      startForesight(imageFiles[0], domainMode);
    }
  }, [imageFiles, domainMode, processImages, appMode, startForesight, comparisonMode]);

  const handleReset = useCallback(() => {
    setImageFiles([]);
    reset();
    setSelectedChange(null);
    setShowHeatmap(false);
    setPlayingMessageId(null);
    setIsAudioPaused(false);
    setRivalGhost(null);
    setSimulationData(null);
    setSimulationViz(null);
    setSuggestedQuestions([]);
    setUseRoboflowOverlay(false);
    setTimelineSliderAfterIndex(null);
    setUploaderError(null);
    setIsProcessingVideo(false);
    setVideoProgress(0);
    if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
    }
  }, [reset]);
  
  const handlePlayAudio = useCallback(async (messageId: string, base64Audio: string) => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    try {
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      if (audioContextRef.current) {
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.onended = () => {
            setPlayingMessageId(null);
            setIsAudioPaused(false);
            sourceNodeRef.current = null;
          };
          source.start(0);
          sourceNodeRef.current = source;
          setPlayingMessageId(messageId);
          setIsAudioPaused(false);
      }
    } catch (e) {
      console.error("Failed to process and play audio:", e);
      setPlayingMessageId(null);
      setIsAudioPaused(false);
    }
  }, []);

  const handlePauseResumeAudio = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'running') {
        await audioContextRef.current.suspend();
        setIsAudioPaused(true);
    } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        setIsAudioPaused(false);
    }
  }, []);

  // Effect to clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);


  const getAnalyzeButtonText = () => {
    if (isLoading) {
        const roundedProgress = Math.round(progress);
        let statusTextStr: string = state;
        if (state === ProcessingState.SUMMARIZING) statusTextStr = `Generating Report`;
        if (state === ProcessingState.GENERATING) {
          statusTextStr = progress < 45 ? "Fetching Strategic Intel" : "Generating AI Prophecy";
        }
        return `${statusTextStr} (${roundedProgress}%)`;
    }

    if (appMode === AppMode.FORESIGHT_INPUT) return 'Engage Strategic Foresight';
    if (appMode === AppMode.FORESIGHT_REALITY_INPUT) return 'Upload "Reality" to Run Delta Analysis';
    return 'Analyze Differences';
  }

  return (
    <div className="h-screen bg-f1-light dark:bg-f1-dark text-f1-text-light dark:text-f1-text font-sans flex flex-col">
      <AnimatePresence>
        {isProcessingVideo && (
          <motion.div
            key="video-processing-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-f1-dark/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-48 h-48 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <motion.circle cx="50" cy="50" r="45" stroke="rgba(0, 245, 212, 0.2)" strokeWidth="4" fill="transparent" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(0, 245, 212, 1)"
                  strokeWidth="4"
                  fill="transparent"
                  strokeLinecap="round"
                  pathLength={1}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: videoProgress / 100 }}
                  transition={{ duration: 0.4, ease: 'linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-4xl font-bold text-f1-accent-cyan">
                  {Math.min(100, Math.max(0, Math.round(videoProgress)))}
                  <span className="text-2xl">%</span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg font-semibold text-f1-text-light">Sampling frames from video…</p>
            <p className="text-sm text-f1-text-darker-light max-w-md">
              We're extracting 10 representative frames to run through the AeroSpotter analysis pipeline.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
        <header className="flex justify-between items-center p-4 glassmorphism rounded-lg">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-gray-900 dark:text-white" style={{textShadow: '0 0 10px rgba(0, 245, 212, 0.5)'}}>
              AeroSpotter AI <span className="font-light text-gradient-cyan">/ can we get much higher</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-green-600 dark:text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
              <span>Systems: Online</span>
          </div>
        </header>
      </div>

      <main
        ref={mainLayoutRef}
        className={`flex-grow max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 min-h-0 ${
          isCompactLayout ? 'flex flex-col gap-6' : 'grid items-start gap-6 md:gap-8'
        }`}
        style={!isCompactLayout && gridTemplateColumns ? { gridTemplateColumns, alignItems: 'stretch' } : undefined}
      >
        
        {/* --- Left Visual & Data Column --- */}
        <section className={`flex flex-col gap-6 w-full min-h-0 ${isCompactLayout ? '' : 'pr-0 md:pr-4'}`}>
          <AnimatePresence>
            {(error || uploaderError) && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-100/50 dark:bg-red-900/50 border border-red-500/50 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg relative flex items-start gap-3 overflow-hidden"
                role="alert"
              >
                <ErrorIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Operation Failed</strong>
                  <p className="text-sm mt-1">{error || uploaderError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {imageFiles.length === 0 ? (
              <motion.div key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ImageUploader onFilesChange={handleFilesChange} appMode={appMode} />
              </motion.div>
            ) : (
              <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TimelineCarousel
                  images={imageFiles}
                  appMode={appMode}
                  foresightResult={foresightResult}
                  onReorder={handleReorderImages}
                  onRemove={handleRemoveImage}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <ControlBar
            onAnalyzeClick={handleAnalyzeClick}
            analyzeButtonText={getAnalyzeButtonText()}
            isAnalyzeDisabled={(appMode === AppMode.STANDARD_ANALYSIS && imageFiles.length < 2) || (appMode === AppMode.FORESIGHT_INPUT && imageFiles.length !== 1) || state !== ProcessingState.IDLE || appMode === AppMode.FORESIGHT_REALITY_INPUT}
            isLoading={isLoading}
            showHeatmap={showHeatmap}
            onShowHeatmapChange={setShowHeatmap}
            isHeatmapDisabled={!result}
            useRoboflowOverlay={useRoboflowOverlay}
            onUseRoboflowOverlayChange={handleRoboflowToggle}
            isRoboflowDisabled={!hasRoboflowArtifacts}
            domainMode={domainMode}
            onDomainModeChange={setDomainMode}
            comparisonMode={comparisonMode}
            onComparisonModeChange={setComparisonMode}
            onReset={handleReset}
            showReset={imageFiles.length > 0}
            appMode={appMode}
            theme={theme}
            onThemeChange={handleThemeChange}
          />
          
          <div className="aspect-video bg-gray-200 dark:bg-f1-dark rounded-lg relative border border-gray-300 dark:border-gray-700/50 min-h-[clamp(280px,40vh,520px)]">
            <ResultDisplay
              images={imageFiles}
              result={result}
              comparison={activeComparison}
              activeBeforeIndex={activeBeforeIndex}
              activeAfterIndex={activeAfterIndex}
              onComparisonChange={handleComparisonChange}
              foresightResult={foresightResult}
              rivalGhost={rivalGhost}
              simulationViz={simulationViz}
              appMode={appMode}
              processingState={state}
              progress={progress}
              statusText={statusText}
              selectedChangeId={selectedChange?.id || null}
              onSelectChange={handleSelectChange}
              showHeatmap={showHeatmap}
              useRoboflowOverlay={useRoboflowOverlay}
              error={error}
            />
          </div>
          <DiagnosticsPanel timeline={result?.timeline} />
          <TelemetryPanel 
            selectedChange={selectedChange} 
            simulationData={simulationData} 
            result={result}
            onSelectChange={handleSelectChange}
          />
          <ExportPanel result={result} images={imageFiles} domain={domainMode} />
        </section>

        {/* --- Right Command & Control Column --- */}
        {isCompactLayout ? (
          <section className="w-full">
             <InteractiveChatPanel
              analysisResult={result}
              analysisState={state}
              analysisError={error}
              domain={domainMode}
              images={imageFiles}
              appMode={appMode}
              foresightResult={foresightResult}
              playingMessageId={playingMessageId}
              isAudioPaused={isAudioPaused}
              selectedChangeId={selectedChange?.id || null}
              onSelectChange={handleSelectChange}
              onPlayAudio={handlePlayAudio}
              onPauseResumeAudio={handlePauseResumeAudio}
              onGenerateRivalGhost={setRivalGhost}
              onSimulationUpdate={setSimulationData}
              onShowSimulationViz={setSimulationViz}
              onImageEdited={handleImageEdited}
              suggestedQuestions={suggestedQuestions}
              onUpdateSuggestedQuestions={setSuggestedQuestions}
            />
          </section>
        ) : (
          <>
            <div className="relative h-full w-full flex items-center justify-center select-none">
              <button
                type="button"
                aria-label="Resize analysis and chat panels"
                onPointerDown={handleSplitPointerDown}
                className="w-full h-full flex items-center justify-center cursor-col-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-accent-cyan/70 rounded"
              >
                <div className="central-divider w-[2px] h-full" />
              </button>
            </div>
            <section className="w-full min-h-0">
               <InteractiveChatPanel
                analysisResult={result}
                analysisState={state}
                analysisError={error}
                domain={domainMode}
                images={imageFiles}
                appMode={appMode}
                foresightResult={foresightResult}
                playingMessageId={playingMessageId}
                isAudioPaused={isAudioPaused}
                selectedChangeId={selectedChange?.id || null}
                onSelectChange={handleSelectChange}
                onPlayAudio={handlePlayAudio}
                onPauseResumeAudio={handlePauseResumeAudio}
                onGenerateRivalGhost={setRivalGhost}
                onSimulationUpdate={setSimulationData}
                onShowSimulationViz={setSimulationViz}
                onImageEdited={handleImageEdited}
                suggestedQuestions={suggestedQuestions}
                onUpdateSuggestedQuestions={setSuggestedQuestions}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;