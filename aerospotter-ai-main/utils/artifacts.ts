const ORCHESTRATOR_BASE = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8000';
const JOB_PATH_REGEX = /\/data\/jobs\/([^/]+)\/(.+)/;

const encodeSegmentedPath = (path: string): string =>
  path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

export const resolveArtifactUrl = (artifact?: string | null, comparisonRoot?: string): string | null => {
  if (!artifact) return null;
  const trimmed = artifact.trim();
  if (!trimmed) return null;

  if (/^https?:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  const match = trimmed.match(JOB_PATH_REGEX);
  if (match) {
    const [, jobId, relativePath] = match;
    const encoded = encodeSegmentedPath(relativePath);
    return `${ORCHESTRATOR_BASE.replace(/\/$/, '')}/api/jobs/${jobId}/artifacts/${encoded}`;
  }

  const rootMatch = comparisonRoot?.match(JOB_PATH_REGEX);
  if (rootMatch) {
    const [, jobId] = rootMatch;
    const sanitized = encodeSegmentedPath(trimmed);
    return `${ORCHESTRATOR_BASE.replace(/\/$/, '')}/api/jobs/${jobId}/artifacts/${sanitized}`;
  }

  if (trimmed.startsWith('/')) {
    return `${ORCHESTRATOR_BASE.replace(/\/$/, '')}${trimmed}`;
  }

  return `${ORCHESTRATOR_BASE.replace(/\/$/, '')}/${encodeSegmentedPath(trimmed)}`;
};

export const getOrchestratorBase = (): string => ORCHESTRATOR_BASE;
