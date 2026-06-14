// src/lib/db.ts
// Cliente de Neon (PostgreSQL serverless). Una sola conexión HTTP por request —
// ideal para el modelo serverless de Vercel (sin pool persistente).
//
// El `sql` es un tagged-template: sql`select * from orgs where id = ${id}`
// parametriza automáticamente (a prueba de inyección). Para queries dinámicas
// usar sql.query('... $1 ...', [params]).

import { neon } from '@neondatabase/serverless';
import { currentUserId } from './context';

const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
    // No tiramos en build (las páginas SSR sólo tocan la DB en runtime), pero
    // dejamos un error claro si alguna query corre sin la variable.
    console.warn('[db] DATABASE_URL no está definida — las queries fallarán en runtime.');
}

export const sql = neon(url || 'postgres://invalid');

// ── Tenancy seam ──────────────────────────────────────────────────────────
// Resuelve el org_id desde la sesión de Clerk (userId → orgs.clerk_user_id). La
// org se CREA en el primer login (lazy, upsert idempotente). Si no hay sesión
// (contextos sin auth: cron, o llamadas previas a la migración), cae a la org
// demo para no romper. Las rutas /app y las APIs internas SIEMPRE traen sesión
// (protegidas en el middleware).
export const DEMO_CLERK_USER_ID = 'demo-user';

async function demoOrgId(): Promise<string> {
    const rows = await sql`select id from orgs where clerk_user_id = ${DEMO_CLERK_USER_ID} limit 1`;
    if (!rows.length) throw new Error('[db] org demo no encontrada — ¿corriste la migración (npm run db:migrate)?');
    return rows[0].id as string;
}

export async function getActiveOrgId(): Promise<string> {
    const userId = currentUserId();
    if (!userId) return demoOrgId(); // sin sesión (cron, etc.) → org demo

    // ¿Ya existe la org del usuario?
    const rows = await sql`select id from orgs where clerk_user_id = ${userId} limit 1`;
    if (rows.length) return rows[0].id as string;

    // Primer login: crear la org. El upsert (do update no-op) hace que `returning`
    // devuelva la fila aunque dos requests concurrentes intenten crearla a la vez.
    const [created] = await sql`
        insert into orgs (clerk_user_id, nombre)
        values (${userId}, ${'Mi negocio'})
        on conflict (clerk_user_id) do update set clerk_user_id = excluded.clerk_user_id
        returning id`;
    return created.id as string;
}

// ── Audit log inmutable ──────────────────────────────────────────────────────
// Registra un evento en audit_log. Envuelto en try/catch: la auditoría nunca debe
// romper la operación principal (ni antes de correr la migración).
interface AuditEvent { accion: string; entidad?: string; entidad_id?: string; detalle?: string; ip?: string | null; }
export async function logAudit(orgId: string, e: AuditEvent): Promise<void> {
    try {
        await sql`insert into audit_log (org_id, actor, accion, entidad, entidad_id, detalle, ip)
                  values (${orgId}, ${currentUserId() ?? DEMO_CLERK_USER_ID}, ${e.accion}, ${e.entidad ?? null}, ${e.entidad_id ?? null}, ${e.detalle ?? null}, ${e.ip ?? null})`;
    } catch { /* no-op: no romper la operación por fallo de auditoría */ }
}

// Extrae la IP del request (Vercel/Proxy → x-forwarded-for).
export function reqIp(request: Request): string {
    return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconocida';
}
