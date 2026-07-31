// scripts/polyfill.ts

/**
 * Cross-browser extension API abstraction.
 * Works seamlessly in Chrome, Edge, Firefox, and Safari.
 */
export function getExtensionApi(): typeof chrome {
    const g = globalThis as any;
    if (typeof g.browser !== 'undefined' && g.browser.runtime) {
        return g.browser as unknown as typeof chrome;
    }
    return g.chrome || (typeof chrome !== 'undefined' ? chrome : undefined);
}

export const extApi = getExtensionApi();
