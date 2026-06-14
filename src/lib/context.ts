// src/lib/context.ts
// Contexto por-request (AsyncLocalStorage). El middleware de Clerk resuelve el
// userId de la sesión y lo guarda aquí, de modo que cualquier query (db.ts) pueda
// leerlo SIN tener que recibir el request explícitamente en cada función.
//
// Es seguro en el modelo serverless de Vercel (Node/Fluid): AsyncLocalStorage
// aísla el store por cadena async, incluso con instancias reutilizadas entre
// requests concurrentes.

import { AsyncLocalStorage } from 'node:async_hooks';

interface ReqCtx {
    userId: string | null;
}

export const reqContext = new AsyncLocalStorage<ReqCtx>();

/** userId de Clerk de la sesión actual, o null si no hay sesión. */
export function currentUserId(): string | null {
    return reqContext.getStore()?.userId ?? null;
}
