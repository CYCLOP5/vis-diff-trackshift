import React, { memo, useMemo, useState } from 'react';
import { ComparisonMode, TimelineComparisonMetadata, TimelineSummary, TimelinePcbRegionSummary } from '../types';
import { resolveArtifactUrl } from '../utils/artifacts';

const resolveUrl = (artifact?: string | null, comparisonRoot?: string): string | undefined => {
  if (!artifact) return undefined;
  return resolveArtifactUrl(artifact, comparisonRoot) ?? undefined;
};

const deriveLabel = (path: string, index: number): string => {
  const file = path.split('/').pop() || `visualization-${index + 1}`;
  const sanitized = file.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '').trim();
  if (!sanitized) {
    return `Visualization ${index + 1}`;
  }
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};

type DamageRegionSummary = TimelinePcbRegionSummary & {
  label?: string;
  source?: string;
};

interface DiagnosticsPanelProps {
  timeline?: TimelineSummary;
}

const formatComparisonLabel = (
  comparison: TimelineComparisonMetadata,
  mode: ComparisonMode
): string => {
  if (mode === 'consecutive') {
    return `Frame ${comparison.afterIndex + 1} vs Frame ${comparison.beforeIndex + 1}`;
  }
  return `Frame ${comparison.afterIndex + 1} vs Baseline`;
};

const ComparisonDiagnosticsCard: React.FC<{
  comparison: TimelineComparisonMetadata;
  comparisonMode: ComparisonMode;
  sequence: number;
}> = ({ comparison, comparisonMode, sequence }) => {
  const pcbSummary = comparison.pcbMaskArtifacts?.summary;
  const pcbRegionCount = pcbSummary?.regionCount ?? pcbSummary?.regions?.length ?? 0;
  const hasPcbDamage = Boolean((pcbSummary?.coverage ?? 0) > 0 || pcbRegionCount > 0);
  const isManufacturingComparison = Boolean(comparison.pcbMaskArtifacts);
  const changeformerSummary = comparison.changeformerArtifacts?.summary;
  const hasChangeformer = Boolean(
    changeformerSummary &&
      ((changeformerSummary.coverage ?? 0) > 0 ||
        (changeformerSummary.regionCount ?? changeformerSummary.regions?.length ?? 0) > 0)
  );
  if (isManufacturingComparison && !hasPcbDamage) {
    return null;
  }

  const artifactCards = useMemo(() => {
    const cards: Array<{ key: string; title: string; subtitle: string; src?: string }> = [];
    const addCard = (
      key: string,
      title: string,
      subtitle: string,
      source?: string | null
    ) => {
      const resolved = resolveUrl(source, comparison.comparisonRoot);
      if (resolved) {
        cards.push({ key, title, subtitle, src: resolved });
      }
    };
    addCard(
      'yolo',
      'Roboflow Object Diff',
      'Roboflow-rendered overlay of paired detections and deltas.',
      comparison.objectDiffArtifacts?.overlay
    );
    if (!isManufacturingComparison || hasPcbDamage) {
      addCard(
        'pcb',
        'RF-DETR-Seg Mask',
        'BIT_CD-driven PCB anomaly mask prior to Gemini reasoning.',
        comparison.pcbMaskArtifacts?.overlay || comparison.pcbMaskArtifacts?.mask
      );
    }
    addCard(
      'mask',
      'Mask R-CNN Map',
      'High-confidence semantic segmentation overlay (≥85% confidence).',
      comparison.maskArtifacts?.overlay
    );
    if (comparison.changeformerArtifacts?.overlay) {
      addCard(
        'changeformer-overlay',
        'ChangeFormer Structural Overlay',
        'Transformer-based infrastructure change mask.',
        comparison.changeformerArtifacts.overlay
      );
    }
    if (comparison.changeformerArtifacts?.heatmap) {
      addCard(
        'changeformer-heatmap',
        'ChangeFormer Heatmap',
        'Probability map highlighting structural drift intensity.',
        comparison.changeformerArtifacts.heatmap
      );
    }
    return cards;
  }, [comparison, hasPcbDamage, isManufacturingComparison]);

  const formatCoverage = (value?: number) =>
    typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '—';
  const pcbRegions: DamageRegionSummary[] = hasPcbDamage
    ? ((pcbSummary?.regions as DamageRegionSummary[]) || [])
    : [];
  const changeformerRegions: DamageRegionSummary[] = hasChangeformer
    ? ((changeformerSummary?.regions as DamageRegionSummary[]) || [])
    : [];

  const roboflowGallery = useMemo(() => {
    const items = comparison.objectDiffArtifacts?.roboflowVisualizations || [];
    return items
      .map((artifact, idx) => {
        const src = resolveUrl(artifact, comparison.comparisonRoot);
        if (!src) return null;
        return {
          key: `${artifact}-${idx}`,
          label: deriveLabel(artifact, idx),
          src,
        };
      })
      .filter(Boolean) as { key: string; label: string; src: string }[];
  }, [comparison]);

  const componentDiffs = comparison.objectDiffArtifacts?.componentDiffs || [];

  if (
    artifactCards.length === 0 &&
    roboflowGallery.length === 0 &&
    componentDiffs.length === 0 &&
    !hasPcbDamage &&
    !hasChangeformer
  ) {
    return null;
  }

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700/50 bg-black/5 dark:bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-f1-text-darker-light dark:text-f1-text-darker">
            Comparison {sequence}
          </p>
          <h4 className="text-sm font-semibold text-f1-text-light dark:text-white">
            {formatComparisonLabel(comparison, comparisonMode)}
          </h4>
        </div>
        {typeof comparison.ssim === 'number' && (
          <span className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">
            SSIM {comparison.ssim.toFixed(3)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {artifactCards.map((card) => (
          <article
            key={card.key}
            className="rounded-md overflow-hidden border border-gray-300/50 dark:border-gray-700/50 bg-black/30"
          >
            <div className="aspect-video w-full bg-gray-900">
              <ArtifactImage src={card.src as string} alt={card.title} />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-f1-text-light dark:text-white">{card.title}</p>
              <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">{card.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
      {hasPcbDamage && pcbSummary && (
        <section className="mt-4 text-xs text-f1-text-darker-light dark:text-f1-text-darker">
          <div className="flex flex-wrap gap-4">
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">RF-DETR-Seg coverage:</span>{' '}
              {formatCoverage(pcbSummary.coverage)}
            </p>
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">Regions flagged:</span>{' '}
              {pcbSummary.regionCount ?? pcbSummary.regions?.length ?? 0}
            </p>
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">Pixels changed:</span>{' '}
              {pcbSummary.pixelsChanged ? pcbSummary.pixelsChanged.toLocaleString() : '—'}
            </p>
          </div>
        </section>
      )}
      {hasPcbDamage && pcbRegions.length > 0 && (
        <section className="mt-4">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-f1-text-darker-light dark:text-f1-text-darker mb-2">
            Detected Damage Regions
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pcbRegions.map((region, idx) => {
              const label = region.label || `Region ${idx + 1}`;
              const confidence = typeof region.confidence === 'number'
                ? `${(region.confidence * 100).toFixed(1)}% confidence`
                : 'Confidence: —';
              const coverageText = typeof region.areaRatio === 'number'
                ? `${(region.areaRatio * 100).toFixed(2)}% area`
                : 'Area: —';
              return (
                <article
                  key={region.id || label}
                  className="rounded-md border border-gray-300/40 dark:border-gray-700/40 bg-black/10 dark:bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-f1-text-light dark:text-white truncate">{label}</p>
                    <span className="text-[11px] uppercase tracking-wide text-f1-text-darker-light dark:text-f1-text-darker">{`#${idx + 1}`}</span>
                  </div>
                  <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">{confidence}</p>
                  <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">{coverageText}</p>
                  {region.source && (
                    <p className="text-[11px] text-f1-text-darker-light dark:text-f1-text-darker mt-1">Source: {region.source}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
      {hasChangeformer && changeformerSummary && (
        <section className="mt-4 text-xs text-f1-text-darker-light dark:text-f1-text-darker">
          <div className="flex flex-wrap gap-4">
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">ChangeFormer coverage:</span>{' '}
              {formatCoverage(changeformerSummary.coverage)}
            </p>
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">Regions flagged:</span>{' '}
              {changeformerSummary.regionCount ?? changeformerSummary.regions?.length ?? 0}
            </p>
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">Pixels changed:</span>{' '}
              {changeformerSummary.pixelsChanged ? changeformerSummary.pixelsChanged.toLocaleString() : '—'}
            </p>
            <p>
              <span className="font-semibold text-f1-text-light dark:text-white">Mean P-score:</span>{' '}
              {typeof changeformerSummary.globalMeanProbability === 'number'
                ? changeformerSummary.globalMeanProbability.toFixed(3)
                : '—'}
            </p>
          </div>
        </section>
      )}
      {hasChangeformer && changeformerRegions.length > 0 && (
        <section className="mt-4">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-f1-text-darker-light dark:text-f1-text-darker mb-2">
            ChangeFormer Structural Regions
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {changeformerRegions.map((region, idx) => {
              const label = region.label || `Region ${idx + 1}`;
              const probabilityLabel = typeof region.meanProbability === 'number'
                ? `μ=${region.meanProbability.toFixed(3)}`
                : undefined;
              const coverageText = typeof region.areaRatio === 'number'
                ? `${(region.areaRatio * 100).toFixed(2)}% area`
                : 'Area: —';
              return (
                <article
                  key={region.id || `${label}-${idx}`}
                  className="rounded-md border border-gray-300/40 dark:border-gray-700/40 bg-black/10 dark:bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-f1-text-light dark:text-white truncate">{label}</p>
                    <span className="text-[11px] uppercase tracking-wide text-f1-text-darker-light dark:text-f1-text-darker">{`CF #${idx + 1}`}</span>
                  </div>
                  <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">
                    Confidence: {typeof region.maxProbability === 'number'
                      ? `${(region.maxProbability * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">{coverageText}</p>
                  {probabilityLabel && (
                    <p className="text-[11px] text-f1-text-darker-light dark:text-f1-text-darker">{probabilityLabel}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
      {roboflowGallery.length > 0 && (
        <section className="mt-5">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-f1-text-darker-light dark:text-f1-text-darker mb-2">
            Roboflow Visualization Set
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roboflowGallery.map((item) => (
              <article
                key={item.key}
                className="rounded-md overflow-hidden border border-gray-300/50 dark:border-gray-700/50 bg-black/30"
              >
                <div className="aspect-video w-full bg-gray-900">
                  <ArtifactImage src={item.src} alt={item.label} />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-f1-text-light dark:text-white truncate">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-f1-text-darker-light dark:text-f1-text-darker">
                    Raw Roboflow visualization
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {componentDiffs.length > 0 && (
        <section className="mt-5">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-f1-text-darker-light dark:text-f1-text-darker mb-2">
            Component Diff Ledger
          </h5>
          <div className="overflow-x-auto border border-gray-300/40 dark:border-gray-700/40 rounded-md">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-black/20 text-f1-text-light dark:text-white">
                <tr>
                  <th className="py-2 px-3">Component</th>
                  <th className="py-2 px-3">SSIM</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Changed?</th>
                </tr>
              </thead>
              <tbody className="bg-black/10 text-f1-text-darker-light dark:text-f1-text-darker">
                {componentDiffs.map((diff, idx) => (
                  <tr key={`${diff.component}-${idx}`} className="border-t border-gray-700/30">
                    <td className="py-2 px-3 font-semibold text-f1-text-light dark:text-white">
                      {diff.component}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {typeof diff.ssim === 'number' ? diff.ssim.toFixed(3) : '—'}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {typeof diff.confidence === 'number'
                        ? `${Math.round(diff.confidence * 100)}%`
                        : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          diff.changed
                            ? 'bg-f1-accent-magenta/20 text-f1-accent-magenta'
                            : 'bg-gray-500/20 text-gray-200'
                        }`}
                      >
                        {diff.changed ? 'Delta' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
};

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ timeline }) => {
  const comparisons = timeline?.comparisons || [];
  if (!comparisons.length) {
    return null;
  }
  return (
    <div className="bg-f1-light-brighter/70 dark:bg-f1-light-dark/70 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-f1-text-darker-light dark:text-f1-text-darker uppercase tracking-wider">
          AI Diff Diagnostics
        </h3>
        <span className="text-xs text-f1-text-darker-light dark:text-f1-text-darker">
          Frames analyzed: {comparisons.length}
        </span>
      </div>
      <div className="space-y-6">
        {comparisons.map((comparison, idx) => (
          <ComparisonDiagnosticsCard
            key={`${comparison.afterIndex}-${comparison.beforeIndex}-${idx}`}
            comparison={comparison}
            comparisonMode={timeline.mode}
            sequence={idx + 1}
          />
        ))}
      </div>
    </div>
  );
};

const ArtifactImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!isLoaded && <div className="absolute inset-0 bg-gray-700 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-contain transition-opacity duration-300"
        style={{ opacity: isLoaded ? 1 : 0 }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />
    </div>
  );
};

export default memo(DiagnosticsPanel);
