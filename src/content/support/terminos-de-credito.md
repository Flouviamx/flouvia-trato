---
title: "Añadir términos de crédito (Net 30/60)"
description: "Guía para emitir facturas con crédito comercial a clientes recurrentes."
category: "Cotizaciones"
order: 3
---

# Añadir términos de crédito (Net 30/60)

Esta guía detallada te proporcionará todos los pasos técnicos y mejores prácticas necesarios para gestionar este proceso dentro de Cord. Asegúrate de leer cuidadosamente todas las advertencias antes de proceder.

## Consideraciones Previas

Antes de comenzar con la configuración, debes tener en cuenta los siguientes puntos fundamentales:
- Requieres permisos de **Administrador** para efectuar cambios a nivel cuenta.
- Los cambios realizados pueden tardar hasta 5 minutos en reflejarse globalmente debido al almacenamiento en caché perimetral.

> [!IMPORTANT]
> **Acción Irreversible**
> Ten extremo cuidado al modificar estos parámetros, ya que pueden afectar directamente tu facturación y los enlaces de pago que ya hayas enviado a tus clientes.

## Paso a Paso (Guía Técnica)

Sigue estos pasos en el orden indicado para asegurar una implementación correcta:

1. Ingresa a tu panel de control y dirígete a la sección de **Configuración Avanzada**.
2. Localiza el módulo correspondiente a este artículo.
3. Haz clic en el botón *Editar* (representado por el ícono de engranaje).
4. Introduce los nuevos valores asegurándote de no dejar espacios en blanco.

```javascript
// Ejemplo de payload esperado por el sistema
{
  "status": "success",
  "data": {
    "module_active": true,
    "timestamp": 1718968200
  }
}
```

## Solución de Problemas Frecuentes

Si encuentras algún error después de seguir los pasos anteriores, revisa estas posibles causas:

- **Error 403 Forbidden:** Tu usuario no tiene el rol necesario. Visita la [Guía de Roles y Permisos](/soporte/invitar-miembros-roles) para asignar el nivel de acceso correcto.
- **Los cambios no se guardan:** Asegúrate de que no haya una interrupción temporal en la API. Puedes consultar el estado en [status.flouvia.com](https://status.flouvia.com).

> [!TIP]
> **Consejo Profesional**
> Te recomendamos hacer pruebas en el entorno **Sandbox** antes de aplicar esto en producción. Para más detalles, revisa nuestro artículo sobre el [Entorno de Pruebas (Sandbox)](/soporte/sandbox-pruebas).

Si después de revisar este documento sigues enfrentando bloqueos, no dudes en contactar a nuestro equipo de ingeniería.
