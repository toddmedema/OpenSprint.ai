/**
 * Main column scroll area for Plan and Execute: small top inset under the phase
 * filter toolbar, horizontal gutters, bottom padding for scroll end.
 */
export const PHASE_MAIN_SCROLL_CLASSNAME =
  "flex-1 min-h-0 overflow-auto pt-2 sm:pt-3 px-4 md:px-6 pb-4 sm:pb-6";

/**
 * Execute main column: single scrollport; the filter toolbar is the first sticky child so
 * flex sibling subpixel gaps cannot show page background between toolbar and list.
 */
export const EXECUTE_SCROLL_PORT_CLASSNAME =
  "flex-1 min-h-0 min-w-0 overflow-auto bg-theme-surface isolate";

/**
 * Sticky Execute filter chrome. Top list inset (pt-* on content) lives here as pb-* so the
 * gutter stays part of the sticky layer while scrolling; otherwise a hairline can show
 * `bg-theme-bg` from the page shell between the toolbar and list.
 */
export const EXECUTE_STICKY_TOOLBAR_CLUSTER_CLASSNAME =
  "sticky top-0 z-30 shrink-0 bg-theme-surface pb-2 sm:pb-3 [background-clip:padding-box]";

/** Horizontal + bottom padding for banners and lists (no top — see sticky cluster). */
export const EXECUTE_MAIN_CONTENT_INSET_CLASSNAME = "px-4 md:px-6 pb-4 sm:pb-6";
