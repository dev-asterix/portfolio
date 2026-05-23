/**
 * Centralised storage key constants for localStorage and sessionStorage.
 *
 * Every module that reads or writes browser storage MUST reference these
 * constants rather than hard-coding key strings. This prevents typos,
 * makes key usage grep-able, and keeps the persistence surface explicit.
 */
export const STORAGE_KEYS = {
  // ─── localStorage ──────────────────────────────────────────────────────────
  /** Settings + windows + focusOrder + nextPid + notifications */
  os: "asterix-os-storage",
  /** Snapshot taken at crash event for session recovery */
  preCrash: "asterix-pre-crash",
  /** Flag set by Power button reboot to suppress recovery prompt */
  cleanShutdown: "asterix-clean-shutdown",
  /** Persisted /home/dev-asterix/Documents tree */
  vfsUser: "asterix-vfs-user",
  /** Login bypass (remember-me checkbox) */
  rememberMe: "asterix-remember-me",
  /** FirstRunOverlay seen flag */
  onboarded: "asterix-onboarded",

  // ─── sessionStorage ────────────────────────────────────────────────────────
  /** Boot sequence completed for this tab session */
  bootDone: "asterix-boot-done",
  /** Per-window browser tabs/history/activeTabId */
  browserSession: "asterix-browser-session",
  /** Terminal current working directory */
  terminalCwd: "asterix-terminal-cwd",
  /** Terminal command history (JSON array, capped at 100) */
  terminalHistory: "asterix-terminal-history",
  /** /tmp tree — only persisted when settings.restoreVfsOnReload is true */
  vfsTmp: "asterix-vfs-tmp",
  /** Session login state */
  loggedIn: "asterix-logged-in",
} as const;

/** Union of all storage key values for type-safe lookups */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
