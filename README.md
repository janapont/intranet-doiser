# Doiser · Gestor de leads (prototipo)

Este prototipo junta en una sola herramienta todo el proceso de un lead: la entrada desde Meta, Google Ads o la web, la llamada, el cuestionario de cada servicio, la selección automática de proveedores, el envío y la factura mensual.

**Todos los datos son ficticios.** Servicios, precios, proveedores y clientes son inventados, y no hay conexión con ningún sistema real: ni la intranet, ni GoHighLevel, ni Meta, ni Google, ni Holded.

## Cómo abrirlo

Basta con abrir `index.html` en el navegador. No hace falta instalar nada ni compilar. Los cambios se guardan en el propio navegador; para volver a empezar, ve a *Configuración → Reiniciar demo*.

## Qué hay dentro

| Pantalla | Para qué sirve |
|---|---|
| Resumen | Indicadores del mes: leads por estado y por fuente, importe facturable y motivos por los que no se envía al máximo de proveedores. |
| Simular entrada | Formulario del cliente. Genera el mensaje con el formato real de Meta (`field_data`), Google Ads (`user_column_data`) o la web, y lo procesa igual que en producción. |
| Bandeja | Lista única de leads de todas las fuentes, agrupada en: por llamar, por enviar, enviados e inválidos. |
| Ficha del lead | Registro de la llamada (con WhatsApp automático si no contesta), cuestionario del servicio, propuesta de proveedores con su puntuación, envío y mensaje que recibe el proveedor. |
| Proveedores | Precio por servicio, zonas, límites, estado de cobro y calidad. Si cambias algo, la propuesta se recalcula. |
| Facturación | Cierre mensual por proveedor, con el detalle que se enviaría a Holded y la simulación del cobro. |
| Configuración | Pesos del algoritmo, envío automático, WhatsApp y cuestionarios por servicio. |

## Algoritmo de selección

1. **Filtros obligatorios.** Para recibir el lead, el proveedor tiene que cumplir todo esto:
   - ofrece el servicio y no está pausado;
   - cubre la provincia del cliente y no la tiene excluida;
   - acepta ese tipo de cliente;
   - el número de trabajadores está dentro de su rango;
   - no tiene impagos;
   - no ha superado su límite diario ni mensual;
   - no ha recibido ya a este cliente en los últimos 90 días.
2. **Puntuación de 0 a 100.** Combina cinco criterios con pesos configurables: precio que paga, pocas invalidaciones, tasa de contratación, reparto equilibrado y prioridad. Además, suma 10 puntos a los proveedores en periodo de prueba y resta 15 a los que tienen aviso de cobro.
3. **Cuántos proveedores.** Se parte del máximo definido para el servicio. Se envía a uno menos si el lead tiene datos incompletos y a uno solo si es un particular. Solo se proponen proveedores con 35 puntos o más. Cuando no se llega al máximo, se guarda el motivo para saber dónde faltan proveedores.

## Estructura del código

```
index.html            Estructura de la página y orden de carga
css/app.css           Estilos
js/core/util.js       Utilidades (fechas, formatos, teléfonos)
js/core/store.js      Estado y operaciones de negocio  ← única pieza que cambia al conectar la base de datos real
js/engine/ingest.js   Normalización de Meta / Google / web en un lead único
js/engine/matching.js Algoritmo de selección
js/engine/billing.js  Cierre mensual y formato para Holded
js/data/*.js          Datos ficticios y generador de la demo
js/views/*.js         Pantallas
docs/integracion.md   Cómo pasar de este prototipo a producción dentro de la intranet
```

El motor (`engine/`) no depende de las pantallas ni del almacenamiento. Por eso puede reutilizarse tal cual o traducirse a PHP en el servidor.
