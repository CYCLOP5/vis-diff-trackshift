import React, { useState } from 'react';
import { AnalysisResult, DomainMode, ImageFile } from '../types';
import { DownloadIcon } from './Icons';
import { generateGeminiPdfNarrative } from '../services/geminiService';
import { resolveArtifactUrl } from '../utils/artifacts';

interface ExportPanelProps {
  result: AnalysisResult | null;
  images: ImageFile[];
  domain: DomainMode;
}

// Color mapping for annotations, consistent with ResultDisplay
const changeTypeColors = {
    Structural: 'rgba(0, 245, 212, 0.9)', // f1-accent-cyan
    Surface: 'rgba(255, 0, 255, 0.9)', // f1-accent-magenta
    Spatial: 'rgba(250, 204, 21, 0.9)' // yellow-400
};

type PdfImageData = { dataUrl: string; format: 'PNG' | 'JPEG' };

const determineFormatFromMime = (mime?: string): 'PNG' | 'JPEG' =>
  mime?.toLowerCase().includes('png') ? 'PNG' : 'JPEG';

const fileToPdfImage = (file: File): Promise<PdfImageData> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result as string, format: determineFormatFromMime(file.type) });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchImageAsPdfImage = async (src?: string | null): Promise<PdfImageData | null> => {
  if (!src) return null;
  try {
    const response = await fetch(src);
    if (!response.ok) {
      console.warn('Failed to fetch artifact for PDF export', src, response.status);
      return null;
    }
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    return { dataUrl, format: determineFormatFromMime(blob.type) };
  } catch (error) {
    console.warn('Artifact fetch error during PDF export', error);
    return null;
  }
};

/**
 * Provides buttons to download the analysis result in various formats.
 */
const ExportPanel: React.FC<ExportPanelProps> = ({ result, images, domain }) => {
  const isDisabled = !result;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadJSON = () => {
    if (!result) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(result, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'visionary_ai_report.json';
    link.click();
  };

  const handleDownloadAnnotatedPNG = async () => {
    if (!result || !images.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = new Image();
    // Use an onload promise to ensure the image is loaded before drawing
    await new Promise<void>(resolve => {
        baseImage.onload = () => {
            canvas.width = baseImage.naturalWidth;
            canvas.height = baseImage.naturalHeight;
            ctx.drawImage(baseImage, 0, 0);
            resolve();
        };
        baseImage.onerror = () => {
            console.error("Failed to load image for PNG export.");
            resolve();
        };
        baseImage.src = images[0].previewUrl; // Use the 'before' image
    });

    // Draw the annotations
    result.changes.forEach(change => {
        const { box, changeType } = change;
        const [x_min, y_min, x_max, y_max] = box;
        
        const rectX = x_min * canvas.width;
        const rectY = y_min * canvas.height;
        const rectWidth = (x_max - x_min) * canvas.width;
        const rectHeight = (y_max - y_min) * canvas.height;

        ctx.strokeStyle = changeTypeColors[changeType];
        ctx.lineWidth = Math.max(4, canvas.width * 0.005); // Dynamic line width
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        
        ctx.fillStyle = changeTypeColors[changeType].replace('0.9', '0.25');
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = 'visionary_ai_annotated.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!result || !images.length || isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const narrative = await generateGeminiPdfNarrative(result, domain);
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const marginY = 60;
      let cursorY = marginY;

      const ensureSpace = (needed = 80) => {
        if (cursorY > pageHeight - needed) {
          doc.addPage();
          cursorY = marginY;
        }
      };

      const addSectionHeading = (text: string, level: 1 | 2 | 3 = 1) => {
        ensureSpace(60);
        const fontSizes = { 1: 22, 2: 14, 3: 12 } as const;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSizes[level]);
        doc.text(text, marginX, cursorY);
        cursorY += level === 1 ? 24 : 18;
      };

      const addMetaLine = (text: string) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(text, marginX, cursorY);
        cursorY += 12;
      };

      const addParagraph = (text: string) => {
        if (!text) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        const lines = doc.splitTextToSize(text, pageWidth - marginX * 2);
        ensureSpace(lines.length * 12 + 20);
        doc.text(lines, marginX, cursorY);
        cursorY += lines.length * 12 + 8;
      };

      const addImageBlock = (label: string, data: PdfImageData) => {
        ensureSpace(210);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(label, marginX, cursorY);
        doc.addImage(data.dataUrl, data.format, marginX, cursorY + 6, pageWidth - marginX * 2, 170, undefined, 'FAST');
        cursorY += 190;
      };

      const buildComparisonArtifacts = async () => {
        const comparisons = result.timeline?.comparisons || [];
        const bundles: {
          heading: string;
          images: { label: string; data: PdfImageData }[];
          componentRows: (string | string[])[][];
        }[] = [];
        for (let idx = 0; idx < comparisons.length; idx += 1) {
          const comparison = comparisons[idx];
          const label = `Appendix ${idx + 1} · Frame ${comparison.afterIndex + 1} vs Frame ${comparison.beforeIndex + 1}`;
          const imagesForComparison: { label: string; data: PdfImageData }[] = [];

          const beforeFrame = images[comparison.beforeIndex];
          const afterFrame = images[comparison.afterIndex];
          if (beforeFrame) {
            imagesForComparison.push({
              label: `${label} · Baseline Frame`,
              data: await fileToPdfImage(beforeFrame.file),
            });
          }
          if (afterFrame) {
            imagesForComparison.push({
              label: `${label} · Comparison Frame`,
              data: await fileToPdfImage(afterFrame.file),
            });
          }

          const roboflowOverlay = await (async () => {
            const src = resolveArtifactUrl(
              comparison.objectDiffArtifacts?.overlay,
              comparison.comparisonRoot
            );
            const data = await fetchImageAsPdfImage(src);
            return data ? { label: `${label} · Roboflow Object Diff`, data } : null;
          })();
          if (roboflowOverlay) {
            imagesForComparison.push(roboflowOverlay);
          }

          const roboflowGallery = await Promise.all(
            (comparison.objectDiffArtifacts?.roboflowVisualizations || []).map(async (artifact, galleryIdx) => {
              const src = resolveArtifactUrl(artifact, comparison.comparisonRoot);
              const data = await fetchImageAsPdfImage(src);
              if (!data) return null;
              return {
                label: `${label} · Roboflow Visualization ${galleryIdx + 1}`,
                data,
              };
            })
          );
          roboflowGallery.filter(Boolean).forEach((item) => {
            if (item) imagesForComparison.push(item);
          });

          const maskOverlay = await (async () => {
            const src = resolveArtifactUrl(
              comparison.maskArtifacts?.overlay,
              comparison.comparisonRoot
            );
            const data = await fetchImageAsPdfImage(src);
            return data ? { label: `${label} · Mask R-CNN Map`, data } : null;
          })();
          if (maskOverlay) {
            imagesForComparison.push(maskOverlay);
          }

          const componentRows = (comparison.objectDiffArtifacts?.componentDiffs || []).map((diff) => [
            diff.component,
            typeof diff.ssim === 'number' ? diff.ssim.toFixed(3) : '—',
            typeof diff.confidence === 'number' ? `${Math.round(diff.confidence * 100)}%` : '—',
            diff.changed ? 'Delta' : 'Stable',
          ]);

          bundles.push({ heading: label, images: imagesForComparison, componentRows });
        }
        return bundles;
      };

      addSectionHeading(narrative.title || 'Visionary AI · Technical Brief');
      addMetaLine(`Domain: ${domain}`);
      addMetaLine(`Generated: ${new Date().toUTCString()}`);

      addSectionHeading('1. Executive Summary', 2);
      addParagraph(narrative.executiveSummary || result.summary);

      if (narrative.sections?.length) {
        narrative.sections.forEach((section, index) => {
          if (!section.heading || !section.paragraphs?.length) return;
          addSectionHeading(`2.${index + 1} ${section.heading}`, 3);
          section.paragraphs.forEach((paragraph) => addParagraph(paragraph));
        });
      }

      const changeRowsSource = result.llmChanges?.length ? result.llmChanges : result.changes;
      if (changeRowsSource.length) {
        ensureSpace(120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('3. Change Classification Table', marginX, cursorY);
        cursorY += 12;
        autoTable(doc, {
          startY: cursorY,
          head: [['Description', 'Type', 'Impact', 'Interpretation']],
          body: changeRowsSource.map((change) => [
            change.description,
            change.changeType,
            change.impact,
            doc.splitTextToSize(change.interpretation, 140),
          ]),
          styles: { cellPadding: 4, fontSize: 9, lineWidth: 0.1 },
          headStyles: { fillColor: [7, 15, 19], textColor: 255 },
          columnStyles: { 3: { cellWidth: 180 } },
          margin: { left: marginX, right: marginX },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 16;
      }

      if (narrative.directives?.length) {
        addSectionHeading('4. Trackside Directives', 2);
        narrative.directives.forEach((directive, idx) => {
          addParagraph(`${idx + 1}. ${directive}`);
        });
      }

      const comparisonBundles = await buildComparisonArtifacts();
      if (comparisonBundles.length) {
        comparisonBundles.forEach((bundle, bundleIdx) => {
          addSectionHeading(`Appendix ${bundleIdx + 1}: Visual Evidence`, 2);
          addParagraph(bundle.heading);
          bundle.images.forEach((image) => addImageBlock(image.label, image.data));
          if (bundle.componentRows.length) {
            ensureSpace(120);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Component Diff Summary', marginX, cursorY);
            cursorY += 10;
            autoTable(doc, {
              startY: cursorY,
              head: [['Component', 'SSIM', 'Confidence', 'Changed']],
              body: bundle.componentRows,
              styles: { cellPadding: 4, fontSize: 9, lineWidth: 0.1 },
              headStyles: { fillColor: [0, 0, 0], textColor: 255 },
              margin: { left: marginX, right: marginX },
            });
            cursorY = (doc as any).lastAutoTable.finalY + 24;
          }
        });
      }

      doc.save('visionary_ai_report.pdf');
    } catch (e) {
      console.error('Failed to generate Gemini-authored PDF report.', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const ExportButton: React.FC<{onClick: () => void, disabled: boolean, children: React.ReactNode}> = ({onClick, disabled, children}) => (
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 text-f1-text-light dark:text-f1-text font-semibold py-2 px-4 rounded-md disabled:bg-gray-100/50 dark:disabled:bg-gray-800/50 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors border border-gray-300/50 dark:border-gray-600/50 hover:border-f1-accent-cyan/50"
      >
        {children}
      </button>
  );

  return (
    <div className="bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700/50">
      <h3 className="text-sm font-semibold text-f1-text-darker-light dark:text-f1-text-darker mb-3 uppercase tracking-wider">Export Report</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ExportButton onClick={handleDownloadAnnotatedPNG} disabled={isDisabled}>
          <DownloadIcon /> PNG
        </ExportButton>
        <ExportButton onClick={handleDownloadPDF} disabled={isDisabled || isGeneratingPDF}>
          {isGeneratingPDF ? (
              <span className="animate-pulse">Generating...</span>
          ) : (
            <><DownloadIcon /> PDF</>
          )}
        </ExportButton>
        <ExportButton onClick={handleDownloadJSON} disabled={isDisabled}>
          <DownloadIcon /> JSON
        </ExportButton>
      </div>
    </div>
  );
};

export default ExportPanel;