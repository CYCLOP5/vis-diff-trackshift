import { GoogleGenAI, Type, Modality, GenerateContentResponse } from '@google/genai';
import { AnalysisResult, DomainMode, DetectedChange, ChatMessage, Source, SimulationResult, AIPersona } from '../types';

export interface GeminiImageInput {
    file: File | Blob;
    label?: string;
    mimeType?: string;
}

export interface GeminiPdfNarrativeSection {
    heading: string;
    paragraphs: string[];
}

export interface GeminiPdfNarrative {
    title: string;
    executiveSummary: string;
    sections: GeminiPdfNarrativeSection[];
    directives: string[];
    lexicon?: string[];
}

const API_KEY = import.meta.env.VITE_API_KEY;
if (!API_KEY) {
    throw new Error("VITE_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504, 524]);
const RETRYABLE_STATUS_TEXT = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'TOO_MANY_REQUESTS', 'DEADLINE_EXCEEDED', 'ABORTED']);
const RETRYABLE_MESSAGE_SNIPPETS = [
    'unavailable',
    'resource exhausted',
    'deadline exceeded',
    'temporarily',
    'overloaded',
    'try again',
    'failed to fetch',
    'network',
    'timeout',
    'timed out',
    'rate limit',
    'too many requests',
    'socket hang up',
    '503',
    '502',
    '504'
];

const GEMINI_PRO_MODEL = 'gemini-2.5-pro';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
const GEMINI_ANALYSIS_TIMEOUT_MS = 120_000;
const FALLBACK_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const FALLBACK_STATUS_TEXT = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'TOO_MANY_REQUESTS']);
const FALLBACK_MESSAGE_SNIPPETS = ['overloaded', 'at capacity', 'rate limit', 'too many requests', 'resource exhausted'];

type ParsedErrorInfo = { message: string; statusCode?: number; status?: string };

const parseJsonFromMessage = (message?: string) => {
    if (!message) return null;
    const firstBrace = message.indexOf('{');
    if (firstBrace === -1) return null;
    try {
        return JSON.parse(message.slice(firstBrace));
    } catch {
        return null;
    }
};

const extractErrorInfo = (error: unknown): ParsedErrorInfo => {
    if (error instanceof Error) {
        const baseMessage = error.message || error.toString();
        const info: ParsedErrorInfo = { message: baseMessage };
        const candidateSources = [
            (error as any).statusCode,
            (error as any).status,
            (error as any).code,
            (error as any).response?.status,
            (error as any).response?.statusCode,
            (error as any).cause?.statusCode,
            (error as any).cause?.code,
            (error as any).cause?.status
        ];
        for (const candidate of candidateSources) {
            if (typeof candidate === 'number') {
                info.statusCode = candidate;
                break;
            }
            if (typeof candidate === 'string' && /^\d{3}$/.test(candidate)) {
                info.statusCode = Number(candidate);
                break;
            }
        }
        const statusCandidates = [
            typeof (error as any).status === 'string' ? (error as any).status : undefined,
            typeof (error as any).code === 'string' ? (error as any).code : undefined,
            typeof (error as any).response?.statusText === 'string' ? (error as any).response.statusText : undefined,
            typeof (error as any).cause?.status === 'string' ? (error as any).cause.status : undefined
        ].filter(Boolean) as string[];
        if (statusCandidates.length > 0) {
            info.status = statusCandidates[0];
        }
        if (!info.statusCode) {
            const parsedMessageJson = parseJsonFromMessage(baseMessage);
            if (parsedMessageJson) {
                if (typeof parsedMessageJson.code === 'number') {
                    info.statusCode = parsedMessageJson.code;
                } else if (typeof parsedMessageJson.code === 'string' && /^\d{3}$/.test(parsedMessageJson.code)) {
                    info.statusCode = Number(parsedMessageJson.code);
                }
                if (typeof parsedMessageJson.status === 'string') {
                    info.status = parsedMessageJson.status;
                }
            }
        }
        return info;
    }
    if (typeof error === 'string') {
        return { message: error };
    }
    try {
        return { message: JSON.stringify(error) };
    } catch {
        return { message: String(error) };
    }
};

const isRetryableGeminiError = (error: unknown): boolean => {
    if (!error) return false;
    const info = extractErrorInfo(error);
    if ((error as Error)?.name === 'TimeoutError') return true;
    if (info.statusCode && RETRYABLE_STATUS_CODES.has(info.statusCode)) return true;
    if (info.status && RETRYABLE_STATUS_TEXT.has(info.status.toUpperCase())) return true;
    const message = info.message?.toLowerCase() || '';
    return RETRYABLE_MESSAGE_SNIPPETS.some(snippet => message.includes(snippet));
};

const executeWithTimeout = async <T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> => {
    if (!timeoutMs || timeoutMs <= 0) {
        return fn();
    }
    return new Promise<T>((resolve, reject) => {
        let settled = false;
        const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
        timeoutError.name = 'TimeoutError';
        const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(timeoutError);
        }, timeoutMs);

        fn()
            .then(result => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch(error => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                reject(error);
            });
    });
};

type RetryOptions = {
    retries?: number;
    initialDelay?: number;
    maxDelay?: number;
    jitterRatio?: number;
    timeoutMs?: number;
    retryOn?: (error: unknown) => boolean;
    onRetry?: (attempt: number, delay: number, error: unknown) => void;
};

const withRetry = async <T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> => {
    const {
        retries = 3,
        initialDelay = 2000,
        maxDelay = 15000,
        jitterRatio = 0.3,
        timeoutMs = 60000,
        retryOn,
        onRetry,
    } = options;

    let attempt = 0;
    let currentDelay = initialDelay;

    while (true) {
        try {
            return await executeWithTimeout(fn, timeoutMs);
        } catch (error) {
            attempt++;
            const retryable = retryOn ? retryOn(error) : isRetryableGeminiError(error);
            if (!retryable || attempt > retries) {
                if (error instanceof Error) {
                    (error as any).retryAttempts = attempt;
                }
                throw error;
            }

            const boundedDelay = Math.min(currentDelay, maxDelay);
            const jitterMultiplier = jitterRatio > 0 ? 1 + (Math.random() - 0.5) * jitterRatio : 1;
            const waitTime = Math.max(500, Math.round(boundedDelay * jitterMultiplier));

            if (onRetry) {
                onRetry(attempt, waitTime, error);
            }

            await delay(waitTime);
            currentDelay = Math.min(boundedDelay * 2, maxDelay);
        }
    }
};

const shouldFallbackToFlash = (error: unknown): boolean => {
    if (!error) {
        return false;
    }
    const info = extractErrorInfo(error);
    if (info.statusCode && FALLBACK_STATUS_CODES.has(info.statusCode)) {
        return true;
    }
    const status = info.status?.toUpperCase();
    if (status && FALLBACK_STATUS_TEXT.has(status)) {
        return true;
    }
    const message = info.message?.toLowerCase() || '';
    return FALLBACK_MESSAGE_SNIPPETS.some(snippet => message.includes(snippet));
};

type GeminiFallbackOptions = {
    context?: string;
    onFallback?: () => void;
};

const withGeminiModelFallback = async <T>(
    requestFactory: (model: string) => Promise<T>,
    options: GeminiFallbackOptions = {}
): Promise<T> => {
    try {
        return await requestFactory(GEMINI_PRO_MODEL);
    } catch (error) {
        if (!shouldFallbackToFlash(error)) {
            throw error;
        }
        if (options.context) {
            console.warn(`[Gemini] ${options.context} primary model unavailable. Falling back to Flash.`, error);
        } else {
            console.warn('[Gemini] Primary Gemini model unavailable. Falling back to Flash.', error);
        }
        if (options.onFallback) {
            options.onFallback();
        }
        return requestFactory(GEMINI_FLASH_MODEL);
    }
};


/**
 * Converts a File object to a base64 encoded string.
 */
const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts a File object to a Gemini API-compatible image part.
 */
const fileToGenerativePart = async (file: File | Blob, mimeType?: string) => {
    const base64EncodedData = await fileToBase64(file);
    return {
        inlineData: { data: base64EncodedData, mimeType: mimeType || (file as File).type || 'image/jpeg' },
    };
};

const analysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A 2-3 sentence executive summary of the most critical changes observed, focusing on the strategic implications." },
        changes: {
            type: Type.ARRAY,
            description: "A comprehensive list of ALL detected visual differences.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier string for the change (e.g., 'change-1')." },
                    description: { type: Type.STRING, description: "A concise text description of the change (e.g., 'Front wing endplate modified')." },
                    box: { type: Type.ARRAY, description: "Bounding box [x_min, y_min, x_max, y_max] normalized from 0.0 to 1.0.", items: { type: Type.NUMBER } },
                    changeType: { type: Type.STRING, description: "Must be one of: 'Structural', 'Surface', or 'Spatial'." },
                    confidence: { type: Type.NUMBER, description: "The model's confidence in this detection, from 0.0 to 1.0." },
                    interpretation: { type: Type.STRING, description: "A deep, technical expert interpretation of the change's purpose and likely effects." },
                    impact: { type: Type.STRING, description: "The estimated impact, must be one of: 'Low', 'Medium', or 'High'." },
                    criticality: { type: Type.NUMBER, description: "A score from 1-10 indicating the urgency and importance of this change. 10 is most critical." },
                    estimatedCost: { type: Type.NUMBER, description: "Estimated cost of implementation in USD." },
                    performanceGain: { type: Type.STRING, description: "A specific, quantified performance gain (e.g., '+5 points downforce', '-0.2s lap time', '+10% efficiency'). If not applicable, state 'N/A'."},
                    specialistInsights: {
                        type: Type.OBJECT,
                        description: "Brief, highly specific comments from relevant specialists.",
                        properties: {
                            aero: { type: Type.STRING, description: "Optional: A 1-sentence insight from an aerodynamics perspective." },
                            data: { type: Type.STRING, description: "Optional: A 1-sentence insight on materials, legality, or cost." },
                        }
                    },
                    suggestedActions: { type: Type.ARRAY, description: "A list of 1-2 concrete, actionable next steps for this specific change.", items: { type: Type.STRING } },
                    redFlags: { type: Type.ARRAY, description: "A list of potential risks or concerns about this change, identified via Socratic debate.", items: { type: Type.STRING } },
                    suggestedQuestions: { type: Type.ARRAY, description: "A list of 2-3 insightful follow-up questions a user might ask about this change, directed to '@Shourya' or '@Varun'.", items: { type: Type.STRING } }
                },
                required: ['id', 'description', 'box', 'changeType', 'confidence', 'interpretation', 'impact', 'criticality', 'estimatedCost', 'performanceGain', 'suggestedActions']
            }
        },
        recommendations: { type: Type.ARRAY, description: "A list of high-level, strategic recommendations.", items: { type: Type.STRING } }
    },
    required: ['summary', 'changes', 'recommendations']
};

const pdfReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING },
                    paragraphs: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['heading', 'paragraphs']
            }
        },
        directives: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        lexicon: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ['title', 'executiveSummary', 'sections', 'directives']
};

const buildArtifactGalleryDigest = (analysis: AnalysisResult) => {
    const comparisons = analysis.timeline?.comparisons || [];
    return comparisons.map((comparison, idx) => ({
        label: `Frame ${comparison.afterIndex + 1} vs Frame ${comparison.beforeIndex + 1}`,
        roboflowVisualizations: comparison.objectDiffArtifacts?.roboflowVisualizations || [],
        componentDiffs: comparison.objectDiffArtifacts?.componentDiffs || [],
        hasMaskMap: Boolean(comparison.maskArtifacts?.overlay),
        appendixIndex: idx + 1,
    }));
};

type DomainAnalysisPromptConfig = {
    expertRole: string;
    context: string;
    instructions: string;
};

const ANALYSIS_PROMPT_CONFIG: Record<DomainMode | 'default', DomainAnalysisPromptConfig> = {
    default: {
        expertRole: 'an expert visual inspection team',
        context:
            'Carefully study every image provided (not just the endpoints) and reason about the evolution between frames. Construct a differentiation narrative that explains what changed and why it matters.',
        instructions: `Instructions:
1. Inspect all frames in order, referencing their labels. Track how geometry, materials, and finishes evolve across the timeline.
2. Highlight every material or structural deviation explicitly, grounding claims in the supplied overlays and JSON manifests.
3. Use the change list to justify business or safety impact. Low-confidence impressions must be called out as such.
4. For each detected change, report what is new versus baseline, the suspected intent, and any trade-offs.`,
    },
    F1: {
        expertRole:
            'an elite Formula 1 aerodynamics and race engineering team. You are ruthless, precise, and operate with extreme technical depth. You perform internal Socratic debate to find flaws and expose hidden trade-offs.',
        context:
            'Carefully study every image provided (not just the endpoints) and reason about the evolution between frames. Construct a differentiation narrative explaining what changed, why it matters, and the intent behind the upgrade.',
        instructions: `Instructions:
1. Inspect frames in order and narrate how aero furniture, bodywork, and surfaces evolve.
2. Always call out livery updates, aero edges, brake ducts, floor fences, wing tips, and cooling changes. If paint hints at stealth aero tricks, expose it.
3. Infer regulation eras (ground effect vs. previous gens) and discuss legality plus constraint shifts.
4. For every detected change, detail the performance lever, intended gains, and any trade-offs or risks.
5. Populate each change entry with specialist insights (aero/data), quantified gains, and actionable follow-ups.`,
    },
    Manufacturing: {
        expertRole:
            "a specialist in high-precision manufacturing and quality control. You identify defects, tolerance issues, and material imperfections. JSON attachments labeled 'RF-DETR-Seg JSON summary' enumerate every flagged defect; treat them as authoritative, even if imagery is missing.",
        context:
            'Your deliverable is a shop-floor non-conformance report. Prioritize throughput risk, dimensional tolerance escapes, and contamination that could block shipment.',
        instructions: `Instructions:
1. Inspect each frame for machining, casting, welding, or assembly anomalies. Cross-check every finding against RF-DETR-Seg JSON so discrepancies are reconciled.
2. Treat every change entry as a defect log item. The bounding box must reference the affected feature; if not localizable, set it to [0,0,1,1] and justify why.
3. Encode severity via impact (High = line stop, Medium = rework, Low = cosmetic) and set criticality on a 1-10 scale that mirrors PPAP risk.
4. Interpret each defect with probable root cause, tolerance delta, and measurement evidence (if inferred from overlays/heatmaps).
5. Suggested actions must include both immediate containment and longer-term corrective actions. Highlight metrology, process, or tooling teams responsible.
6. Use redFlags to flag parts that must be quarantined or scrapped before release.`,
    },
    Infrastructure: {
        expertRole:
            'a structural engineering and civil inspection unit. You detect cracks, stress fractures, spalling, corrosion, and safety hazards across bridges, plants, and critical infrastructure.',
        context:
            'Produce a structural condition assessment focused on safety-of-life. Rank hazards, specify affected spans/zones, and cite evidence from ChangeFormer overlays and original frames.',
        instructions: `Instructions:
1. Read frames sequentially to understand environmental conditions and exposure history.
2. For each detected issue, describe the physical manifestation (crack, delamination, corrosion bloom, settlement) and tie it to the precise location.
3. Use impact to encode hazard class (High = imminent failure, Medium = degraded but stable, Low = cosmetic). Criticality must reflect urgency on a 1-10 safety scale.
4. Interpret findings with likely failure modes, loading concerns, or code violations. Reference ChangeFormer mask/heatmap intensity when describing confidence.
5. Suggested actions should map to structural interventions (shoring, load restrictions, NDT, evacuation). If monitoring is acceptable, spell out cadence and instrumentation.
6. Red flags should call out immediate life-safety blockers, required shutdowns, or regulatory notifications.`,
    },
    QA: {
        expertRole:
            "a Quality Assurance system comparing a manufactured part to its 'digital twin' reference. The first image is the reference, the second is the inspected unit.",
        context:
            'Detect microscopic deviations from the digital twin and characterize their risk to specification compliance.',
        instructions: `Instructions:
1. Treat the earliest frame as the golden reference and quantify how subsequent frames diverge.
2. Prioritize dimensional and surface deviations that violate tolerance. Use overlays to localize differences.
3. Tie each change to its manufacturability impact and list measurement techniques to confirm the finding.
4. Suggested actions must specify whether to rework, scrap, or accept with deviation approval.`,
    },
};

const createAnalysisPrompt = (domain: DomainMode): string => {
     const config = ANALYSIS_PROMPT_CONFIG[domain] ?? ANALYSIS_PROMPT_CONFIG.default;
     return `You are ${config.expertRole}. ${config.context}

${config.instructions}

Return a single JSON object that strictly matches the schema. Do not include any Markdown fences such as \`\`\`json.`;
};

const createPdfDirectivePrompt = (domain: DomainMode): string => {
     if (domain === 'Manufacturing') {
          return `You are the lead quality scribe for a high-precision manufacturing response cell.

Your assignment: craft a publication-grade **Manufacturing Non-Conformance Report** that production, metrology, and quality leadership can immediately act upon. Follow every formatting rule below—no improvisation.

============================================================
STRICT FORMATTING RULES (MANDATORY)
============================================================
0. Title
    - Must be exactly: "Manufacturing Non-Conformance Report"

1. Executive Summary
    - Heading: "1. Executive Summary"
    - ≤ 5 sentences capturing line status, risk to shipment, and next checkpoints.

2. Required Sections (numbered exactly)
    2. Production Context
    3. Defect Ledger
    4. Root Cause Candidates
    5. Containment & Corrective Actions
    6. Release Recommendation

3. Defect Ledger Rules
    - Treat every payload.artifactGallery entry as a ledger row.
    - For each row list: baseline frame, comparison frame, referenced overlay/heatmap, mask presence (yes/no), and whether RF-DETR-Seg JSON corroborates it.
    - Mention severity tags (Critical/Major/Minor) and cite evidence succinctly.

4. Tone
    - ISO-9001 audit style: clinical, traceable, zero hype.
    - Reference responsible teams (e.g., "Metrology", "Line 3 Ops") when prescribing action.

5. Directives Array
    - Populate the JSON 'directives' field with action statements following: "Owner: Verb + measurable outcome + deadline".

6. Output Schema Discipline
    - Return ONLY valid JSON that matches pdfReportSchema.
    - Required keys: title, executiveSummary, sections (array of { heading, paragraphs[] }), directives (string array), optional lexicon.
    - Paragraph arrays must contain plain text sentences—no bullets or Markdown.

Maintain strict formatting hygiene: no blank line spamming, no emojis, no stories.
`;    }
     if (domain === 'Infrastructure') {
          return `You are the structural assessment scribe for a critical-infrastructure war room.

Deliver a **Infrastructure Structural Risk Report** that regulators, field crews, and safety managers can execute immediately. All instructions below are binding.

============================================================
STRICT FORMATTING RULES (MANDATORY)
============================================================
0. Title
    - Must be exactly: "Infrastructure Structural Risk Report"

1. Executive Summary
    - Heading: "1. Executive Summary"
    - ≤ 5 sentences summarizing overall condition, hottest risks, and required closures.

2. Required Sections
    2. Site Conditions & Exposure
    3. Structural Findings Digest
    4. Risk & Safety Assessment
    5. Recommended Interventions
    6. Monitoring & Compliance Plan

3. Structural Findings Digest Rules
    - Enumerate every payload.artifactGallery entry.
    - For each, document location, suspected failure mode, ChangeFormer evidence (mask/heatmap), and whether original imagery corroborates it.
    - Include a severity code (High/Med/Low) plus an occupant/public impact statement.

4. Risk & Safety Assessment
    - Summarize hazard classifications, load restrictions, evacuation triggers, and regulatory reporting requirements.

5. Directives Array
    - Populate JSON 'directives' with enforceable actions ("Field Ops: Install shoring at Pier 2 within 12h"), each citing owner + timeline.

6. Output Schema Discipline
    - Return ONLY valid JSON following pdfReportSchema: title, executiveSummary, sections[{heading, paragraphs[]}], directives[], optional lexicon[].
    - Paragraphs must be concise prose—no Markdown lists or tables unless described in schema.

Keep tone urgent yet factual. Reference applicable codes or inspection standards when relevant.`;
     }

     return `You are the principal technical scribe for a ${domain === 'F1' ? 'Formula 1 race engineering' : domain} task force.

Your task: produce a perfectly structured, publication-grade report outline **strictly following the formatting constraints below**. Do NOT introduce any formatting that is not explicitly permitted.

============================================================
STRICT FORMATTING RULES (MANDATORY)
============================================================
0. Title
     - Must be: "Technical Analysis Report"
1. Numbered Headings
    - Use ONLY hierarchical numeric headings:
         "1.", "1.1", "1.1.1"
    - No bullets unless specified.
    - No extra blank lines between headings and paragraphs.

2. Executive Summary
    - Must be **≤ 5 sentences**.
    - Must appear under heading **"1. Executive Summary"** exactly.

3. Sections (Required)
    1. Executive Summary
    2. Analysis Overview
    3. Major System Changes
    4. Visual Evidence Digest
    5. Livery Changes
    6. Trackside Directives
    7. Conclusion

4. Visual Evidence Digest Rules
    - MUST contain a subsection for every entry in payload.artifactGallery.
    - For each entry, list:
         * baseline frame name
         * comparison frame name
         * component diffs (with confidence)
         * Roboflow visualizations (yes/no)
         * Mask R-CNN Map existence (yes/no)
    - NEVER call the segmentation overlay a "damage map".  ONLY call it **"Mask R-CNN Map"**.

5. Trackside Directives
    - Each directive must:
         * Start with a **verb**
         * Be **actionable + measurable**
         * Identify a **single owner**
      Example pattern: “Aero Dept: Validate X using Y method within Z timeframe.”

6. Language Requirements
    - Terse, technical, aerospace-briefing tone.
    - No marketing language.
    - No emojis.
    - No analogies, metaphors, storytelling, or fluff.
    - No editorial opinions.

7. Output Schema Discipline
    - Return **ONLY** valid JSON matching pdfReportSchema (title, executiveSummary, sections[{heading, paragraphs[]}], directives[], optional lexicon[]).
    - Paragraphs must be strings of clean text—no Markdown tables.

Maintain complete formatting discipline at all times.`;
};

export const generateGeminiPdfNarrative = async (analysis: AnalysisResult, domain: DomainMode): Promise<GeminiPdfNarrative> => {
     const artifactGallery = buildArtifactGalleryDigest(analysis);
     const directivePrompt = createPdfDirectivePrompt(domain);

    const payload = {
        domain,
        summary: analysis.summary,
        recommendations: analysis.recommendations,
        changes: analysis.llmChanges?.length ? analysis.llmChanges : analysis.changes,
        timeline: analysis.timeline,
        artifactGallery,
    };

    const pdfRequest = (model: string) => withRetry(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: directivePrompt }, { text: JSON.stringify(payload) }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: pdfReportSchema,
        }
    }), {
        timeoutMs: GEMINI_ANALYSIS_TIMEOUT_MS,
    });

    const response: GenerateContentResponse = await withGeminiModelFallback(pdfRequest, {
        context: 'PDF narrative',
    });

    if (!response.text) {
        throw new Error('Gemini returned an empty narrative for the PDF export.');
    }

    try {
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Failed to parse Gemini PDF narrative JSON:', response.text);
        throw new Error('Gemini produced an invalid PDF narrative payload.');
    }
};


export const analyzeImagesWithGemini = async (
    inputs: GeminiImageInput[],
    domain: DomainMode,
    setProgress: (p: number, s: string) => void
): Promise<AnalysisResult> => {
    setProgress(10, 'Preparing image data...');
    const parts: any[] = [{ text: createAnalysisPrompt(domain) }];

    for (const input of inputs) {
        const label = input.label?.trim();
        if (label) {
            parts.push({ text: `\n--- ${label} ---` });
        }
        const generativePart = await fileToGenerativePart(input.file, input.mimeType);
        parts.push(generativePart);
    }

    const contents = { parts };
    
    setProgress(30, 'Contacting AI analysis core...');
    const analysisRequest = (model: string) => withRetry(() => ai.models.generateContent({
        model,
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisResponseSchema
        }
    }), {
        timeoutMs: GEMINI_ANALYSIS_TIMEOUT_MS,
        onRetry: (attempt, delay) => {
            setProgress(30 + attempt * 10, `Model is busy. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt})`);
        }
    });

    const response: GenerateContentResponse = await withGeminiModelFallback(analysisRequest, {
        context: 'multi-frame analysis',
        onFallback: () => setProgress(60, 'Pro core saturated. Falling back to Flash...'),
    });

    setProgress(85, 'Parsing specialist report...');
    if (!response.text) {
        throw new Error("The AI returned an empty response for analysis. Please try again.");
    }
    try {
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsedResult = JSON.parse(cleanedText);
        return { ...parsedResult, isDemoMode: false };
    } catch (e) {
        console.error("Failed to parse analysis JSON:", response.text);
        throw new Error("The AI returned an invalid JSON format during analysis. Please try again.");
    }
};

const foresightSchema = {
    type: Type.OBJECT,
    properties: {
        rationale: { type: Type.STRING },
        image_prompt: { type: Type.STRING },
    },
    required: ['rationale', 'image_prompt']
};

export const generateForesight = async (imageFile: File, domain: DomainMode, setProgress: (p: number, s: string) => void): Promise<{ prophecyImageBase64: string, rationale: string }> => {
    setProgress(10, 'Generating strategic rationale...');
    const textModel = 'gemini-2.5-flash';
    const imageModel = 'gemini-2.5-flash-image';
    
    const rationalePrompt = `You are an F1 chief designer. Based on the provided image of a car part, invent a single, high-impact, next-generation evolution of its design. Describe the change and its aerodynamic rationale in a concise paragraph. Then, provide a photorealistic, descriptive prompt for an image generation model to create this new design. The prompt must be detailed and include keywords for realism. Output a valid JSON object like this: {"rationale": "...", "image_prompt": "..."}.`;
    
    const imagePart = await fileToGenerativePart(imageFile);
    
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const textResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: textModel,
        contents: { parts: [{ text: rationalePrompt }, imagePart] },
        config: { 
            responseMimeType: "application/json",
            responseSchema: foresightSchema
        }
    }), {
        onRetry: (attempt, delay) => setProgress(10 + attempt * 5, `Rationale model is busy. Retrying... (Attempt ${attempt})`)
    });

    setProgress(50, 'Rationale confirmed. Engaging visual prophecy core...');

    if (!textResponse.text) {
        throw new Error("The AI returned an empty response for the strategic rationale. Please try again.");
    }
    let rationale: string, image_prompt: string;
    try {
        const cleanedText = textResponse.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsedText = JSON.parse(cleanedText);
        rationale = parsedText.rationale;
        image_prompt = parsedText.image_prompt;
    } catch (e) {
        console.error("Failed to parse foresight rationale JSON:", textResponse.text);
        throw new Error("The AI returned an invalid JSON format for the strategic rationale. Please try again.");
    }

    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const imageResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: image_prompt }, imagePart] },
        config: { responseModalities: [Modality.IMAGE] }
    }), {
        onRetry: (attempt, delay) => setProgress(50 + attempt * 10, `Image model is busy. Retrying... (Attempt ${attempt})`)
    });
    
    setProgress(90, 'Finalizing prophecy image...');
    const generatedPart = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!generatedPart || !generatedPart.inlineData) {
        throw new Error("Foresight image generation failed.");
    }

    return {
        prophecyImageBase64: generatedPart.inlineData.data,
        rationale
    };
};

export const analyzeDelta = async (beforeImage: File, realityImage: File, prophecyBlob: Blob, domain: DomainMode, setProgress: (p: number, s: string) => void): Promise<AnalysisResult> => {
    setProgress(10, 'Preparing multi-image data for delta analysis...');
    const prompt = `You are an F1 engineering team comparing three images: 1) The original 'Before' design. 2) An AI-generated 'Prophecy' of a potential upgrade. 3) The 'Reality' of the upgrade the team actually built. Your task is to perform a delta analysis. Compare 'Reality' to both 'Before' and 'Prophecy'. Identify where 'Reality' matches the 'Prophecy', where it differs, and what the net performance change is compared to 'Before'. Output a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting.`;

    const parts = await Promise.all([
        { text: prompt },
        { text: "\n--- Image 1: Before ---" },
        fileToGenerativePart(beforeImage),
        { text: "\n--- Image 2: AI Prophecy ---" },
        fileToGenerativePart(prophecyBlob, 'image/png'),
        { text: "\n--- Image 3: Reality ---" },
        fileToGenerativePart(realityImage)
    ]);
    
    setProgress(30, 'Contacting AI delta analysis core...');
    const deltaRequest = (model: string) => withRetry(() => ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisResponseSchema
        }
        
    }), {
         timeoutMs: GEMINI_ANALYSIS_TIMEOUT_MS,
         onRetry: (attempt, delay) => {
            setProgress(30 + attempt * 10, `Model is busy. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt})`);
        }
    });

    const response: GenerateContentResponse = await withGeminiModelFallback(deltaRequest, {
        context: 'delta analysis',
        onFallback: () => setProgress(60, 'Delta core saturated. Switching to Flash fallback...'),
    });
    
    setProgress(85, 'Parsing delta analysis report...');
    if (!response.text) {
        throw new Error("The AI returned an empty response during delta analysis. Please try again.");
    }
    try {
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsedResult = JSON.parse(cleanedText);
        return { ...parsedResult, isDemoMode: false };
    } catch (e) {
        console.error("Failed to parse delta analysis JSON:", response.text);
        throw new Error("The AI returned an invalid response format during delta analysis. Please try again.");
    }
};

export const generateSpeechFromText = async (text: string, persona: AIPersona): Promise<string> => {
    const voiceMap = {
        'Aero Sameel': 'Zephyr',
        'Aero Shourya': 'Puck',
        'Aero Varun': 'Kore'
    };
    const voiceName = voiceMap[persona] || 'Zephyr';

    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
    }));

    const audioPart = response.candidates?.[0]?.content?.parts[0];
    if (!audioPart || !audioPart.inlineData) throw new Error("TTS generation failed.");
    return audioPart.inlineData.data;
};

export const getGroundedResponse = async (query: string): Promise<{ text: string, sources: Source[] }> => {
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: query,
       config: { tools: [{googleSearch: {}}] },
    }));

    const sources: Source[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title
        }))
        .filter((source: Source) => source.uri) || [];

    return { text: response.text, sources };
};


export const editImageWithPrompt = async (baseImage: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(baseImage);
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    }));
    
    const generatedPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!generatedPart || !generatedPart.inlineData) {
        throw new Error("Image editing failed.");
    }
    return generatedPart.inlineData.data;
};

// --- Mocked or simple text-based services for other commands ---

export const generateRivalGhost = async (teamName: string, baseImage: File): Promise<{ ghostImageBase64: string, rationale: string, teamName: string }> => {
    // Stage 1: Get the team's design philosophy.
    const rationalePrompt = `In one or two concise sentences, what is the core public design philosophy or key aerodynamic feature of the ${teamName} F1 team's car for this season? Focus on a single, defining characteristic.`;
    const rationaleResponse = await getGroundedResponse(rationalePrompt);
    const philosophy = rationaleResponse.text;

    // Stage 2: Generate a creative visual prompt for the ghost effect based on the philosophy.
    const visualPromptGen = `Based on the design philosophy "${philosophy}", create a short, highly descriptive visual prompt for an AI image editor. This prompt will describe a 'ghost' effect to apply to the ${teamName} car. The output must be ONLY the creative prompt, with no preamble. Example: If philosophy is "aggressive outwash", prompt could be "a transparent ghost car made of swirling aerodynamic streamlines and chaotic vortices, glowing with a fierce red energy".`;
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const visualEffectPromptResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: visualPromptGen }));
    const visualEffectPrompt = visualEffectPromptResponse.text;

    // Stage 3: Generate the final ghost image.
    const imagePrompt = `INTEGRATION TASK: The user has provided an image of their F1 car. Your task is to generate an image of the ${teamName} F1 car that perfectly matches the camera angle, perspective, lighting, and position of the car in the user's image. The ${teamName} car should be rendered with its official livery but modified with the following visual effect: "${visualEffectPrompt}".`;
    const ghostImageBase64 = await editImageWithPrompt(baseImage, imagePrompt);
    
    return { ghostImageBase64, rationale: philosophy, teamName };
};

const simulationSchema = {
    type: Type.OBJECT,
    properties: {
        commentary: { type: Type.STRING },
        winner: { type: Type.STRING },
        timeDelta: { type: Type.STRING },
        laps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    lapTime: { type: Type.STRING },
                    sector1: { type: Type.STRING },
                    sector2: { type: Type.STRING },
                    sector3: { type: Type.STRING },
                    telemetry: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                },
                 required: ['name', 'lapTime', 'sector1', 'sector2', 'sector3', 'telemetry']
            },
        },
    },
    required: ['commentary', 'winner', 'timeDelta', 'laps']
};

export const runRaceSimulation = async (trackName: string): Promise<SimulationResult> => {
    const prompt = `Simulate a single qualifying lap shootout at ${trackName} between two cars: 'Reality' and 'Prophecy'. Generate realistic lap times, sector times, and final commentary. 'Prophecy' should be slightly faster due to its theoretical advantage. Also generate a series of 50 numbers for each car representing their speed telemetry trace through the lap. Output a valid JSON object matching the schema.`;
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: simulationSchema }
    }));
    if (!response.text) {
        throw new Error("The AI returned an empty response for the race simulation. Please try again.");
    }
    try {
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse simulation JSON:", response.text);
        throw new Error("The AI returned an invalid format for the race simulation. Please try again.");
    }
};

export const getCostBenefitAnalysis = async (change: DetectedChange): Promise<string> => {
    const prompt = `Provide a detailed cost-benefit analysis for the following F1 car upgrade:\n\nDescription: ${change.description}\nInterpretation: ${change.interpretation}\nEstimated Cost: $${change.estimatedCost}\nPerformance Gain: ${change.performanceGain}\n\nAnalyze the return on investment. Is this a worthwhile upgrade? Consider cost vs. lap time improvement, and potential risks.`;
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }));
    return response.text;
};

const questionsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

export const generateSuggestedQuestions = async (chatHistory: ChatMessage[]): Promise<string[]> => {
    const historyText = chatHistory.map(m => `${m.persona || m.role}: ${m.text}`).join('\n');
    const prompt = `Based on this conversation history, generate exactly 3 concise, insightful follow-up questions that the user could ask. The questions should be diverse and encourage deeper investigation. Direct them to '@Shourya' or '@Varun'. Output a simple JSON array of strings: ["question 1", "question 2", "question 3"].\n\nHistory:\n${historyText}`;
    try {
        // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: questionsSchema
            }
        }));
        if (!response.text) {
            console.error("AI returned empty response for suggested questions.");
            return [];
        }
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to generate or parse suggested questions:", e);
        return [];
    }
};

const debateSchema = {
    type: Type.OBJECT,
    properties: {
        debate: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    persona: { type: Type.STRING },
                    text: { type: Type.STRING },
                },
                required: ['persona', 'text']
            }
        },
        finalAnswer: {
            type: Type.OBJECT,
            properties: {
                persona: { type: Type.STRING },
                text: { type: Type.STRING },
            },
            required: ['persona', 'text']
        }
    },
    required: ['debate', 'finalAnswer']
};


export const generateDebateAndAnswer = async (userMessage: string, chatHistory: ChatMessage[]): Promise<{ debate: ChatMessage[], finalAnswer: ChatMessage }> => {
    const historyText = chatHistory.map(m => `${m.persona || m.role}: ${m.text}`).join('\n');
    const prompt = `The user has asked: "${userMessage}".
    
    **Your Task:**
    1.  **Internal Debate:** Simulate a brief, internal Socratic debate between Aero Shourya and Aero Varun regarding the user's question. Each specialist should contribute one message, challenging or building upon the other's point of view based on their expertise (Shourya=Aero/Visuals, Varun=Data/Cost).
    2.  **Final Answer:** After the debate, Aero Sameel must provide a single, consolidated, and decisive final answer to the user that synthesizes the key points from the debate.
    
    **Output Format:**
    Return a single, valid JSON object with two keys: "debate" and "finalAnswer".
    - "debate" should be an array of message objects, like: [{"persona": "Aero Shourya", "text": "..."}, {"persona": "Aero Varun", "text": "..."}]
    - "finalAnswer" should be a single message object: {"persona": "Aero Sameel", "text": "..."}

    **Conversation History for Context:**
    ${historyText}`;

    const debateRequest = (model: string) => withRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: debateSchema
        }
    }));

    const response: GenerateContentResponse = await withGeminiModelFallback(debateRequest, {
        context: 'crew debate',
    });

    if (!response.text) {
        throw new Error("The AI returned an empty response for the crew debate. Please try again.");
    }
    try {
        const cleanedText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanedText);
        const debateMessages: ChatMessage[] = parsed.debate.map((msg: any) => ({
            id: `war-room-${Date.now()}-${Math.random()}`,
            role: 'assistant',
            persona: msg.persona,
            text: msg.text,
            isWarRoomMessage: true,
        }));
        return { debate: debateMessages, finalAnswer: parsed.finalAnswer };
    } catch (e) {
        console.error("Failed to parse debate JSON:", response.text);
        throw new Error("The AI returned an invalid format for the crew debate. Please try again.");
    }
};

export const getSetupSheet = async (track: string, conditions: string): Promise<string> => {
    const prompt = `Generate a baseline setup sheet for an F1 car at ${track} under these conditions: ${conditions || 'dry'}. The setup sheet should be concise and include recommendations for: Front Wing Angle, Rear Wing Angle, Differential (On-throttle & Off-throttle), and Brake Bias. Provide a brief justification for each setting. Format the output clearly using Markdown. Start with "**Setup Sheet:**".`;
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }));
    return response.text;
};

export const getAudioAnalysis = async (description: string): Promise<string> => {
    const prompt = `As an F1 intelligence analyst, I have an audio report from a rival car: "${description}". Based on this sound, provide a technical analysis of what it could mean for their powertrain, gearbox, or ERS deployment strategies. What are the potential advantages or disadvantages this sound might indicate?`;
    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }));
    return response.text;
};