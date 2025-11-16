import {
  AnalysisResult,
  DetectedChange,
  DomainMode,
  ImageFile,
  ComparisonMode,
  TimelineSummary,
  TimelineFrameMetadata,
  TimelineComparisonMetadata,
  TimelineComponentDiff,
} from '../types';

interface BackendImageSize {
  width: number;
  height: number;
}

interface BackendAlignmentArtifacts {
  overlay?: string | null;
  heatmap?: string | null;
  [key: string]: string | null | undefined;
}

interface BackendAlignmentStage {
  summary?: { ssim?: number; [key: string]: any };
  report?: Record<string, any>;
  artifacts?: BackendAlignmentArtifacts | null;
  imageSize?: BackendImageSize | null;
}

interface BackendObjectDiffArtifacts {
  overlay?: string | null;
  paired_roi_dir?: string | null;
  roboflow_visualizations?: Record<string, string | null> | null;
}

interface BackendObjectDiffStage {
  summary?: { paired?: BackendYoloPair[]; [key: string]: any };
  report?: {
    paired?: BackendYoloPair[];
  };
  artifacts?: BackendObjectDiffArtifacts | null;
  imageSize?: BackendImageSize | null;
}

interface BackendMaskArtifacts {
  overlay?: string | null;
  raw?: string | null;
  [key: string]: string | null | undefined;
}

interface BackendMaskStage {
  summary?: { detections?: BackendMaskDetection[]; [key: string]: any };
  artifacts?: BackendMaskArtifacts | null;
  imageSize?: BackendImageSize | null;
}

interface BackendPcbRegion {
  id?: string;
  label?: string;
  bbox?: [number, number, number, number];
  bboxNormalized?: [number, number, number, number];
  centroidNormalized?: [number, number];
  pixelCount?: number;
  areaRatio?: number;
  confidence?: number;
  source?: string;
  meanProbability?: number;
  maxProbability?: number;
}

interface BackendPcbSummary {
  status?: string;
  coverage?: number;
  pixelsChanged?: number;
  regionCount?: number;
  regions?: BackendPcbRegion[];
}

interface BackendPcbArtifacts {
  mask?: string | null;
  overlay?: string | null;
  heatmap?: string | null;
  report?: string | null;
}

interface BackendPcbStage {
  summary?: BackendPcbSummary;
  artifacts?: BackendPcbArtifacts | null;
  imageSize?: BackendImageSize | null;
}

interface BackendChangeformerRegion extends BackendPcbRegion {
  meanProbability?: number;
  maxProbability?: number;
}

interface BackendChangeformerSummary {
  status?: string;
  coverage?: number;
  pixelsChanged?: number;
  regionCount?: number;
  regions?: BackendChangeformerRegion[];
  globalMeanProbability?: number;
  globalMaxProbability?: number;
}

interface BackendChangeformerArtifacts {
  mask?: string | null;
  overlay?: string | null;
  heatmap?: string | null;
  report?: string | null;
}

interface BackendChangeformerStage {
  summary?: BackendChangeformerSummary;
  artifacts?: BackendChangeformerArtifacts | null;
  imageSize?: BackendImageSize | null;
}

interface BackendPipelineStages {
  alignment?: BackendAlignmentStage;
  object_diff?: BackendObjectDiffStage;
  mask_rcnn?: BackendMaskStage;
  pcb_cd?: BackendPcbStage;
  changeformer_cd?: BackendChangeformerStage;
}

interface BackendFrameInfo {
  index: number;
  path?: string;
  originalName?: string;
}

interface BackendTimelineEntry {
  beforeIndex: number;
  afterIndex: number;
  beforePath?: string;
  afterPath?: string;
  comparisonRoot?: string;
  pipeline?: BackendPipelineStages;
}

interface BackendJobResponse {
  jobId: string;
  status: string;
  comparisonMode?: ComparisonMode;
  baselineIndex?: number;
  frames?: BackendFrameInfo[];
  timeline?: BackendTimelineEntry[];
  error?: { message?: string; stage?: string; stdout?: string; stderr?: string };
  pipeline?: BackendPipelineStages;
}

interface BackendYoloPair {
  class_name?: string;
  box_shared?: [number, number, number, number];
  changed?: boolean;
  ssim?: number;
  confidence?: number;
  llm_damage_notes?: string;
}

interface BackendMaskDetection {
  class_id: number;
  class_name?: string;
  bbox: [number, number, number, number];
  score?: number;
  mask_area?: number;
}

const DEFAULT_API_BASE = 'http://localhost:8000';
const API_BASE = import.meta.env.VITE_ORCHESTRATOR_URL || DEFAULT_API_BASE;
const MASK_CONFIDENCE_THRESHOLD = 0.85;

const normalizeBox = (
  box: [number, number, number, number],
  imageSize?: BackendImageSize | null,
  format: 'xyxy' | 'yxyx' = 'xyxy'
): [number, number, number, number] => {
  if (!box) {
    return [0, 0, 0, 0];
  }
  const [a, b, c, d] = box;
  const width = imageSize?.width || 1;
  const height = imageSize?.height || 1;
  if (format === 'xyxy') {
    return [a / width, b / height, c / width, d / height];
  }
  // yxyx -> convert to xyxy before normalising
  return [b / width, a / height, d / width, c / height];
};

const extractRoboflowVisualizations = (
  entries?: Record<string, string | null> | null
): string[] | undefined => {
  if (!entries) {
    return undefined;
  }
  const resolved = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, path]) => path)
    .filter((path): path is string => Boolean(path));
  return resolved.length ? resolved : undefined;
};

const summarizeComponentDiffs = (
  pairs?: BackendYoloPair[] | null
): TimelineComponentDiff[] | undefined => {
  if (!pairs?.length) {
    return undefined;
  }
  const summarized = pairs.map((pair) => ({
    component: pair.class_name || 'component',
    ssim: typeof pair.ssim === 'number' ? Number(pair.ssim.toFixed(4)) : undefined,
    confidence: typeof pair.confidence === 'number' ? Number(pair.confidence.toFixed(3)) : undefined,
    changed: Boolean(pair.changed),
  }));
  return summarized.length ? summarized : undefined;
};

const createYoloChanges = (
  pairs: BackendYoloPair[] = [],
  imageSize?: BackendImageSize | null
): DetectedChange[] =>
  pairs.map((pair, index) => {
    const changed = Boolean(pair.changed);
    return {
      id: `component-${index}`,
      description: pair.class_name || `Component ${index + 1}`,
      box: normalizeBox(pair.box_shared || [0, 0, 0, 0], imageSize),
      changeType: 'Structural',
      confidence: pair.confidence ?? 0.5,
      interpretation:
        pair.llm_damage_notes ||
        (changed ? 'SSIM indicates meaningful change vs. reference.' : 'Component stable relative to baseline.'),
      impact: changed ? 'High' : 'Low',
      criticality: changed ? 7 : 3,
      estimatedCost: changed ? 5000 : 0,
      performanceGain: 'N/A',
      specialistInsights: {
        aero: changed ? 'Investigate aero impact from detected delta.' : undefined,
        data: undefined,
      },
      redFlags: changed ? [`SSIM delta ${pair.ssim?.toFixed(3) ?? 'N/A'}`] : [],
      suggestedActions: changed
        ? [`Schedule inspection for ${pair.class_name || 'component'}.`]
        : [`Monitor ${pair.class_name || 'component'} for future deviations.`],
      suggestedQuestions: changed
        ? [`@Shourya what secondary checks do we need on ${pair.class_name || 'this component'}?`]
        : [],
    };
  });

const createMaskChanges = (
  detections: BackendMaskDetection[] = [],
  imageSize?: BackendImageSize | null
): DetectedChange[] =>
  detections
    .filter((det) => (det.score ?? 0) >= MASK_CONFIDENCE_THRESHOLD)
    .map((det, index) => ({
    id: `mask-${index}`,
    description: det.class_name || `Detection ${index + 1}`,
    box: normalizeBox(det.bbox, imageSize, 'yxyx'),
    changeType: 'Surface',
    confidence: det.score ?? 0.6,
    interpretation: 'Mask R-CNN detected localized surface anomaly.',
    impact: 'Medium',
    criticality: Math.min(10, Math.round((det.score ?? 0.6) * 10)),
    estimatedCost: 2500,
    performanceGain: 'N/A',
    specialistInsights: {
      aero: det.mask_area ? `Approx. affected pixels: ${det.mask_area}` : undefined,
    },
    redFlags: det.mask_area ? [`Mask size ${det.mask_area} px`] : [],
    suggestedActions: [`Validate ${det.class_name || 'mask region'} on the physical car.`],
    suggestedQuestions: [`@Varun what repair cost range suits ${det.class_name || 'this damage'}?`],
  }));

const createPcbChanges = (
  regions: BackendPcbRegion[] = [],
  imageSize?: BackendImageSize | null
): DetectedChange[] =>
  regions.map((region, index) => {
    const fallbackBox: [number, number, number, number] = [0, 0, 1, 1];
    const normalizedBox = region.bboxNormalized ||
      (region.bbox ? normalizeBox(region.bbox, imageSize) : fallbackBox);
    const areaRatio = region.areaRatio ?? 0;
    const confidence = region.confidence ?? Math.min(0.95, 0.6 + areaRatio * 5);
    const label = (region.label || region.id || '').toLowerCase();
    let impact: DetectedChange['impact'] = areaRatio > 0.02 ? 'High' : areaRatio > 0.008 ? 'Medium' : 'Low';
    const criticalDefects = ['missing_hole', 'mouse_bite', 'open_circuit', 'short', 'spur', 'spurious_copper'];
    const alwaysHighDefects = ['open_circuit', 'short', 'spur', 'spurious_copper'];
    if (criticalDefects.some((token) => label.includes(token))) {
      impact = alwaysHighDefects.some((token) => label.includes(token))
        ? 'High'
        : areaRatio > 0.02
          ? 'High'
          : 'Medium';
    }
    const coverageLabel = areaRatio ? `${(areaRatio * 100).toFixed(2)}% coverage` : 'Pixel delta detected';
    const pixelNote = region.pixelCount ? `${region.pixelCount.toLocaleString()} px` : undefined;
    return {
      id: region.id || `pcb-${index}`,
      description: `RF-DETR-Seg region ${index + 1}`,
      box: normalizedBox,
      changeType: 'Surface',
      confidence,
      interpretation:
        'PCB BIT change detection highlighted this anomaly relative to the baseline frame.',
      impact,
      criticality: impact === 'High' ? 8 : impact === 'Medium' ? 6 : 3,
      estimatedCost: Math.round(Math.max(1500, areaRatio * 50000)),
      performanceGain: 'N/A',
      specialistInsights: {
        data: `${coverageLabel}${pixelNote ? ` · ${pixelNote}` : ''}`,
      },
      redFlags: [coverageLabel].concat(pixelNote ? [pixelNote] : []),
      suggestedActions: [`Flag PCB zone ${index + 1} for microscope validation.`],
      suggestedQuestions: [`@QA can we verify tolerances for zone ${index + 1}?`],
    };
  });

const createChangeformerChanges = (
  summary?: BackendChangeformerSummary,
  imageSize?: BackendImageSize | null
): DetectedChange[] => {
  if (!summary) {
    return [];
  }
  const baseRegions = summary.regions || [];
  const totalRegions = baseRegions.length;
  if (totalRegions === 0) {
    if ((summary.coverage ?? 0) <= 0) {
      return [];
    }
    const coveragePct = Number(((summary.coverage ?? 0) * 100).toFixed(2));
    return [
      {
        id: 'changeformer-aggregate',
        description: `ChangeFormer coverage ${coveragePct}%`,
        box: [0, 0, 1, 1],
        changeType: 'Spatial',
        confidence: summary.globalMaxProbability ?? 0.6,
        interpretation: `Transformer change detection shows ${coveragePct}% of pixels drifting vs. baseline.`,
        impact: coveragePct > 3 ? 'High' : coveragePct > 1 ? 'Medium' : 'Low',
        criticality: coveragePct > 3 ? 8 : coveragePct > 1 ? 6 : 4,
        estimatedCost: Math.round(Math.max(2000, coveragePct * 800)),
        performanceGain: 'N/A',
        specialistInsights: {
          data: `Global mean P=${summary.globalMeanProbability?.toFixed(3) ?? '—'}`,
        },
        redFlags: [`Coverage ${coveragePct}%`],
        suggestedActions: ['Overlay ChangeFormer mask on source imagery to localise stress.'],
        suggestedQuestions: ['@Infra what inspection tooling verifies this drift?'],
      },
    ];
  }

  return baseRegions.map((region, index) => {
    const fallbackBox: [number, number, number, number] = [0, 0, 1, 1];
    const normalizedBox =
      region.bboxNormalized ||
      (region.bbox ? normalizeBox(region.bbox, imageSize) : fallbackBox);
    const areaRatio = region.areaRatio ?? 0;
    const confidence =
      region.maxProbability ??
      region.meanProbability ??
      region.confidence ??
      summary.globalMaxProbability ??
      0.6;
    const probabilityLabel = region.meanProbability
      ? `μ=${region.meanProbability.toFixed(3)}`
      : undefined;
    const coverageLabel = `${(areaRatio * 100).toFixed(2)}% coverage`;
    const impact = areaRatio > 0.02 ? 'High' : areaRatio > 0.008 ? 'Medium' : 'Low';
    return {
      id: region.id || `changeformer-${index}`,
      description: region.label || `ChangeFormer region ${index + 1}`,
      box: normalizedBox,
      changeType: 'Spatial',
      confidence,
      interpretation: 'ChangeFormer transformer head flagged this structural drift zone.',
      impact,
      criticality: impact === 'High' ? 8 : impact === 'Medium' ? 6 : 4,
      estimatedCost: Math.round(Math.max(3000, areaRatio * 60000)),
      performanceGain: 'N/A',
      specialistInsights: {
        data: probabilityLabel
          ? `${coverageLabel} · ${probabilityLabel}`
          : coverageLabel,
      },
      redFlags: [coverageLabel],
      suggestedActions: [
        `Schedule infrastructure inspection for ${region.label || `region ${index + 1}`}.`,
      ],
      suggestedQuestions: ['@Infra what remediation is required for this span?'],
    };
  });
};

const formatComparisonLabel = (
  afterIndex: number,
  beforeIndex: number,
  mode: ComparisonMode
): string => {
  if (mode === 'consecutive') {
    return `Frame ${afterIndex + 1} vs Frame ${beforeIndex + 1}`;
  }
  return `Frame ${afterIndex + 1} vs Baseline`;
};

const labelTimelineChanges = (
  baseChanges: DetectedChange[],
  afterIndex: number,
  beforeIndex: number,
  mode: ComparisonMode,
  prefix: string
): DetectedChange[] => {
  const label = formatComparisonLabel(afterIndex, beforeIndex, mode);
  return baseChanges.map((change, idx) => ({
    ...change,
    id: `${prefix}-f${afterIndex}-${idx}`,
    description: `${change.description} · ${label}`,
    comparisonRef: {
      beforeIndex,
      afterIndex,
      label,
    },
  }));
};

const collectTimelineChanges = (job: BackendJobResponse): DetectedChange[] => {
  if (!job.timeline?.length) {
    return [];
  }
  const mode = job.comparisonMode ?? 'baseline';
  return job.timeline.flatMap((entry) => {
    const timelinePipeline = entry.pipeline;
    if (!timelinePipeline) {
      return [];
    }
    const yoloPairs =
      timelinePipeline.object_diff?.report?.paired ||
      timelinePipeline.object_diff?.summary?.paired ||
      [];
    const maskDetections = timelinePipeline.mask_rcnn?.summary?.detections || [];
    const pcbRegions = timelinePipeline.pcb_cd?.summary?.regions || [];
    const changeformerSummary = timelinePipeline.changeformer_cd?.summary;

    const pcbChanges = labelTimelineChanges(
      createPcbChanges(pcbRegions, timelinePipeline.pcb_cd?.imageSize),
      entry.afterIndex,
      entry.beforeIndex,
      mode,
      'pcb'
    );

    const yoloChanges = labelTimelineChanges(
      createYoloChanges(yoloPairs, timelinePipeline.object_diff?.imageSize),
      entry.afterIndex,
      entry.beforeIndex,
      mode,
      'RF-DETR-Seg'
    );

    const maskChanges = labelTimelineChanges(
      createMaskChanges(maskDetections, timelinePipeline.mask_rcnn?.imageSize),
      entry.afterIndex,
      entry.beforeIndex,
      mode,
      'mask'
    );

    const changeformerChanges = labelTimelineChanges(
      createChangeformerChanges(changeformerSummary, timelinePipeline.changeformer_cd?.imageSize),
      entry.afterIndex,
      entry.beforeIndex,
      mode,
      'changeformer'
    );

    return [...pcbChanges, ...yoloChanges, ...maskChanges, ...changeformerChanges];
  });
};

const buildTimelineSummary = (job: BackendJobResponse): TimelineSummary | undefined => {
  const frames: TimelineFrameMetadata[] = (job.frames || []).map((frame) => ({
    index: frame.index,
    label: `Frame ${frame.index + 1}`,
    originalName: frame.originalName,
    path: frame.path,
  }));

  const comparisons: TimelineComparisonMetadata[] = (job.timeline || []).map((entry) => {
    const alignmentArtifacts = entry.pipeline?.alignment?.artifacts;
    const objectDiffArtifacts = entry.pipeline?.object_diff?.artifacts;
    const maskArtifacts = entry.pipeline?.mask_rcnn?.artifacts;
    const pcbStage = entry.pipeline?.pcb_cd;
    const pcbArtifacts = pcbStage?.artifacts;
    const pcbSummary = pcbStage?.summary;
    const changeformerStage = entry.pipeline?.changeformer_cd;
    const changeformerArtifacts = changeformerStage?.artifacts || changeformerStage?.summary
      ? {
          mask: changeformerStage?.artifacts?.mask,
          overlay: changeformerStage?.artifacts?.overlay,
          heatmap: changeformerStage?.artifacts?.heatmap,
          summary: changeformerStage?.summary,
        }
      : undefined;
    const maskDetections = entry.pipeline?.mask_rcnn?.summary?.detections || [];
    const hasMaskOverlay = Boolean(
      maskArtifacts?.overlay &&
        maskDetections.some((det) => (det.score ?? 0) >= MASK_CONFIDENCE_THRESHOLD)
    );
    return {
      beforeIndex: entry.beforeIndex,
      afterIndex: entry.afterIndex,
      comparisonRoot: entry.comparisonRoot,
      ssim: entry.pipeline?.alignment?.summary?.ssim ?? null,
      alignmentArtifacts: alignmentArtifacts
        ? {
            overlay: alignmentArtifacts.overlay,
            heatmap: alignmentArtifacts.heatmap,
          }
        : undefined,
      objectDiffArtifacts: objectDiffArtifacts
        ? {
            overlay: objectDiffArtifacts.overlay,
            roiDir: objectDiffArtifacts.paired_roi_dir,
            roboflowVisualizations: extractRoboflowVisualizations(
              objectDiffArtifacts.roboflow_visualizations
            ),
            componentDiffs: summarizeComponentDiffs(
              entry.pipeline?.object_diff?.report?.paired ||
                entry.pipeline?.object_diff?.summary?.paired
            ),
          }
        : undefined,
      maskArtifacts:
        hasMaskOverlay && maskArtifacts?.overlay
          ? {
              overlay: maskArtifacts.overlay,
            }
          : undefined,
      pcbMaskArtifacts:
        pcbArtifacts || pcbSummary
          ? {
              mask: pcbArtifacts?.mask,
              overlay: pcbArtifacts?.overlay,
              heatmap: pcbArtifacts?.heatmap,
              summaryPath: pcbArtifacts?.report,
              summary: pcbSummary,
            }
          : undefined,
      changeformerArtifacts,
    };
  });

  if (!frames.length && !comparisons.length) {
    return undefined;
  }

  return {
    mode: job.comparisonMode ?? 'baseline',
    baselineIndex: job.baselineIndex ?? 0,
    frames,
    comparisons,
  };
};

const assembleAnalysisResult = (job: BackendJobResponse, domain: DomainMode): AnalysisResult => {
  const pipeline = job.pipeline || {};
  const fallbackYoloPairs =
    pipeline.object_diff?.report?.paired || pipeline.object_diff?.summary?.paired || [];
  const fallbackMaskDetections = pipeline.mask_rcnn?.summary?.detections || [];
  const fallbackPcbRegions = pipeline.pcb_cd?.summary?.regions || [];
  const fallbackChangeformerSummary = pipeline.changeformer_cd?.summary;

  const timelineChanges = collectTimelineChanges(job);
  const fallbackChanges = [
    ...createPcbChanges(fallbackPcbRegions, pipeline.pcb_cd?.imageSize),
    ...createYoloChanges(fallbackYoloPairs, pipeline.object_diff?.imageSize),
    ...createMaskChanges(fallbackMaskDetections, pipeline.mask_rcnn?.imageSize),
    ...createChangeformerChanges(fallbackChangeformerSummary, pipeline.changeformer_cd?.imageSize),
  ];
  const changes = timelineChanges.length ? timelineChanges : fallbackChanges;
  const hasMaskChanges = timelineChanges.length
    ? timelineChanges.some((change) => change.id.startsWith('mask'))
    : fallbackMaskDetections.length > 0;

  const pcbRegionCount = pipeline.pcb_cd?.summary?.regionCount ?? 0;
  const pcbCoverage = pipeline.pcb_cd?.summary?.coverage ?? 0;
  const pcbCoveragePct = Math.round(pcbCoverage * 1000) / 10;
  const changeformerRegionCount = pipeline.changeformer_cd?.summary?.regionCount ?? 0;
  const changeformerCoverage = pipeline.changeformer_cd?.summary?.coverage ?? 0;
  const changeformerCoveragePct = Math.round(changeformerCoverage * 1000) / 10;

  const changedComponents = changes.filter((change) => change.impact === 'High').length;

  const recommendations: string[] = [];
  if (changedComponents > 0) {
    recommendations.push(
      `Prioritise inspection of ${changedComponents} component(s) flagged by SSIM/RF-DETR-Seg.`
    );
  } else {
    recommendations.push('No high-impact structural deltas detected; continue baseline monitoring.');
  }
  if (pcbRegionCount) {
    recommendations.push(
      `Review RF-DETR-Seg manufacturing mask (~${pcbCoveragePct}% coverage) before releasing to Gemini.`
    );
  } else if (pcbCoverage > 0) {
    recommendations.push(
      `RF-DETR-Seg detected low-level PCB drift (~${pcbCoveragePct}% coverage); spot-check the suspect zones.`
    );
  }
  if (changeformerRegionCount) {
    recommendations.push(
      `Inspect ${changeformerRegionCount} ChangeFormer structural region(s) before clearing infrastructure alert.`
    );
  } else if (changeformerCoverage > 0.01) {
    recommendations.push(
      `Review ChangeFormer heatmap (~${changeformerCoveragePct}% coverage) to localise infrastructure stress.`
    );
  }
  if (hasMaskChanges) {
    recommendations.push('Review Mask R-CNN overlay for precise damage contours.');
  }
  recommendations.push('Use backend artifacts for engineering deep dives or export packages.');

  let summary: string;
  if (domain === 'Manufacturing') {
    if (pcbRegionCount > 0) {
      summary = `RF-DETR-Seg flagged ${pcbRegionCount} manufacturing defect${pcbRegionCount > 1 ? 's' : ''} (~${pcbCoveragePct}% coverage).`;
    } else if (pcbCoverage > 0) {
      summary = `RF-DETR-Seg detected ~${pcbCoveragePct}% low-level PCB drift without discrete regions.`;
    } else {
      summary = 'RF-DETR-Seg reports no manufacturing anomalies versus baseline.';
    }
  } else if (domain === 'Infrastructure') {
    if (changeformerRegionCount > 0) {
      summary = `ChangeFormer highlighted ${changeformerRegionCount} infrastructure drift region${changeformerRegionCount > 1 ? 's' : ''}.`;
    } else if (changeformerCoverage > 0) {
      summary = `ChangeFormer heatmap shows ~${changeformerCoveragePct}% diffuse drift; monitor the span.`;
    } else {
      summary = 'ChangeFormer reports no structural drift versus baseline.';
    }
  } else if (changedComponents) {
    summary = `Detected ${changedComponents} structural changes in ${domain} mode.`;
  } else {
    summary = `No major deltas found for ${domain} mode. Alignment + SSIM agree with baseline.`;
  }

  return {
    summary,
    changes,
    recommendations,
    isDemoMode: false,
    jobId: job.jobId,
    timeline: buildTimelineSummary(job),
  };
};

export const analyzeWithBackend = async (
  imageFiles: ImageFile[],
  domain: DomainMode,
  comparisonMode: ComparisonMode,
  setProgress: (percentage: number, status: string) => void
): Promise<AnalysisResult> => {
  if (imageFiles.length < 2) {
    throw new Error('At least two images are required for backend analysis.');
  }

  setProgress(15, 'Uploading ordered frames to backend orchestrator...');
  const formData = new FormData();
  imageFiles.forEach((image) => {
    formData.append('frames', image.file, image.file.name);
  });
  formData.append('domain', domain);
  formData.append('comparisonMode', comparisonMode);
  formData.append('baselineIndex', '0');

  const response = await fetch(`${API_BASE}/api/jobs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Backend analysis request failed.');
  }

  const progressLabel =
    domain === 'Manufacturing'
      ? 'Running RF-DETR-Seg manufacturing pipeline...'
      : domain === 'Infrastructure'
        ? 'Running ChangeFormer infrastructure pipeline...'
        : 'Running SSIM, RF-DETR-Seg, and Mask R-CNN pipelines...';
  setProgress(60, progressLabel);
  const job: BackendJobResponse = await response.json();
  if (job.status !== 'completed') {
    throw new Error(job.error?.message || 'Analysis job failed on the backend.');
  }
  setProgress(90, 'Synthesizing engineering brief...');
  return assembleAnalysisResult(job, domain);
};
