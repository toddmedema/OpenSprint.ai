/** OpenSprint directory within project repos */
export const OPENSPRINT_DIR = '.opensprint';

/** Paths within the .opensprint directory */
export const OPENSPRINT_PATHS = {
  prd: `${OPENSPRINT_DIR}/prd.json`,
  plans: `${OPENSPRINT_DIR}/plans`,
  conversations: `${OPENSPRINT_DIR}/conversations`,
  sessions: `${OPENSPRINT_DIR}/sessions`,
  feedback: `${OPENSPRINT_DIR}/feedback`,
  active: `${OPENSPRINT_DIR}/active`,
  settings: `${OPENSPRINT_DIR}/settings.json`,
} as const;

/** Global project index path */
export const PROJECT_INDEX_PATH = '~/.opensprint/projects.json';

/** Agent timeout in milliseconds (5 minutes of inactivity) */
export const AGENT_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

/** Default retry limit for failed tasks */
export const DEFAULT_RETRY_LIMIT = 2;

/** Default API port */
export const DEFAULT_API_PORT = 3100;

/** Default WebSocket path */
export const WS_PATH = '/ws';

/** API version prefix */
export const API_PREFIX = '/api/v1';

/** Kanban columns in display order */
export const KANBAN_COLUMNS = [
  'planning',
  'backlog',
  'ready',
  'in_progress',
  'in_review',
  'done',
] as const;

/** Plan complexity options */
export const PLAN_COMPLEXITIES = ['low', 'medium', 'high', 'very_high'] as const;

/** Task priority labels */
export const PRIORITY_LABELS: Record<number, string> = {
  0: 'Critical',
  1: 'High',
  2: 'Medium',
  3: 'Low',
  4: 'Lowest',
};
