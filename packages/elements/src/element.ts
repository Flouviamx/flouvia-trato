// Web Component <trato-cotizador> — funciona en HTML plano, Vue, Svelte, Angular,
// Astro… cualquier framework que renderice DOM. Envuelve el core y re-emite los
// eventos del cotizador como CustomEvents NATIVOS (sin el prefijo `trato:`), para
// que en Vue sea `@approved`, en HTML `addEventListener('approved', …)`.
import { mountCotizador } from './core';
import type { TratoController, TratoEventDetail } from './types';

export class TratoCotizadorElement extends HTMLElement {
    private controller: TratoController | null = null;

    static get observedAttributes() {
        return ['token', 'base-url', 'min-height'];
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this.controller?.destroy();
        this.controller = null;
    }

    attributeChangedCallback() {
        // Re-montar si cambia un atributo después de conectado.
        if (this.isConnected) this.render();
    }

    private render() {
        const token = this.getAttribute('token');
        if (!token) {
            console.warn('[Trato] <trato-cotizador> requiere el atributo token');
            return;
        }
        this.controller?.destroy();

        const minAttr = this.getAttribute('min-height');
        const emit = (name: string, detail: TratoEventDetail) =>
            this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));

        this.controller = mountCotizador(this, {
            token,
            baseUrl: this.getAttribute('base-url') || undefined,
            minHeight: minAttr ? parseInt(minAttr, 10) : undefined,
            // Re-emite cada evento sin el prefijo: trato:approved → 'approved'.
            onEvent: (type, detail) => emit(type.replace(/^trato:/, ''), detail),
        });
    }
}

/** Registra el custom element (idempotente). Llamado automáticamente al importar. */
export function defineTratoElements(tag = 'trato-cotizador') {
    if (typeof customElements === 'undefined') return;
    if (!customElements.get(tag)) customElements.define(tag, TratoCotizadorElement);
}
