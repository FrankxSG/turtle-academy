/** Commit the trials build was made from, injected by vite.trials.config.ts. */
declare const __TRIALS_COMMIT__: string
export const TRIALS_COMMIT: string = typeof __TRIALS_COMMIT__ === 'string' ? __TRIALS_COMMIT__ : 'dev'
