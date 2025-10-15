# STL Craftsman Hub (recreación)

Esta versión recrea la experiencia general del proyecto [stl-craftsman-hub](https://github.com/Josephuu/stl-craftsman-hub) tomando como referencia el flujo descrito por el usuario. El objetivo es contar con un tablero que combine la cotización técnica (vista previa STL + estimaciones) con herramientas de operación diaria (stock, pipeline, consultas especiales).

## Funcionalidades cubiertas

- Visualización de archivos STL en 3D con Three.js y controles orbit.
- Estimaciones de peso, costo y tiempo basadas en volumen, densidad, relleno y capas.
- Planilla de colores que se alimenta automáticamente del inventario disponible.
- Modal de inventario con edición inline de gramos, precio y color, persistido en `localStorage`.
- Resumen listo para compartir por mail o copiar al portapapeles.
- Sección para solicitudes de colores especiales con flujos hacia email/WhatsApp/Instagram.
- Widget lateral con el top de colores disponibles y tablero de pipeline para trabajos en curso.

## Limitaciones y pendientes respecto al proyecto original

No fue posible clonar el repositorio original desde GitHub debido a las restricciones de red del entorno (el proxy bloquea la conexión HTTPS). Por ese motivo:

- No pude replicar pixel perfect los estilos, tipografías o assets SVG propios del proyecto original.
- La estructura exacta de componentes, animaciones y microinteracciones de la versión de Loveable puede diferir.
- No se incluyen automatizaciones backend (por ejemplo, envío de mails o sincronización de stock con un API) si existían en el original.

### Pasos sugeridos para completar la recreación

1. **Clonar el repositorio original** en un entorno con acceso a internet y revisar su estructura (`git clone https://github.com/Josephuu/stl-craftsman-hub`).
2. **Extraer tokens de diseño** (colores, gradientes, tipografías, tamaños) y adaptarlos a `public/styles.css` para igualar la UI.
3. **Comparar componentes**: identificar secciones adicionales (landing, documentación, etc.) y portarlas a `index.html`.
4. **Reutilizar assets**: copiar íconos, ilustraciones o modelos de prueba que se distribuyan con la licencia del repo original.
5. **Revisar lógica de negocio**: si el proyecto original calcula costos de otra manera o integra APIs, replicar esos cálculos en `public/app.js`.
6. **Agregar pruebas manuales**: abrir la web en un navegador moderno, subir un STL y validar que las cifras coincidan con la versión de referencia.

## Cómo ejecutar

No se necesitan dependencias de Node. Cualquier servidor estático alcanza. Algunas opciones:

```bash
# Con Python 3
python -m http.server 8080

# Con npx serve (si ya lo tenés instalado globalmente)
serve public
```

Luego visitá `http://localhost:8080/public/` (o la URL correspondiente) para utilizar la herramienta.

> Si querés mantener el inventario y los pedidos de forma centralizada, podés conectar la UI a un backend propio usando las acciones que ya genera el formulario (por ejemplo un endpoint que reciba el resumen por POST o que envíe correos).

## Flujo sugerido

1. Subí un STL o arrastralo al recuadro. Podés rotarlo y hacer zoom en la vista previa.
2. Ajustá relleno, densidad y cantidad de capas para personalizar la estimación.
3. Definí qué colores querés usar y en qué proporción. El stock se muestra junto a cada opción.
4. Revisá el resumen generado y hacé clic en **Enviar solicitud** para abrir un correo precompletado.
5. Desde el panel de inventario podés cambiar cantidades, precios y agregar nuevos colores.

Los datos del stock se guardan en el almacenamiento local del navegador para que puedas actualizarlos rápidamente sin tocar el código.
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
