import type { APIRoute } from 'astro';
import { sql } from '../../../lib/db';
import { runARAgent } from '../../../lib/agents/ar-agent';

// Webhook para recibir correos entrantes (ej. Resend o SendGrid Inbound Parse)
export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    
    // Asumimos un formato simplificado del webhook de correo
    const emailFrom = payload.from;
    const emailBody = payload.text || payload.html;
    
    // Necesitamos identificar a qué cotización pertenece este correo.
    // Usualmente se hace con un Reply-To único o parseando el asunto (ej. "[Ref: COT-001]")
    // Aquí hacemos un mock buscando la cotización más reciente de ese email que esté en cobranza.
    const [quote] = await sql`
      SELECT c.id as cotizacion_id, c.org_id, c.total, c.vigencia, cl.empresa
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE cl.email = ${emailFrom}
        AND c.status = 'invoiced'
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    if (!quote) {
      return new Response(JSON.stringify({ error: 'Cotización no encontrada para este remitente' }), { status: 404 });
    }

    // Registrar el mensaje del cliente en la base de datos
    await sql`
      INSERT INTO cobranza_conversaciones (org_id, cotizacion_id, autor_tipo, mensaje)
      VALUES (${quote.org_id}, ${quote.cotizacion_id}, 'cliente', ${emailBody})
    `;

    // Re-ejecutar el agente para que procese la respuesta del cliente y genere el siguiente correo
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

    const agentResponse = await runARAgent({
      cotizacionId: quote.cotizacion_id,
      orgId: quote.org_id,
      clienteNombre: quote.empresa,
      clienteEmail: emailFrom,
      montoAdeudado: parseFloat(quote.total),
      diasVencido: Math.max(0, Math.floor((Date.now() - new Date(quote.vigencia).getTime()) / (1000 * 60 * 60 * 24))),
      historialConversacion: mappedHistory as any
    });

    // Enviar el nuevo correo de respuesta usando Resend
    // await sendEmail({ to: emailFrom, subject: 'Re: Su estado de cuenta', body: agentResponse });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Error procesando inbound email:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
