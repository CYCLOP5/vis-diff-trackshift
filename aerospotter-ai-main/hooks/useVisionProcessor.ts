import { useState, useCallback, useRef } from 'react';
import { ImageFile, AnalysisResult, ProcessingState, DomainMode, ForesightResult, AppMode, ComparisonMode, TimelineSummary } from '../types';
import { generateForesight, analyzeDelta, analyzeImagesWithGemini, GeminiImageInput } from '../services/geminiService';
import { analyzeWithBackend } from '../services/backendClient';
import { resolveArtifactUrl } from '../utils/artifacts';

const MAX_MASK_SAMPLE_DIMENSION = 128;
const ACTIVE_PIXEL_THRESHOLD = 0.005; // 0.5%
const BRIGHTNESS_THRESHOLD = 12;
const ALPHA_THRESHOLD = 10;

const isImageMostlyBlack = async (blob: Blob): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
    }

    const imageUrl = URL.createObjectURL(blob);
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imageUrl;
        });

        const canvas = document.createElement('canvas');
        const scale = Math.min(
            1,
            MAX_MASK_SAMPLE_DIMENSION / Math.max(image.width, image.height || 1)
        );
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return false;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let activePixels = 0;
        const totalPixels = canvas.width * canvas.height;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < ALPHA_THRESHOLD) continue;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > BRIGHTNESS_THRESHOLD) {
                activePixels++;
                if (activePixels > totalPixels * ACTIVE_PIXEL_THRESHOLD) {
                    return false;
                }
            }
        }
        return true;
    } catch (error) {
        console.warn('Unable to inspect artifact contents; defaulting to include mask.', error);
        return false;
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
};

const fetchArtifactAsFile = async (url: string, filename: string): Promise<File | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Failed to fetch artifact for Gemini report:', url, response.status);
            return null;
        }
        const blob = await response.blob();
        const type = blob.type || 'image/png';
        return new File([blob], filename, { type });
    } catch (error) {
        console.warn('Artifact fetch error:', error);
        return null;
    }
};

const MIME_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

const canUseCanvas = typeof window !== 'undefined' && typeof document !== 'undefined';

interface CompressionOptions {
    maxDimension: number;
    mimeType: string;
    quality?: number;
}

const loadImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        image.src = url;
    });
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> => {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
};

const generateCompressedFile = async (file: File, options: CompressionOptions): Promise<File> => {
    if (!canUseCanvas || !file.type.startsWith('image/')) {
        return file;
    }

    try {
        const image = await loadImageElement(file);
        const { width, height } = image;
        const longestSide = Math.max(width, height);
        const shouldDownscale = longestSide > options.maxDimension;
        const shouldConvertType = options.mimeType !== file.type;

        if (!shouldDownscale && !shouldConvertType) {
            return file;
        }

        const scale = shouldDownscale ? options.maxDimension / longestSide : 1;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return file;
        }
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        const blob = await canvasToBlob(canvas, options.mimeType, options.quality);
        if (!blob) {
            return file;
        }
        const extension = MIME_EXTENSION[options.mimeType] || 'img';
        const newName = file.name.replace(/\.[^.]+$/, '') + `-cmp.${extension}`;
        return new File([blob], newName, { type: options.mimeType });
    } catch (error) {
        console.warn('Failed to compress Gemini asset:', error);
        return file;
    }
};

const determineCompressionOptions = (label?: string): CompressionOptions => {
    const normalized = (label || '').toLowerCase();
    if (normalized.includes('frame')) {
        return { maxDimension: 1600, mimeType: 'image/jpeg', quality: 0.78 };
    }
    if (normalized.includes('heatmap')) {
        return { maxDimension: 1400, mimeType: 'image/jpeg', quality: 0.75 };
    }
    if (normalized.includes('mask')) {
        return { maxDimension: 1400, mimeType: 'image/png' };
    }
    if (normalized.includes('overlay')) {
        return { maxDimension: 1600, mimeType: 'image/jpeg', quality: 0.75 };
    }
    return { maxDimension: 1600, mimeType: 'image/jpeg', quality: 0.8 };
};

const compressGeminiInputs = async (inputs: GeminiImageInput[]): Promise<GeminiImageInput[]> => {
    if (!canUseCanvas || inputs.length === 0) {
        return inputs;
    }
    return Promise.all(
        inputs.map(async (input) => {
            if (!input.file || !(input.file instanceof File)) {
                return input;
            }
            const options = determineCompressionOptions(input.label);
            const compressedFile = await generateCompressedFile(input.file, options);
            if (compressedFile === input.file) {
                return input;
            }
            return { ...input, file: compressedFile };
        })
    );
};

const collectGeminiArtifacts = async (
    timeline?: TimelineSummary,
    domain?: DomainMode
): Promise<GeminiImageInput[]> => {
    const files: GeminiImageInput[] = [];
    const comparisons = timeline?.comparisons;
    if (!comparisons || comparisons.length === 0) {
        return files;
    }
    const latest = comparisons[comparisons.length - 1];
    const isManufacturing = domain === 'Manufacturing';
    const isInfrastructure = domain === 'Infrastructure';

    const sources = [] as { src?: string | null; filename: string; label: string }[];
    sources.push(
        { src: latest.alignmentArtifacts?.overlay, filename: 'alignment-overlay.png', label: 'Alignment overlay artifact' },
        { src: latest.objectDiffArtifacts?.overlay, filename: 'yolo-delta.png', label: 'RF-DETR-Seg delta overlay artifact' },
        { src: latest.maskArtifacts?.overlay, filename: 'mask-overlay.png', label: 'Mask R-CNN damage overlay' },
        { src: latest.pcbMaskArtifacts?.overlay, filename: 'pcb-overlay.png', label: 'RF-DETR-Seg manufacturing overlay' },
        { src: latest.pcbMaskArtifacts?.mask, filename: 'pcb-mask.png', label: 'RF-DETR-Seg binary mask' },
        { src: latest.pcbMaskArtifacts?.heatmap, filename: 'pcb-heatmap.png', label: 'RF-DETR-Seg heatmap' },
    );
    if (isInfrastructure) {
        sources.push(
            { src: latest.changeformerArtifacts?.overlay, filename: 'changeformer-overlay.png', label: 'ChangeFormer structural overlay' },
            { src: latest.changeformerArtifacts?.mask, filename: 'changeformer-mask.png', label: 'ChangeFormer binary mask' },
            { src: latest.changeformerArtifacts?.heatmap, filename: 'changeformer-heatmap.png', label: 'ChangeFormer probability heatmap' },
        );
    }

    for (const source of sources) {
        const resolved = resolveArtifactUrl(source.src, latest.comparisonRoot);
        if (!resolved) continue;
        const file = await fetchArtifactAsFile(resolved, source.filename);
        if (!file) continue;
        files.push({ file, label: source.label });
    }

    if (latest.pcbMaskArtifacts?.summary) {
        const serialized = JSON.stringify(latest.pcbMaskArtifacts.summary, null, 2);
        const summaryFile = new File([serialized], 'pcb_cd_summary.json', { type: 'application/json' });
        files.push({ file: summaryFile, label: 'RF-DETR-Seg JSON summary', mimeType: 'application/json' });
    }
    if (isInfrastructure && latest.changeformerArtifacts?.summary) {
        const serialized = JSON.stringify(latest.changeformerArtifacts.summary, null, 2);
        const summaryFile = new File([serialized], 'changeformer_summary.json', { type: 'application/json' });
        files.push({ file: summaryFile, label: 'ChangeFormer JSON summary', mimeType: 'application/json' });
    }
    return files;
};

const limitFrameInputsForDomain = (inputs: GeminiImageInput[]): GeminiImageInput[] => inputs;

const parseGeminiError = (error: unknown): string => {
    if (error instanceof Error) {
        // Handle specific, non-JSON error messages first
        if (error.message.toLowerCase().includes('failed to fetch')) {
            return "Network connection failed. Please check your internet connection and try again.";
        }
        if (error.message.startsWith("API_KEY_ERROR:")) {
            return error.message.replace("API_KEY_ERROR:", "").trim();
        }
        if (error.message.includes("[GoogleGenerativeAI Error]")) {
            // Extract the user-friendly part of SDK-native errors
            const friendlyMessage = error.message.split(' with underlying error: ')[0];
            return friendlyMessage.replace('[GoogleGenerativeAI Error]: ', '');
        }

        // Attempt to parse JSON from the error message
        try {
            // Sometimes the message is just the JSON, sometimes it's prefixed.
            const jsonString = error.message.substring(error.message.indexOf('{'));
            const jsonError = JSON.parse(jsonString);
            const details = jsonError.error || jsonError;

            // Handle specific status codes/types
            if (details.status === 'UNAVAILABLE' || details.code === 503) {
                return "The model is currently overloaded. The request was retried automatically but failed. Please try again in a few moments.";
            }
             if (details.status === 'INVALID_ARGUMENT' || details.code === 400) {
                return `Invalid request: ${details.message}. Please check your inputs.`;
            }
            if (details.status === 'PERMISSION_DENIED' || details.code === 403) {
                 return `Permission Denied. Please check if your API key is valid and has the correct permissions.`;
            }

            // Generic message from the parsed JSON
            if (details.message) {
                return details.message;
            }
            
            return "An unknown API error occurred.";
        } catch (e) {
            // If parsing fails, it's a plain text error message
            return error.message;
        }
    }
    // Fallback for non-Error objects
    return "An unexpected error occurred. Please check the console for details.";
};


const useVisionProcessor = () => {
  const [state, setState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.STANDARD_ANALYSIS);
  const [foresightResult, setForesightResult] = useState<ForesightResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  const setProgressWithStatus = (p: number, s: string) => {
    setProgress(p);
    setStatusText(s);
  };


    const processImages = useCallback(async (imageFiles: ImageFile[], domain: DomainMode, comparisonMode: ComparisonMode) => {
        if (imageFiles.length < 2) {
            setError("At least two images are required for standard analysis.");
            return;
        }

        const shouldUseBackend = domain === 'F1' || domain === 'Manufacturing' || domain === 'Infrastructure';
        setResult(null);
        setError(null);

        if (!shouldUseBackend) {
            setState(ProcessingState.SUMMARIZING);
            setProgressWithStatus(5, `Routing frames to Gemini-only analysis for ${domain}...`);
            try {
                let frameInputs: GeminiImageInput[] = imageFiles.map((img, index) => {
                    let label = `Timeline frame ${index + 1}`;
                    if (index === 0) label = 'Baseline frame';
                    else if (index === imageFiles.length - 1) label = 'Latest comparison frame';
                    return { file: img.file, label };
                });
                frameInputs = limitFrameInputsForDomain(frameInputs);
                const geminiResult = await analyzeImagesWithGemini(frameInputs, domain, setProgressWithStatus);
                setProgress(100);
                setStatusText('Done');
                setResult(geminiResult);
                setState(ProcessingState.DONE);
            } catch (e) {
                setError(parseGeminiError(e));
                setState(ProcessingState.ERROR);
                setProgress(0);
                setStatusText('');
            }
            return;
        }

        setState(ProcessingState.ALIGNING);
        setProgress(5);
        setStatusText('Uploading imagery and initializing backend job...');

        try {
            const analysisResult = await analyzeWithBackend(imageFiles, domain, comparisonMode, setProgressWithStatus);
            let enrichedResult: AnalysisResult = analysisResult;

            try {
                setProgressWithStatus(92, 'Gemini drafting inspection report...');
                let artifactFiles = await collectGeminiArtifacts(analysisResult.timeline, domain);
                let frameInputs: GeminiImageInput[] = imageFiles.map((img, index) => {
                    let label = `Timeline frame ${index + 1}`;
                    if (index === 0) label = 'Before baseline frame';
                    else if (index === imageFiles.length - 1) label = 'After comparison frame';
                    return { file: img.file, label };
                });
                frameInputs = limitFrameInputsForDomain(frameInputs);
                if (domain === 'Manufacturing') {
                    artifactFiles = await compressGeminiInputs(artifactFiles);
                }
                let geminiInputFiles: GeminiImageInput[] = [...frameInputs, ...artifactFiles];
                if (domain === 'Manufacturing' && geminiInputFiles.length === 0) {
                    const fallbackPayload = {
                        summary: analysisResult.summary,
                        recommendations: analysisResult.recommendations,
                        changes: analysisResult.changes,
                    };
                    const fallbackBlob = JSON.stringify(fallbackPayload, null, 2);
                    const fallbackFile = new File([fallbackBlob], 'manufacturing_fallback.json', { type: 'application/json' });
                    geminiInputFiles = [{ file: fallbackFile, label: 'Manufacturing fallback manifest', mimeType: 'application/json' }];
                }
                if (geminiInputFiles.length > 0) {
                    const mapGeminiProgress = (progressValue: number, status: string) => {
                        const scaled = Math.min(99, 90 + progressValue * 0.1);
                        setProgressWithStatus(scaled, status);
                    };
                    const geminiReport = await analyzeImagesWithGemini(geminiInputFiles, domain, mapGeminiProgress);
                    enrichedResult = {
                        ...analysisResult,
                        summary: geminiReport.summary,
                        recommendations: geminiReport.recommendations,
                        llmChanges: geminiReport.changes,
                    };
                }
            } catch (geminiError) {
                console.error('Gemini report generation failed; falling back to backend summary.', geminiError);
            }

            setProgress(100);
            setStatusText('Done');
            setResult(enrichedResult);
            setState(ProcessingState.DONE);

        } catch (e) {
            const message = e instanceof Error ? e.message : 'Backend analysis failed.';
            setError(message);
            setState(ProcessingState.ERROR);
            setProgress(0);
            setStatusText('');
        }
    }, []);
  
  const startForesight = useCallback(async (imageFile: ImageFile, domain: DomainMode) => {
    setAppMode(AppMode.FORESIGHT_GENERATING);
    setState(ProcessingState.GENERATING);
    setProgress(0);
    setStatusText('Initializing...');
    setError(null);
    setResult(null);
    setForesightResult(null);

    try {
        const foresightData = await generateForesight(imageFile.file, domain, setProgressWithStatus);
        setProgress(100);
        setStatusText('Done');
        setForesightResult({
            rationale: foresightData.rationale,
            prophecyImageUrl: `data:image/png;base64,${foresightData.prophecyImageBase64}`
        });
        setAppMode(AppMode.FORESIGHT_REALITY_INPUT);
        setState(ProcessingState.DONE);
    } catch (e) {
        setError(parseGeminiError(e));
        setState(ProcessingState.ERROR);
        setAppMode(AppMode.FORESIGHT_INPUT);
        setProgress(0);
        setStatusText('');
    }
  }, []);

  const processDeltaAnalysis = useCallback(async (beforeImage: ImageFile, realityImage: ImageFile, prophecyUrl: string, domain: DomainMode) => {
    setAppMode(AppMode.DELTA_ANALYSIS);
    setState(ProcessingState.SUMMARIZING);
    setProgress(5);
    setStatusText('Initializing...');
    setError(null);
    setResult(null);
    
    try {
        const prophecyBlob = await fetch(prophecyUrl).then(res => res.blob());
        const analysisResult = await analyzeDelta(beforeImage.file, realityImage.file, prophecyBlob, domain, setProgressWithStatus);

        setProgress(100);
        setStatusText('Done');
        setResult(analysisResult);
        setState(ProcessingState.DONE);
    } catch (e) {
        setError(parseGeminiError(e));
        setState(ProcessingState.ERROR);
        setProgress(0);
        setStatusText('');
    }
  }, []);

  const reset = useCallback(() => {
    setState(ProcessingState.IDLE);
    setResult(null);
    setError(null);
    setAppMode(AppMode.STANDARD_ANALYSIS);
    setForesightResult(null);
    setProgress(0);
    setStatusText('');
  }, []);

  return { state, result, error, appMode, setAppMode, foresightResult, progress, statusText, processImages, startForesight, processDeltaAnalysis, reset };
};

export default useVisionProcessor;