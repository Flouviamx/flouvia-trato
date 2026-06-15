// src/lib/webhooks.ts
// Webhooks SALIENTES: cuando algo le pasa a una cotización (enviada, vista,
// aprobada, rechazada, pagada, facturada), notificamos a las URLs que la org
// registró en Ajustes › Developers. La entrega es POST JSON firmado con
// HMAC-sha256 para que el receptor verifique el origen.
//
// REGLA DE ORO: dispatchQuoteEvent NUNCA lanza. Un fallo de webhook jamás debe
// romper la operación de negocio que lo originó (enviar, aprobar, cobrar…).

import { createHmac } from 'node:crypto';
import { sql } from './db';

// Catálogo de eventos públicos (lo consume la UI y la validación de la API).
export const WEBHOOK_EVENTS = [
    { id: 'quote.sent', label: 'Cotización enviada' },
    { id: 'quote.viewed', label: 'Cotización vista' },
    { id: 'quote.approved', label: 'Cotización aprobada' },
    { id: 'quote.rejected', label: 'Cotización rechazada' },
    { id: 'quote.paid', label: 'Pago recibido' },
    { id: 'invoice.stamped', label: 'CFDI timbrado' },
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]['id'];
export const WEBHOOK_EVENT_IDS = WEBHOOK_EVENTS.map((e) => e.id) as string[];

const TIMEOUT_MS = 5000;
const sign = (secret: string, body: string) => createHmac('sha256', secret).update(body).digest('hex');

// Una entrega individual (con un reintento). Actualiza el resultado en la fila.
async function deliver(hook: any, evento: string, body: string): Promise<void> {
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Trato-Webhooks/1.0',
        'X-Trato-Event': evento,
        'X-Trato-Signature': `sha256=${sign(hook.secret as string, body)}`,
    };

    let status = 0;
    let error: string | null = null;

    for (let intento = 0; intento < 2; intento++) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(hook.url as string, { method: 'POST', headers, body, signal: ctrl.signal });
            clearTimeout(t);
            status = res.status;
            if (res.ok) { error = null; break; }
            error = `HTTP ${res.status}`;
        } catch (e: any) {
            clearTimeout(t);
            status = 0;
            error = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'error de red');
        }
        // backoff mínimo antes del reintento
        if (intento === 0) await new Promise((r) => setTimeout(r, 300));
    }

    // Registrar el resultado de la última entrega (best-effort).
    sql`update webhooks set last_status = ${status || null}, last_error = ${error}, last_delivery_at = now() where id = ${hook.id}`
        .catch(() => {});
}

/**
 * Notifica un evento de cotización a las webhooks suscritas de la org. Construye
 * el payload desde la cotización y lo entrega a cada URL en paralelo. Silencioso:
 * cualquier error (incluida tabla no migrada) se traga.
 */
export async function dispatchQuoteEvent(orgId: string, cotizacionId: string, evento: WebhookEvent): Promise<void> {
    try {
        let hooks: any[] = [];
        try {
            hooks = await sql`select * from webhooks where org_id = ${orgId} and activo = true`;
        } catch { return; } // tabla aún no migrada → no-op
        const subs = hooks.filter((h) => {
            const evs = Array.isArray(h.eventos) ? h.eventos : [];
            return evs.length === 0 || evs.includes(evento);
        });
        if (!subs.length) return;

        // Payload con un resumen estable de la cotización (sin datos sensibles).
        const [q] = await sql`
            select c.id, c.folio, c.status, c.total, c.public_token, cl.empresa
            from cotizaciones c left join clientes cl on cl.id = c.cliente_id
            where c.id = ${cotizacionId} and c.org_id = ${orgId}`;
        if (!q) return;

        const body = JSON.stringify({
            event: evento,
            created_at: new Date().toISOString(),
            data: {
                id: q.id,
                folio: q.folio,
                status: q.status,
                total: Number(q.total ?? 0),
                cliente: q.empresa ?? null,
                link_publico: `/q/${q.public_token}`,
            },
        });

        await Promise.all(subs.map((h) => deliver(h, evento, body)));
    } catch {
        /* nunca romper la operación principal por un webhook */
    }
}
