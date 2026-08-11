// Merged on top of the unit-test builder's defaults (picked up via
// `runnerConfig: true` in angular.json). Keep this minimal — the Angular team
// does not support arbitrary vitest options through this file.
//
// Shuffling file order makes cross-file state leaks fail on the PR that
// introduces them instead of intermittently in CI. On a failure, vitest prints
// the seed; pin it via `sequence: { seed: <n> }` here (optionally with
// `maxWorkers: 1`) to reproduce locally.
export default {
  test: {
    sequence: { shuffle: true },
  },
};
