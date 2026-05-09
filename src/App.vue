<template>
  <router-view />
</template>

<style>
/* ── Layout & design tokens ─────────────────────────────────
   Non-color CSS variables used across layout and view components.
   Colors come from Arco Design CSS variables (arco.css).
   ──────────────────────────────────────────────────────────── */
:root {
  /* Sidebar / header dimensions */
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --sidebar-tablet-width: 240px;
  --sidebar-tablet-collapsed-width: 64px;
  --header-height: 56px;

  /* Motion */
  --transition-fast: 0.15s;
  --transition-normal: 0.25s;
  --transition-slow: 0.3s;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* Monospace font stack */
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

/* App shell */
#app {
  min-height: 100vh;
  background-color: var(--color-bg-2);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-fill-1); border-radius: 3px; }
::-webkit-scrollbar-thumb { background: var(--color-border-2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-border-3); }

/* Accessibility */
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}
</style>
