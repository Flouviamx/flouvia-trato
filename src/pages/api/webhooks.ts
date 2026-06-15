// /api/webhooks — gestión de endpoints salientes de la org (Developers).
//   POST   { url, eventos? }            → { id, secret }   (secret en claro UNA vez)
//   PATCH  { id, activo?, eventos?, url? } → { ok }
//   DELETE { id }                        → { ok }
// El secret firma cada entrega (HMAC-sha256). Requiere permiso 'ajustes' + plan API.
export const prerender = false;

import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { sql, getActiveOrgId, logAudit, reqIp } from '../../lib/db';
import { requirePerm } from '../../lib/queries';
import { planTieneApi } from '../../lib/permissions';
import { WEBHOOK_EVENT_IDS } from '../../lib/webhooks';

function cleanEventos(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return [...new Set(v.map(String).filter((e) => WEBHOOK_EVENT_IDS.includes(e)))];
}

function validUrl(u: string): boolean {
    try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; }
    catch { return false; }
}

export const POST: APIRoute = async ({ request }) => {
    const denied = await requirePerm('ajustes'); if (denied) return denied;
    let body: any;
    try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

    const url = String(body.url ?? '').trim();
    if (!validUrl(url)) return json({ error: 'La URL no es válida (debe empezar con https://)' }, 400);

    const orgId = await getActiveOrgId();
    const [{ plan }] = await sql`select coalesce(plan,'free') as plan from orgs where id = ${orgId}`;
    if (!planTieneApi(plan as string)) {
        return json({ error: 'Los webhooks requieren el plan Negocio.' }, 403);
    }

    const eventos = cleanEventos(body.eventos);
    const secret = `whsec_${randomBytes(24).toString('hex')}`;

    let row: any;
    try {
        [row] = await sql`
            insert into webhooks (org_id, url, eventos, secret)
            values (${orgId}, ${url}, ${JSON.stringify(eventos)}::jsonb, ${secret})
            returning id`;
    } catch {
        return json({ error: 'No se pudo crear. ¿Corriste la migración (npm run db:migrate)?' }, 500);
    }
    await logAudit(orgId, { accion: 'webhook.creado', entidad: 'webhook', entidad_id: row.id as string, detalle: url, ip: reqIp(request) });
    return json({ id: row.id, secret });
};

export const PATCH: APIRoute = async ({ request }) => {
    const denied = await requirePerm('ajustes'); if (denied) return denied;
    let body: any;
    try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
    const id = String(body.id ?? '');
    if (!id) return json({ error: 'Falta id' }, 400);

    const orgId = await getActiveOrgId();
    if (typeof body.activo === 'boolean') {
        await sql`update webhooks set activo = ${body.activo} where id = ${id} and org_id = ${orgId}`;
    }
    if (Array.isArray(body.eventos)) {
        await sql`update webhooks set eventos = ${JSON.stringify(cleanEventos(body.eventos))}::jsonb where id = ${id} and org_id = ${orgId}`;
    }
    if (typeof body.url === 'string') {
        if (!validUrl(body.url)) return json({ error: 'La URL no es válida' }, 400);
        await sql`update webhooks set url = ${body.url.trim()} where id = ${id} and org_id = ${orgId}`;
    }
    return json({ ok: true });
};

export const DELETE: APIRoute = async ({ request }) => {
    const denied = await requirePerm('ajustes'); if (denied) return denied;
    let body: any;
    try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
    const id = String(body.id ?? '');
    if (!id) return json({ error: 'Falta id' }, 400);

    const orgId = await getActiveOrgId();
    const rows = await sql`delete from webhooks where id = ${id} and org_id = ${orgId} returning url`;
    if (!rows.length) return json({ error: 'Webhook no encontrado' }, 404);
    await logAudit(orgId, { accion: 'webhook.eliminado', entidad: 'webhook', entidad_id: id, detalle: rows[0].url as string, ip: reqIp(request) });
    return json({ ok: true });
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
