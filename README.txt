# Tu Hub de Impresión 3D

Aplicación web estática para gestionar cotizaciones rápidas de impresiones 3D con vista previa STL, selección de colores según stock y generación de solicitud.

## Características principales

- Vista previa interactiva de archivos STL directamente en el navegador usando Three.js.
- Cálculo aproximado de volumen, peso y costos según material, porcentaje de relleno y tarifas personalizables.
- Gestión visual del stock de filamentos con actualización en vivo y almacenamiento local.
- Asignación de colores por segmentos de la pieza para comunicar preferencias específicas.
- Generación automática de un resumen listo para enviar por correo con los detalles de la impresión solicitada.

## Cómo usarla

1. Abre `index.html` en tu navegador favorito.
2. Carga un archivo STL válido.
3. Ajusta los parámetros de material, relleno y costos según tus políticas.
4. Selecciona los colores disponibles para cada parte del modelo.
5. Completa tus datos de contacto y genera el resumen.

> El stock de filamentos se almacena en el `localStorage` del navegador, lo que permite actualizarlo rápidamente sin un backend.

## Desarrollo

No se requieren dependencias adicionales. El proyecto utiliza CDN para cargar Three.js y funciona como un sitio estático.

## Próximos pasos sugeridos

- Conectar la solicitud a un backend o servicio de automatización (Zapier, Make) para recibir los pedidos en un CRM o chat.
- Integrar autenticación simple para proteger el panel de stock si se publica en producción.
- Añadir cálculo automático del tiempo de impresión en base a capas y velocidad usando un slicer externo o API especializada.
