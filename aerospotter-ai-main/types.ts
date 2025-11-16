

/**
 * Represents an uploaded image file with its metadata.
 */
export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  label: string;
}

/**
 * Defines the structure of a single detected visual change.
 */
export interface ChangeComparisonRef {
  beforeIndex: number;
  afterIndex: number;
  label: string;
}

export interface DetectedChange {
  id: string;
  description: string;
  box: [number, number, number, number]; // [x_min, y_min, x_max, y_max] normalized
  changeType: 'Structural' | 'Surface' | 'Spatial';
  confidence: number;
  interpretation: string;
  impact: 'Low' | 'Medium' | 'High';
  criticality: number; // Score from 1-10 indicating urgency/importance
  estimatedCost: number; // Estimated cost in USD
  performanceGain: string; // e.g., "+5 points downforce", "-0.2s lap time", "+10% efficiency"
  specialistInsights?: {
    aero?: string;
    data?: string;
  };
  redFlags?: string[];
  suggestedActions?: string[];
  suggestedQuestions?: string[];
  comparisonRef?: ChangeComparisonRef;
}

/**
 * Defines the structure for the AI-generated summary and analysis.
 */
export interface AISummary {
  summary: string;
  changes: DetectedChange[];
  recommendations: string[];
}

/**
 * Represents the complete result of a visual difference analysis.
 */
export type ComparisonMode = 'baseline' | 'consecutive';

export interface TimelineFrameMetadata {
  index: number;
  label?: string;
  originalName?: string;
  path?: string;
}

export interface TimelineComparisonMetadata {
  beforeIndex: number;
  afterIndex: number;
  comparisonRoot?: string;
  ssim?: number | null;
  alignmentArtifacts?: {
    overlay?: string | null;
    heatmap?: string | null;
  };
  objectDiffArtifacts?: {
    overlay?: string | null;
    roiDir?: string | null;
    roboflowVisualizations?: string[];
    componentDiffs?: TimelineComponentDiff[];
  };
  maskArtifacts?: {
    overlay?: string | null;
  };
  pcbMaskArtifacts?: {
    mask?: string | null;
    overlay?: string | null;
    heatmap?: string | null;
    summaryPath?: string | null;
    summary?: {
      coverage?: number;
      pixelsChanged?: number;
      regionCount?: number;
      regions?: TimelinePcbRegionSummary[];
    };
  };
  changeformerArtifacts?: {
    mask?: string | null;
    overlay?: string | null;
    heatmap?: string | null;
    summary?: {
      coverage?: number;
      pixelsChanged?: number;
      regionCount?: number;
      regions?: TimelinePcbRegionSummary[];
      globalMeanProbability?: number;
      globalMaxProbability?: number;
    };
  };
}

export interface TimelineComponentDiff {
  component: string;
  ssim?: number | null;
  confidence?: number | null;
  changed?: boolean;
}

export interface TimelinePcbRegionSummary {
  id?: string;
  label?: string;
  pixelCount?: number;
  areaRatio?: number;
  bbox?: [number, number, number, number];
  bboxNormalized?: [number, number, number, number];
  centroidNormalized?: [number, number];
  confidence?: number;
  source?: string;
  meanProbability?: number;
  maxProbability?: number;
}

export interface TimelineSummary {
  mode: ComparisonMode;
  baselineIndex: number;
  frames: TimelineFrameMetadata[];
  comparisons: TimelineComparisonMetadata[];
}

export interface AnalysisResult extends AISummary {
  isDemoMode: boolean;
  jobId?: string;
  timeline?: TimelineSummary;
  llmChanges?: DetectedChange[];
}

/**
 * Enum for tracking the current state of the analysis process.
 */
export enum ProcessingState {
  IDLE = 'IDLE',
  ALIGNING = 'ALIGNING',
  DETECTING = 'DETECTING',
  SUMMARIZING = 'SUMMARIZING',
  GENERATING = 'GENERATING', // New state for foresight/ghost
  SIMULATING = 'SIMULATING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

/**
 * Represents the different domain modes for tailoring AI analysis.
 */
export type DomainMode = 'F1' | 'Manufacturing' | 'Infrastructure' | 'QA';

/**
 * Defines the overall application mode to handle different workflows.
 */
export enum AppMode {
    STANDARD_ANALYSIS = 'STANDARD_ANALYSIS',
    FORESIGHT_INPUT = 'FORESIGHT_INPUT',
    FORESIGHT_GENERATING = 'FORESIGHT_GENERATING',
    FORESIGHT_REALITY_INPUT = 'FORESIGHT_REALITY_INPUT',
  DELTA_ANALYSIS = 'DELTA_ANALYSIS',
}

/**
 * Represents the result of a Strategic Foresight generation.
 */
export interface ForesightResult {
    prophecyImageUrl: string;
    rationale: string;
}

/**
 * Represents the data for the rival ghost car visualization.
 */
export interface RivalGhostData {
  url: string;
  rationale: string;
  teamName: string;
}

/**
 * Represents the data needed for the live 3D "FlowViz" simulation.
 */
export interface SimulationVizData {
    imageUrl: string;
    description: string;
}

/**
 * Defines the personas for the AI Engineering Crew.
 */
export type AIPersona = 'Aero Sameel' | 'Aero Shourya' | 'Aero Varun';

/**
 * Represents a single message in the interactive chat.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type?: 'briefing' | 'text';
  persona?: AIPersona;
  text?: string;
  changes?: DetectedChange[];
  sources?: Source[];
  generatedImage?: {
    url: string;
    prompt: string;
  };
  audioStatus?: 'generating' | 'done' | 'error';
  audioBase64?: string;
  isAutonomous?: boolean;
  liveTranscript?: string; // For live conversation
  isWarRoomMessage?: boolean;
  isTyping?: boolean;
  warRoom?: {
    messages: ChatMessage[];
    isFinished: boolean;
  };
}

/**
 * Represents a source citation from a grounded model response.
 */
export interface Source {
    uri: string;
    title: string;
}

/**
 * Data for a single simulated lap.
 */
export interface LapData {
    name: 'Reality' | 'Prophecy';
    lapTime: string;
    sector1: string;
    sector2: string;
    sector3: string;
    telemetry: number[]; // e.g., speed at various points on the track
}

/**
 * The final result from the race simulation model.
 */
export interface SimulationResult {
    commentary: string; // The final summary commentary
    winner: 'Reality' | 'Prophecy' | 'Tie';
    timeDelta: string;
    laps: [LapData, LapData];
}

/**
 * Live state for the simulation telemetry display.
 */
export interface SimulationData {
    realityTrace: number[];
    prophecyTrace: number[];
    finalResult: SimulationResult | null;
}

/**
 * Enum for tracking the state of the live conversation.
 */
export enum LiveStatus {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    LISTENING = 'LISTENING',
    SPEAKING = 'SPEAKING',
    ERROR = 'ERROR',
}