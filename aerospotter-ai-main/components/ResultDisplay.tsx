import React, { useRef, useEffect, useState, memo, lazy, Suspense, useCallback, useMemo } from 'react';
import { ImageFile, AnalysisResult, ForesightResult, AppMode, ProcessingState, SimulationVizData, DetectedChange, RivalGhostData, TimelineComparisonMetadata } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorIcon, ZoomInIcon, ZoomOutIcon, FitToScreenIcon, WireframeCarIcon } from './Icons';
import { resolveArtifactUrl } from '../utils/artifacts';

const FlowVizRenderer = lazy(() => import('./FlowVizRenderer'));


interface ResultDisplayProps {
  images: ImageFile[];
  result: AnalysisResult | null;
    comparison?: TimelineComparisonMetadata;
    activeBeforeIndex?: number;
    activeAfterIndex?: number;
    onComparisonChange?: (afterIndex: number) => void;
  foresightResult: ForesightResult | null;
  rivalGhost: RivalGhostData | null;
  simulationViz: SimulationVizData | null;
  appMode: AppMode;
  processingState: ProcessingState;
  progress: number;
  statusText: string;
  selectedChangeId: string | null;
  onSelectChange: (id: string | null) => void;
  showHeatmap: boolean;
    useRoboflowOverlay: boolean;
  error: string | null;
  
}

const changeTypeStyles = {
    Structural: {
        stroke: '#00f5d4', // f1-accent-cyan
        fill: 'rgba(0, 245, 212, 0.15)',
        glow: 'rgba(0, 245, 212, 0.7)',
    },
    Surface: {
        stroke: '#ff00ff', // f1-accent-magenta
        fill: 'rgba(255, 0, 255, 0.15)',
        glow: 'rgba(255, 0, 255, 0.7)',
    },
    Spatial: {
        stroke: '#facd15', // yellow-400, more vibrant
        fill: 'rgba(250, 204, 21, 0.15)',
        glow: 'rgba(250, 204, 21, 0.7)',
    }
};

const ANALYSIS_STEPS = {
  [ProcessingState.GENERATING]: [
    { p: 0, text: 'Initializing Foresight Matrix' },
    { p: 15, text: 'Querying Competitive Intelligence' },
    { p: 40, text: 'Synthesizing Development Vectors' },
    { p: 50, text: 'Engaging AI Prophecy Core' },
    { p: 75, text: 'Rendering Photorealistic Concept' },
    { p: 95, text: 'Finalizing Strategic Rationale' },
  ],
  [ProcessingState.SUMMARIZING]: [
    { p: 0, text: 'Initializing Analysis Core' },
    { p: 10, text: 'Calibrating Image Registration' },
    { p: 25, text: 'Executing Photonic Delta Scan' },
    { p: 50, text: 'Classifying & Vectorizing Diffs' },
    { p: 70, text: 'Cross-Referencing Telemetry Data' },
    { p: 85, text: 'Compiling Specialist Insights' },
  ]
};

const getLoadingStatusText = (state: ProcessingState, progress: number, appMode: AppMode, customStatusText: string): string => {
    // Always prioritize the specific status text from the processor hook, which includes retry info.
    if (customStatusText) {
        return customStatusText;
    }
    
    // Fallback to generic steps based on progress if no specific status is available.
    const steps = ANALYSIS_STEPS[state as keyof typeof ANALYSIS_STEPS] || ANALYSIS_STEPS[ProcessingState.SUMMARIZING];
    return steps.slice().reverse().find(step => progress >= step.p)?.text || 'Processing';
};

const drawEnhancedAnnotation = (ctx: CanvasRenderingContext2D, change: DetectedChange, isSelected: boolean, index: number) => {
    const { box, changeType } = change;
    const styles = changeTypeStyles[changeType];
    const canvas = ctx.canvas;

    const [x_min, y_min, x_max, y_max] = box;
    const rectX = x_min * canvas.width, rectY = y_min * canvas.height;
    const rectW = (x_max - x_min) * canvas.width, rectH = (y_max - y_min) * canvas.height;

    // --- Styling ---
    ctx.strokeStyle = styles.stroke;
    ctx.fillStyle = styles.fill;
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.globalAlpha = isSelected ? 1.0 : 0.75;
    
    // --- Glow for selected ---
    if (isSelected) {
        ctx.shadowColor = styles.glow;
        ctx.shadowBlur = 15;
    }

    // --- Draw Fill ---
    ctx.fillRect(rectX, rectY, rectW, rectH);

    // --- Draw Corner Brackets ---
    const cornerSize = Math.min(rectW, rectH) * 0.2; // 20% of the smaller side

    // Top-left
    ctx.beginPath();
    ctx.moveTo(rectX, rectY + cornerSize);
    ctx.lineTo(rectX, rectY);
    ctx.lineTo(rectX + cornerSize, rectY);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(rectX + rectW - cornerSize, rectY);
    ctx.lineTo(rectX + rectW, rectY);
    ctx.lineTo(rectX + rectW, rectY + cornerSize);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(rectX + rectW, rectY + rectH - cornerSize);
    ctx.lineTo(rectX + rectW, rectY + rectH);
    ctx.lineTo(rectX + rectW - cornerSize, rectY + rectH);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(rectX + cornerSize, rectY + rectH);
    ctx.lineTo(rectX, rectY + rectH);
    ctx.lineTo(rectX, rectY + rectH - cornerSize);
    ctx.stroke();
    
    // Reset shadow for text and background
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // --- Draw Label ---
    const fontSize = Math.max(12, Math.min(rectW * 0.15, 16));
    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    const labelText = `C${index}`;
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    const padding = 4;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding;

    let bgX = rectX;
    let bgY = rectY - bgHeight;
    let textX = rectX + padding;
    let textY = rectY - padding / 2;

    // Adjust if label goes off top of canvas
    if (bgY < 0) {
        bgY = rectY;
        textY = rectY + textHeight + padding / 2;
    }

    ctx.fillStyle = 'rgba(16, 16, 16, 0.85)'; // f1-dark with alpha
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

    ctx.fillStyle = styles.stroke;
    ctx.fillText(labelText, textX, textY);
    
    ctx.globalAlpha = 1.0; // Reset alpha
};


const ResultDisplay: React.FC<ResultDisplayProps> = (props) => {
    const { images, result, comparison, activeBeforeIndex, activeAfterIndex, onComparisonChange, foresightResult, rivalGhost, simulationViz, appMode, processingState, selectedChangeId, onSelectChange, showHeatmap, useRoboflowOverlay, error, progress } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformedContainerRef = useRef<HTMLDivElement>(null);
    const activePairRef = useRef<{ before: number; after: number }>({ before: -1, after: -1 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isPanning, setIsPanning] = useState(false);
    const panStartPoint = useRef({ x: 0, y: 0 });
    const clickStartPos = useRef({ x: 0, y: 0 });
    const [hoveredChange, setHoveredChange] = useState<DetectedChange | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [roboflowOverlayUrl, setRoboflowOverlayUrl] = useState<string | null>(null);
    const [roboflowFrameOverlayUrls, setRoboflowFrameOverlayUrls] = useState<{ before: string | null; after: string | null }>({ before: null, after: null });
      const [maskOverlayUrl, setMaskOverlayUrl] = useState<string | null>(null);
            const updateSliderFromPointer = useCallback((clientX: number) => {
                if (!transformedContainerRef.current) return;
                const rect = transformedContainerRef.current.getBoundingClientRect();
                if (!rect.width) return;
                const newPos = ((clientX - rect.left) / rect.width) * 100;
                setSliderPosition((prev) => {
                        if (Number.isNaN(newPos)) return prev;
                        return Math.max(0, Math.min(100, newPos));
                });
            }, []);

    const clampIndex = (index: number) => Math.min(Math.max(index, 0), Math.max(images.length - 1, 0));
    const resolvedBeforeIndex = typeof activeBeforeIndex === 'number' && images.length
        ? clampIndex(activeBeforeIndex)
        : (images.length ? 0 : -1);
    const resolvedAfterIndex = typeof activeAfterIndex === 'number' && images.length
        ? clampIndex(activeAfterIndex)
        : (images.length ? Math.max(images.length - 1, 0) : -1);
    const beforeImage = resolvedBeforeIndex >= 0 ? images[resolvedBeforeIndex] : null;
    const afterImage = resolvedAfterIndex >= 0 ? images[resolvedAfterIndex] : (beforeImage || null);
    const hasBeforeAfterPair = Boolean(
        beforeImage && afterImage && resolvedBeforeIndex !== resolvedAfterIndex
    );
    const hasFrameVisualsAvailable = Boolean(roboflowFrameOverlayUrls.before || roboflowFrameOverlayUrls.after);
    const roboflowFrameVisualsActive = useRoboflowOverlay && hasFrameVisualsAvailable;
    const roboflowBeforeOverlay = roboflowFrameVisualsActive ? roboflowFrameOverlayUrls.before : null;
    const roboflowAfterOverlay = useRoboflowOverlay
        ? (roboflowFrameVisualsActive
            ? roboflowFrameOverlayUrls.after || roboflowFrameOverlayUrls.before
            : roboflowOverlayUrl)
        : null;
    const targetBeforeIndex = resolvedBeforeIndex >= 0 ? resolvedBeforeIndex : undefined;
    const targetAfterIndex = resolvedAfterIndex >= 0 ? resolvedAfterIndex : undefined;
    const visibleChanges = useMemo(() => {
        if (!result?.changes) {
            return [];
        }
        if (!comparison || targetBeforeIndex === undefined || targetAfterIndex === undefined) {
            return result.changes;
        }
        return result.changes.filter((change) => {
            if (!change.comparisonRef) {
                return true;
            }
            return (
                change.comparisonRef.afterIndex === targetAfterIndex &&
                change.comparisonRef.beforeIndex === targetBeforeIndex
            );
        });
    }, [result?.changes, comparison, targetAfterIndex, targetBeforeIndex]);
    const hasRoboflowOverlay = Boolean(roboflowAfterOverlay);
    const showBaseImagery = !roboflowFrameVisualsActive;
    const sliderActive = hasBeforeAfterPair && (showBaseImagery || Boolean(roboflowBeforeOverlay));
    const overlayClipStyle = sliderActive ? { clipPath: `inset(0 0 0 ${sliderPosition}%)` } : undefined;
    const beforeOverlayClipStyle = sliderActive ? { clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` } : undefined;
    const preferRoboflowOverlay = hasRoboflowOverlay;
    const shouldRenderAnnotations = Boolean(visibleChanges.length && !showHeatmap && !preferRoboflowOverlay);
    const timelineMode = result?.timeline?.mode ?? 'baseline';
    const comparisonOptions = result?.timeline?.comparisons || [];
    const showComparisonSelector = comparisonOptions.length > 1;
    const formatComparisonLabel = (afterIndex: number, beforeIndex: number) =>
        timelineMode === 'consecutive'
            ? `Frame ${afterIndex + 1} vs Frame ${beforeIndex + 1}`
            : `Frame ${afterIndex + 1} vs Baseline`;

    useEffect(() => {
        const previous = activePairRef.current;
        if (previous.before !== resolvedBeforeIndex || previous.after !== resolvedAfterIndex) {
            activePairRef.current = { before: resolvedBeforeIndex, after: resolvedAfterIndex };
            setSliderPosition(50);
        }
    }, [resolvedBeforeIndex, resolvedAfterIndex]);

    useEffect(() => {
        if (!selectedChangeId) {
            return;
        }
        const visible = visibleChanges.some((change) => change.id === selectedChangeId);
        if (!visible) {
            onSelectChange(null);
        }
    }, [visibleChanges, selectedChangeId, onSelectChange]);

  const prophecyImageSrc = appMode === AppMode.FORESIGHT_REALITY_INPUT && foresightResult ? foresightResult.prophecyImageUrl : null;

  // The primary image to display. Shows the latest state.
  const mainDisplayImage = afterImage || (prophecyImageSrc ? { previewUrl: prophecyImageSrc } : null) || beforeImage;
  
  const isLoading = processingState !== ProcessingState.IDLE && processingState !== ProcessingState.DONE && processingState !== ProcessingState.ERROR;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mainDisplayImage?.previewUrl) return;

    setImageLoaded(false); // Reset on image change

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mainDisplayImage.previewUrl;
    
    const resizeCanvas = () => {
        if (!img.naturalWidth || !container) return;
        const cAspect = container.clientWidth / container.clientHeight;
        const iAspect = img.naturalWidth / img.naturalHeight;
        let w, h;
        if (cAspect > iAspect) {
            h = container.clientHeight;
            w = h * iAspect;
        } else {
            w = container.clientWidth;
            h = w / iAspect;
        }
        setCanvasSize({ width: w, height: h });
    };

    img.onload = () => {
        setImageLoaded(true);
        resizeCanvas();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [mainDisplayImage]);

    useEffect(() => {
        const resolvedRoboflow = resolveArtifactUrl(comparison?.objectDiffArtifacts?.overlay, comparison?.comparisonRoot);
        const resolvedMask = resolveArtifactUrl(comparison?.maskArtifacts?.overlay, comparison?.comparisonRoot);
        const frameVisualizations = comparison?.objectDiffArtifacts?.roboflowVisualizations || [];
        const resolvedBefore = frameVisualizations[0]
            ? resolveArtifactUrl(frameVisualizations[0], comparison?.comparisonRoot)
            : null;
        const resolvedAfter = frameVisualizations[1]
            ? resolveArtifactUrl(frameVisualizations[1], comparison?.comparisonRoot)
            : null;
        setRoboflowOverlayUrl(resolvedRoboflow);
        setRoboflowFrameOverlayUrls({ before: resolvedBefore, after: resolvedAfter });
        setMaskOverlayUrl(resolvedMask);
    }, [comparison]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
        return;
    }
    if (!imageLoaded || !canvasSize.width) {
        canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
        return;
    };
    
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!shouldRenderAnnotations) {
        return;
    }

    // Don't draw annotations if heatmap is active
    if (visibleChanges.length && !showHeatmap && !preferRoboflowOverlay) {
        const allChanges = result?.changes || [];
        const selected = visibleChanges.find(c => c.id === selectedChangeId);
        const others = visibleChanges.filter(c => c.id !== selectedChangeId);

        others.forEach(change => {
            const originalIndex = allChanges.findIndex(c => c.id === change.id);
            drawEnhancedAnnotation(ctx, change, false, (originalIndex >= 0 ? originalIndex : 0) + 1);
        });

        if (selected) {
            const originalIndex = allChanges.findIndex(c => c.id === selected.id);
            drawEnhancedAnnotation(ctx, selected, true, (originalIndex >= 0 ? originalIndex : 0) + 1);
        }
    }
    }, [result, selectedChangeId, imageLoaded, canvasSize, showHeatmap, shouldRenderAnnotations, preferRoboflowOverlay]);

  // Effect for the Rival's Ghost
  useEffect(() => {
    const ghostCanvas = ghostCanvasRef.current;
    if (!ghostCanvas || !imageLoaded || !canvasSize.width) return;

    ghostCanvas.width = canvasSize.width;
    ghostCanvas.height = canvasSize.height;
    const ctx = ghostCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0,0, ghostCanvas.width, ghostCanvas.height);
    if(rivalGhost) {
        const ghostImg = new Image();
        ghostImg.crossOrigin = "anonymous";
        ghostImg.src = rivalGhost.url;
        ghostImg.onload = () => {
            ctx.globalAlpha = 0.6;
            ctx.drawImage(ghostImg, 0, 0, ghostCanvas.width, ghostCanvas.height);
            ctx.globalAlpha = 1.0;
        }
    }
  }, [rivalGhost, imageLoaded, canvasSize]);

  // Effect for the Heatmap
    useEffect(() => {
        const heatmapCanvas = heatmapCanvasRef.current;
        if (!heatmapCanvas || !imageLoaded || !canvasSize.width || !visibleChanges.length) {
                if(heatmapCanvas) heatmapCanvas.getContext('2d')?.clearRect(0,0,heatmapCanvas.width,heatmapCanvas.height);
                return;
        };

    heatmapCanvas.width = canvasSize.width;
    heatmapCanvas.height = canvasSize.height;
    const ctx = heatmapCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

    if (showHeatmap) {
        visibleChanges.forEach(change => {
            const [x_min, y_min, x_max, y_max] = change.box;
            const centerX = (x_min + x_max) / 2 * heatmapCanvas.width;
            const centerY = (y_min + y_max) / 2 * heatmapCanvas.height;
            const radius = Math.sqrt(Math.pow((x_max - x_min) * heatmapCanvas.width, 2) + Math.pow((y_max - y_min) * heatmapCanvas.height, 2)) / 2 * 1.5;

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, `rgba(255, 0, 0, 0.6)`);
            gradient.addColorStop(0.5, `rgba(255, 255, 0, 0.4)`);
            gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
        });
    }
  }, [showHeatmap, result, imageLoaded, canvasSize]);

  useEffect(() => {
    if (selectedChangeId && result && canvasSize.width > 0) {
      const change = result.changes.find(c => c.id === selectedChangeId);
      if (change) {
        const [x_min, y_min, x_max, y_max] = change.box;
        const boxWidth = (x_max - x_min) * canvasSize.width, boxHeight = (y_max - y_min) * canvasSize.height;
        const boxCenterX = (x_min + (x_max - x_min) / 2) * canvasSize.width;
        const boxCenterY = (y_min + (y_max - y_min) / 2) * canvasSize.height;
        const scale = Math.min(canvasSize.width / boxWidth, canvasSize.height / boxHeight, 4) * 0.8;
        const x = (canvasSize.width / 2) - (boxCenterX * scale);
        const y = (canvasSize.height / 2) - (boxCenterY * scale);
        setTransform({ scale, x, y });
      }
    } else {
      setTransform({ scale: 1, x: 0, y: 0 });
    }
  }, [selectedChangeId, result, canvasSize]);
  
  const handleZoom = (direction: 'in' | 'out') => {
      const container = containerRef.current;
      if (!container) return;

      const zoomFactor = 1.2;
      const newScale = direction === 'in' ? transform.scale * zoomFactor : transform.scale / zoomFactor;
      const clampedScale = Math.max(1, Math.min(newScale, 8));

      if (clampedScale === transform.scale) return;

      // Zoom to center
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;

      const imageX = (centerX - transform.x) / transform.scale;
      const imageY = (centerY - transform.y) / transform.scale;

      const newX = centerX - imageX * clampedScale;
      const newY = centerY - imageY * clampedScale;
      
      const finalX = clampedScale === 1 ? 0 : newX;
      const finalY = clampedScale === 1 ? 0 : newY;

      setTransform({ scale: clampedScale, x: finalX, y: finalY });
  };

  const handleZoomIn = () => handleZoom('in');
  const handleZoomOut = () => handleZoom('out');
  const handleResetZoom = () => {
      onSelectChange(null);
      setTransform({ scale: 1, x: 0, y: 0 });
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
    if (e.button !== 0 || transform.scale <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    panStartPoint.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    setIsPanning(true);
  };
  
    const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
        e.preventDefault();
        setTransform(prev => ({ ...prev, x: e.clientX - panStartPoint.current.x, y: e.clientY - panStartPoint.current.y }));
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !visibleChanges.length || showHeatmap || isPanning) {
        setHoveredChange(null);
        return;
    }

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (sliderActive) {
        const sliderThresholdPx = (sliderPosition / 100) * rect.width;
        if (mouseX < sliderThresholdPx) {
            setHoveredChange(null);
            return;
        }
    }

    const imageX = (mouseX - transform.x) / transform.scale;
    const imageY = (mouseY - transform.y) / transform.scale;

    let foundChange: DetectedChange | null = null;
    // Iterate in reverse to find the topmost element
    for (let i = visibleChanges.length - 1; i >= 0; i--) {
        const change = visibleChanges[i];
        const [x_min, y_min, x_max, y_max] = change.box;
        const rectX = x_min * canvas.width;
        const rectY = y_min * canvas.height;
        const rectW = (x_max - x_min) * canvas.width;
        const rectH = (y_max - y_min) * canvas.height;

        if (imageX >= rectX && imageX <= rectX + rectW && imageY >= rectY && imageY <= rectY + rectH) {
            foundChange = change;
            break;
        }
    }

    setHoveredChange(foundChange);
    if (foundChange) {
        setTooltipPosition({ x: mouseX + 15, y: mouseY + 15 });
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
        setIsPanning(false);
    }
    const endX = e.clientX;
    const endY = e.clientY;
    const distance = Math.sqrt(Math.pow(endX - clickStartPos.current.x, 2) + Math.pow(endY - clickStartPos.current.y, 2));
    
    if (distance > 5) return; // It's a drag, not a click

    // It was a click, now do hit detection
    const canvas = canvasRef.current;
    const container = containerRef.current;
        if (!canvas || !container || !visibleChanges.length || showHeatmap) {
      onSelectChange(null);
      return;
    }

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (sliderActive) {
        const sliderThresholdPx = (sliderPosition / 100) * rect.width;
        if (mouseX < sliderThresholdPx) {
            onSelectChange(null);
            return;
        }
    }

    const imageX = (mouseX - transform.x) / transform.scale;
    const imageY = (mouseY - transform.y) / transform.scale;
    
    let clickedChange: DetectedChange | null = null;
    // Reverse loop to get the top-most item
    for (let i = visibleChanges.length - 1; i >= 0; i--) {
        const change = visibleChanges[i];
        const [x_min, y_min, x_max, y_max] = change.box;
        const rectX = x_min * canvas.width;
        const rectY = y_min * canvas.height;
        const rectW = (x_max - x_min) * canvas.width;
        const rectH = (y_max - y_min) * canvas.height;

        if (imageX >= rectX && imageX <= rectX + rectW && imageY >= rectY && imageY <= rectY + rectH) {
            clickedChange = change;
            break;
        }
    }
    
    // If the clicked change is already selected, deselect it. Otherwise select it.
    if (clickedChange && clickedChange.id === selectedChangeId) {
        onSelectChange(null);
    } else {
        onSelectChange(clickedChange ? clickedChange.id : null);
    }
  };

  const handleMouseLeave = () => {
      setIsPanning(false);
      setHoveredChange(null);
  }

  const getPlaceholderText = () => {
      if (appMode === AppMode.FORESIGHT_REALITY_INPUT) return "AI Prophecy generated. Upload your 'Reality' image for Delta Analysis.";
      if (appMode === AppMode.FORESIGHT_INPUT) return "Ready for Strategic Foresight or Video Generation.";
      return "Awaiting Visual Data";
  }

  return (
    <div ref={containerRef} onPointerMove={handlePointerMove} onMouseLeave={handleMouseLeave} className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden rounded-lg transition-all duration-500 ${isLoading ? 'processing-pulse' : 'border-transparent'}`}>
        <AnimatePresence>
            {simulationViz && (
                 <motion.div 
                    key="flowviz"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-f1-dark"
                 >
                    <Suspense fallback={
                        <div className="w-full h-full flex items-center justify-center bg-f1-dark text-f1-text-darker">
                            <p className="animate-pulse">Loading FlowViz Simulation...</p>
                        </div>
                    }>
                        <FlowVizRenderer data={simulationViz} />
                    </Suspense>
                 </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
            {error && <motion.div key="error-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center z-10 p-4"><ErrorIcon className="mx-auto text-red-500" /><p className="mt-4 text-lg font-semibold text-f1-text-light dark:text-f1-text">Operation Failed</p><p className="mt-1 text-sm text-f1-text-darker-light dark:text-f1-text-darker">{error}</p></motion.div>}
        </AnimatePresence>
        <AnimatePresence>
            {isLoading && !error && (
                <motion.div key="loading-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-sm">
                  <div className="w-48 h-48 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <motion.circle
                        cx="50" cy="50" r="45"
                        stroke="rgba(0, 245, 212, 0.2)"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="50" cy="50" r="45"
                        stroke={'rgba(0, 245, 212, 1)'}
                        strokeWidth="4"
                        fill="transparent"
                        strokeLinecap="round"
                        pathLength={1}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progress / 100 }}
                        transition={{ duration: 0.5, ease: "linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                        <p className={`text-4xl font-bold text-f1-accent-cyan tracking-tighter`}>
                            {Math.round(progress)}<span className="text-2xl">%</span>
                        </p>
                    </div>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-f1-text-light dark:text-f1-text text-center">
                      <span className="loading-ellipsis">{getLoadingStatusText(processingState, progress, appMode, props.statusText)}</span>
                  </p>
                </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
            {!mainDisplayImage && !isLoading && !error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative text-center text-f1-text-darker-light dark:text-f1-text-darker z-10 p-4">
                    <div className="absolute inset-0 blueprint-grid -z-10 rounded-lg"></div>
                    <WireframeCarIcon className="mx-auto text-f1-text-darker-light dark:text-f1-text-darker subtle-pulse" />
                    <p className="mt-4 font-semibold text-lg">{getPlaceholderText()}</p>
                    <p className="text-sm">Upload images or use live camera to begin analysis.</p>
                </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
            {mainDisplayImage && !imageLoaded && !isLoading && !error && (
                <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bg-gray-300 dark:bg-f1-light-dark animate-pulse rounded-lg"
                    style={{ width: canvasSize.width, height: canvasSize.height }}
                />
            )}
        </AnimatePresence>
        
        {/* Tooltip for hovered change */}
        <AnimatePresence>
            {hoveredChange && (
                <motion.div
                    key="tooltip"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
                    className="absolute z-40 p-2 max-w-xs bg-f1-dark/80 backdrop-blur-sm text-white rounded-md text-xs pointer-events-none shadow-lg border border-gray-500/50"
                >
                    <p className="font-bold whitespace-nowrap">{hoveredChange.description}</p>
                    <p className={`font-semibold ${hoveredChange.impact === 'High' ? 'text-red-400' : hoveredChange.impact === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                        Impact: {hoveredChange.impact}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Rival Ghost Info Overlay */}
        <AnimatePresence>
            {rivalGhost && (
                <motion.div
                    key="rival-ghost-info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-4 left-4 right-4 sm:left-auto sm:max-w-sm z-30 p-3 bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-md rounded-lg border border-gray-300/50 dark:border-gray-700/50 shadow-lg"
                >
                    <h4 className="text-sm font-bold text-f1-accent-magenta">Rival Ghost Active: {rivalGhost.teamName}</h4>
                    <p className="text-xs mt-1 text-f1-text-darker-light dark:text-f1-text-darker">
                        <span className="font-semibold">AI Rationale:</span> {rivalGhost.rationale}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {hasRoboflowOverlay && (
                <motion.div
                    key="roboflow-badge"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 right-4 z-30 px-3 py-2 rounded-md bg-black/60 text-xs font-semibold text-f1-accent-cyan border border-f1-accent-cyan/40"
                >
                    Roboflow visualization active · Component boxes hidden
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showComparisonSelector && !isLoading && !error && (
                <motion.div
                    key="comparison-selector"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-4 z-30 flex flex-wrap gap-2 max-w-md"
                >
                    {comparisonOptions.map((option) => {
                        const label = formatComparisonLabel(option.afterIndex, option.beforeIndex);
                        const isActive = option.afterIndex === activeAfterIndex;
                        return (
                            <button
                                key={`comparison-pill-${option.afterIndex}-${option.beforeIndex}`}
                                type="button"
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                    isActive
                                        ? 'bg-f1-accent-cyan text-f1-dark border-f1-accent-cyan shadow-lg shadow-f1-accent-cyan/30'
                                        : 'bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 text-f1-text-light dark:text-f1-text border-gray-300/60 dark:border-gray-700/60 hover:border-f1-accent-cyan'
                                }`}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onComparisonChange?.(option.afterIndex);
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Zoom Controls Overlay */}
        <AnimatePresence>
        {mainDisplayImage && imageLoaded && !isLoading && !error && (
            <motion.div 
                key="zoom-controls"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 right-4 z-30 flex flex-col gap-2"
            >
                <button onClick={handleZoomIn} title="Zoom In" className="p-2 bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-sm rounded-full text-f1-text-light dark:text-f1-text hover:bg-f1-accent-cyan hover:text-f1-dark transition-colors border border-gray-300/50 dark:border-gray-700/50">
                    <ZoomInIcon className="w-5 h-5" />
                </button>
                <button onClick={handleZoomOut} title="Zoom Out" disabled={transform.scale <= 1} className="p-2 bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-sm rounded-full text-f1-text-light dark:text-f1-text hover:bg-f1-accent-cyan hover:text-f1-dark transition-colors border border-gray-300/50 dark:border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ZoomOutIcon className="w-5 h-5" />
                </button>
                <button onClick={handleResetZoom} title="Reset View" disabled={transform.scale <= 1 && transform.x === 0 && transform.y === 0 && !selectedChangeId} className="p-2 bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-sm rounded-full text-f1-text-light dark:text-f1-text hover:bg-f1-accent-cyan hover:text-f1-dark transition-colors border border-gray-300/50 dark:border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <FitToScreenIcon className="w-5 h-5" />
                </button>
            </motion.div>
        )}
        </AnimatePresence>
        
        <motion.div
            ref={transformedContainerRef}
            className={`absolute transition-opacity duration-300 ${error || isLoading || !imageLoaded || simulationViz ? 'opacity-0' : 'opacity-100'}`}
            animate={{ scale: transform.scale, x: transform.x, y: transform.y }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{
                width: canvasSize.width,
                height: canvasSize.height,
                cursor: isPanning ? 'grabbing' : (transform.scale > 1 ? 'grab' : (result ? 'crosshair' : 'default')),
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <div className="relative w-full h-full group">
                {/* Single main image or Before Image for slider */}
                {showBaseImagery && (
                    <img
                        src={afterImage && beforeImage ? beforeImage.previewUrl : mainDisplayImage?.previewUrl}
                        className="absolute top-0 left-0 w-full h-full object-contain"
                        style={{ opacity: imageLoaded ? 1 : 0 }}
                        onLoad={() => !imageLoaded && setImageLoaded(true)} // only fire once
                        alt="Current visual state"
                    />
                )}

                 {/* After Image (clipped) for slider */}
                {sliderActive && afterImage && (
                    <img
                        src={afterImage.previewUrl}
                        className="absolute top-0 left-0 w-full h-full object-contain"
                        style={{
                            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                            opacity: imageLoaded ? 1 : 0
                        }}
                        alt="After state"
                    />
                )}

                {hasRoboflowOverlay && roboflowBeforeOverlay && (
                    <img
                        src={roboflowBeforeOverlay}
                        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                        style={{
                            ...(beforeOverlayClipStyle || {}),
                            opacity: imageLoaded ? 1 : 0
                        }}
                        alt="Roboflow baseline overlay"
                    />
                )}

                {hasRoboflowOverlay && roboflowAfterOverlay && (
                    <img
                        src={roboflowAfterOverlay}
                        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                        style={{
                            ...(overlayClipStyle || {}),
                            opacity: imageLoaded ? 1 : 0
                        }}
                        alt="Roboflow object diff overlay"
                    />
                )}

                {maskOverlayUrl && (
                    <img
                        src={maskOverlayUrl}
                        className="absolute top-0 left-0 w-full h-full object-contain mix-blend-lighten pointer-events-none"
                        style={{
                            ...(overlayClipStyle || {}),
                            opacity: 0.75
                        }}
                        alt="Mask R-CNN map overlay"
                    />
                )}
                 {/* Canvases on top */}
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={shouldRenderAnnotations ? overlayClipStyle : { display: 'none' }}
                />
                <canvas ref={heatmapCanvasRef} className="absolute top-0 left-0 mix-blend-screen pointer-events-none" style={overlayClipStyle} />
                <canvas ref={ghostCanvasRef} className="absolute top-0 left-0 pointer-events-none" style={overlayClipStyle} />

                {/* Slider control */}
                {sliderActive && !isLoading && (
                    <div
                        className="absolute inset-y-0 w-full z-10"
                        style={{ left: 0 }}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            updateSliderFromPointer(event.clientX);
                        }}
                    >
                        <motion.div
                            className="absolute top-0 bottom-0 cursor-ew-resize flex items-center group/slider"
                            style={{ left: `${sliderPosition}%`, marginLeft: '-20px' }}
                            drag="x"
                            dragConstraints={transformedContainerRef}
                            dragElastic={0.1}
                            dragMomentum={false}
                            onPointerDown={(event) => event.stopPropagation()}
                            onDrag={(event, info) => {
                                updateSliderFromPointer(info.point.x);
                            }}
                        >
                            <div className="scanner-handle-grip relative flex flex-col items-center justify-center gap-1.5 transition-transform group-hover/slider:scale-110">
                              <div />
                              <div />
                              <div />
                            </div>
                            <div className="scanner-handle-line absolute left-[19px] h-full"></div>
                        </motion.div>
                    </div>
                )}
            </div>
        </motion.div>
    </div>
  );
};

export default memo(ResultDisplay);