// The unit-test builder runs vitest with `isolate: false`, so spec files that
// share a worker share one JSDOM. Anything left on a true global — web storage,
// spies on `console`/`window`, fake timers, `<html>`/`<body>` state — leaks into
// whichever spec file runs next, producing order-dependent CI-only failures.
// This file makes cleanup structural instead of per-spec discipline.
//
// PreferencesService reads the `data-density`/`data-motion` attributes on
// `<html>` in preference to localStorage, so clearing storage alone is not a
// complete preferences reset — the attributes must go too.

const PREFERENCE_ATTRS = ['data-density', 'data-motion', 'data-card-theme'];

function resetSharedDom(): void {
  localStorage.clear();
  sessionStorage.clear();
  document.body.style.overflow = '';
  for (const attr of PREFERENCE_ATTRS) {
    document.documentElement.removeAttribute(attr);
  }
}

beforeEach(() => {
  resetSharedDom();
});

afterEach(() => {
  resetSharedDom();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
