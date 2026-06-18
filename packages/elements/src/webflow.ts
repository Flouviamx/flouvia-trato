import { mountCotizador } from './core';

/**
 * Auto-initialization script designed for Webflow and Vanilla sites.
 * Looks for elements with the `data-cord-token` attribute and mounts the cotizador.
 * 
 * Usage in Webflow:
 * 1. Add a Div Block.
 * 2. In Settings, add a Custom Attribute: Name: `data-cord-token`, Value: `your-token`
 * 3. Include this script in the page or site settings.
 */
function initWebflow() {
    const elements = document.querySelectorAll('[data-cord-token]');
    
    elements.forEach((el) => {
        // Skip if already mounted
        if (el.hasAttribute('data-cord-mounted')) return;
        
        const token = el.getAttribute('data-cord-token');
        if (!token) return;

        const baseUrl = el.getAttribute('data-cord-base-url') || undefined;
        const minHeightAttr = el.getAttribute('data-cord-min-height');
        const minHeight = minHeightAttr ? parseInt(minHeightAttr, 10) : undefined;

        mountCotizador(el as HTMLElement, {
            token,
            baseUrl,
            minHeight,
        });

        el.setAttribute('data-cord-mounted', 'true');
    });
}

// Run immediately if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebflow);
} else {
    initWebflow();
}

export { initWebflow };
