// scripts/backfill-clerk-orgs.mjs
// Backfill ÚNICO para la migración a Clerk Organizations (modo híbrido).
// Por cada org existente en Neon (creada con el sistema legacy por clerk_user_id)
// que aún NO tiene clerk_org_id:
//   1) Crea la Organization correspondiente en Clerk (created_by = dueño).
//   2) Guarda orgs.clerk_org_id (mapeo Clerk↔Neon).
//   3) Agrega a los demás miembros activos como membresías de Clerk.
// El webhook /api/clerk/webhook reconciliará org_members (rol/preset) al vuelo.
//
// Re-ejecutable: salta las orgs que ya tienen clerk_org_id.
//
//   CLERK_SECRET_KEY=sk_... DATABASE_URL=postgres://... node scripts/backfill-clerk-orgs.mjs
//   (o con ambas en .env)

import { neon } from '@neondatabase/serverless';
import { createClerkClient } from '@clerk/backend';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readVar(name) {
    if (process.env[name]) return process.env[name];
    for (const f of ['.env', '.env.local']) {
        const p = join(root, f);
        if (!existsSync(p)) continue;
        for (const line of readFileSync(p, 'utf8').split('\n')) {
            const m = line.match(new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*(.+)\\s*$`));
            if (m) return m[1].replace(/^["']|["']$/g, '');
        }
    }
    return null;
}

const dbUrl = readVar('DATABASE_URL_UNPOOLED') || readVar('DATABASE_URL');
const clerkKey = readVar('CLERK_SECRET_KEY');
if (!dbUrl) { console.error('✗ Falta DATABASE_URL'); process.exit(1); }
if (!clerkKey) { console.error('✗ Falta CLERK_SECRET_KEY'); process.exit(1); }

const sql = neon(dbUrl);
const clerk = createClerkClient({ secretKey: clerkKey });

const roleFor = (rol) => (rol === 'owner' || rol === 'admin' ? 'org:admin' : 'org:member');

(async () => {
    // Orgs legacy sin mapeo a Clerk, con dueño válido (excluye la demo).
    const orgs = await sql`
        select id, nombre, clerk_user_id
        from orgs
        where clerk_org_id is null
          and clerk_user_id is not null
          and clerk_user_id <> 'demo-user'
          and coalesce(nombre, '') <> '[cuenta eliminada]'`;

    console.log(`• ${orgs.length} org(s) por migrar a Clerk.\n`);
    let ok = 0, skip = 0, fail = 0;

    for (const org of orgs) {
        try {
            // 1) Crear la Organization en Clerk (el dueño queda como org:admin).
            const created = await clerk.organizations.createOrganization({
                name: org.nombre || 'Mi negocio',
                createdBy: org.clerk_user_id,
            });
            // 2) Guardar el mapeo.
            await sql`update orgs set clerk_org_id = ${created.id} where id = ${org.id}`;

            // 3) Resto de miembros activos (el dueño ya quedó dentro).
            const members = await sql`
                select clerk_user_id, rol from org_members
                where org_id = ${org.id} and estado = 'activo'
                  and clerk_user_id is not null and clerk_user_id <> ${org.clerk_user_id}`;
            for (const m of members) {
                try {
                    await clerk.organizations.createOrganizationMembership({
                        organizationId: created.id,
                        userId: m.clerk_user_id,
                        role: roleFor(m.rol),
                    });
                } catch (e) {
                    console.warn(`  · miembro ${m.clerk_user_id} no agregado: ${e?.errors?.[0]?.message || e.message}`);
                }
            }
            ok++;
            console.log(`✓ ${org.nombre} → ${created.id} (${members.length + 1} miembro/s)`);
        } catch (e) {
            const msg = e?.errors?.[0]?.message || e.message;
            // Si el dueño no existe en Clerk (cuenta de prueba borrada), saltamos.
            console.error(`✗ ${org.nombre} (${org.clerk_user_id}): ${msg}`);
            if (/created_by|not found|resource not found/i.test(msg)) skip++; else fail++;
        }
    }

    console.log(`\n— Hecho: ${ok} migradas, ${skip} saltadas, ${fail} con error.`);
    process.exit(fail ? 1 : 0);
})();
