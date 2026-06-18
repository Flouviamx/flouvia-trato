import type { APIRoute } from 'astro';
import { sql } from '../../../lib/db';
import { runARAgent } from '../../../lib/agents/ar-agent';

// Este cron job debería ser llamado diariamente (ej. vía Vercel Cron)
export const GET: APIRoute = async () => {
  try {
    // Buscar cotizaciones facturadas y vencidas (sin paid_at)
    const overdueQuotes = await sql`
      SELECT 
        c.id as cotizacion_id, 
        c.org_id, 
        c.total as monto_adeudado, 
        c.vigencia,
        cl.empresa as cliente_nombre,
        cl.email as cliente_email,
        DATE_PART('day', NOW() - c.vigencia) as dias_vencido
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.status = 'invoiced'
        AND c.paid_at IS NULL
        AND c.vigencia < NOW()
    `;

    const results = [];

    for (const quote of overdueQuotes) {
      // Obtener el historial de la conversación para esta cotización
      const historial = await sql`
        SELECT autor_tipo, mensaje 
        FROM cobranza_conversaciones
        WHERE cotizacion_id = ${quote.cotizacion_id}
        ORDER BY created_at ASC
      `;

      const mappedHistory = historial.map((h: any) => ({
        rol: h.autor_tipo === 'agente_ia' ? 'assistant' : 'user',
        contenido: h.mensaje
      }));

      // Llamar al agente
      const agentResponse = await runARAgent({
        cotizacionId: quote.cotizacion_id,
        orgId: quote.org_id,
        clienteNombre: quote.cliente_nombre,
        clienteEmail: quote.cliente_email,
        montoAdeudado: parseFloat(quote.monto_adeudado),
        diasVencido: Math.floor(quote.dias_vencido),
        historialConversacion: mappedHistory as any
      });

      // Aquí se integraría el envío real del correo vía Resend
      // await sendEmail({ to: quote.cliente_email, subject: 'Aviso de factura vencida', body: agentResponse });

      results.push({ cotizacionId: quote.cotizacion_id, status: 'procesada' });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en cron de cobranza:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
