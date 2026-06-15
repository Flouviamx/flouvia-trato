// src/lib/apiv1.ts
// Helpers compartidos de la API pública v1: respuestas con shape estable y
// serializadores que exponen SOLO campos seguros (nunca tokens internos, hashes
// ni columnas crudas de DB). Las rutas reusan las queries de queries.ts y pasan
// el resultado por estos serializadores.

import type { MockQuote } from './queries';

export function ok(data: unknown, meta?: Record<string, unknown>): Response {
    return new Response(JSON.stringify(meta ? { data, meta } : { data }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
    });
}

export function fail(error: string, code: string, status = 400): Response {
    return new Response(JSON.stringify({ error, code }), {
        status, headers: { 'Content-Type': 'application/json' },
    });
}

// Paginación por offset (simple y predecible). Tope duro para no devolver todo.
export function pageParams(url: URL): { limit: number; offset: number } {
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
    return { limit, offset };
}

// ── Serializadores ───────────────────────────────────────────────────────────
export function quoteListItem(q: MockQuote) {
    return {
        id: q.id,
        folio: q.folio,
        cliente: q.cliente,
        status: q.status,
        total: q.total,
        terminos: q.terminos,
        vigencia: q.vigencia,
        creada: q.creada,
        link_publico: `/q/${q.token}`,
    };
}

export function quoteDetail(q: MockQuote) {
    return {
        ...quoteListItem(q),
        notas: q.notas ?? null,
        aprobacion: q.aprobEstado ? { estado: q.aprobEstado, motivo: q.aprobMotivo ?? null } : null,
        items: q.items.map((it) => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            unidad: it.unidad,
            precio_lista: it.precioLista,
            precio_negociado: it.precioNegociado,
        })),
        eventos: q.eventos.map((e) => ({ tipo: e.tipo, detalle: e.detalle, cuando: e.cuando })),
    };
}
