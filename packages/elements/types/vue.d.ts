import type { DefineComponent } from 'vue';
import type { CordEventDetail } from './index.js';

export interface CordCotizadorProps {
    token: string;
    baseUrl?: string;
    minHeight?: number;
}

export type CordCotizadorEmits = {
    ready: [];
    approved: [detail: CordEventDetail];
    rejected: [detail: CordEventDetail];
    message: [detail: CordEventDetail];
    pay: [detail: CordEventDetail];
    event: [type: string, detail: CordEventDetail];
};

export const CordCotizador: DefineComponent<CordCotizadorProps, {}, {}, {}, {}, {}, {}, CordCotizadorEmits>;
export type { CordEventDetail };
