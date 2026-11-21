# Plan para integrar el gestor en la intranet

El objetivo es que el gestor sea una sección nueva de la intranet, por ejemplo `doiser.com/intranet/gestor/`, que funcione en paralelo a la intranet actual. Así, si hace falta, todo lo antiguo sigue disponible.

## 1. Cómo convivir con la intranet actual

- **Mismo servidor y mismo inicio de sesión.** La carpeta del gestor se sube junto a la intranet y reutiliza su sesión de usuario.
- **Sus propias tablas.** El gestor tendrá tablas nuevas en la misma base de datos, con el prefijo `gl_`: `gl_leads`, `gl_envios`, `gl_llamadas`, `gl_servicios`, `gl_preguntas`, `gl_facturas`. No se modifica ninguna tabla antigua.
- **Puente con lo antiguo.** Cada envío a un proveedor también se escribe en `Contacto_Lead` (una fila por lead y proveedor, como ahora) para que los informes y la facturación actuales sigan funcionando durante la transición.
- **Proveedores.** Se leen de la tabla de proveedores existente. Los datos que hoy no existen (precio por servicio, rango de trabajadores) se guardan en una tabla nueva, `gl_proveedor_servicio`.

## 2. Qué hay que programar en el servidor (PHP)

| Endpoint | Función |
|---|---|
| `POST /gestor/api/webhook/meta` | Recibe los leads de Meta, directamente o reenviados por GoHighLevel. Aplica `ingest.desdeMeta`. |
| `POST /gestor/api/webhook/google` | Recibe los leads de los formularios de Google Ads. Aplica `ingest.desdeGoogle`. |
| `POST /gestor/api/webhook/web` | Recibe el formulario de doiser.com. |
| `GET/POST /gestor/api/leads...` | Bandeja, ficha, llamadas, cuestionario y envío. Sustituye a `store.js`. |
| `POST /gestor/api/whatsapp` | Envía las plantillas de WhatsApp mediante la API de WhatsApp Business (Cloud API) o mediante GoHighLevel. |
| `POST /gestor/api/facturacion/cierre` | Cierre mensual: crea las facturas en Holded por API. |

En el navegador, solo hay que sustituir `js/core/store.js` por llamadas a esta API. Las pantallas y el motor no cambian.

## 3. Piezas nuevas pendientes de definir

- **WhatsApp de bienvenida.** Se envía en cuanto entra un lead con un teléfono válido. Hay que definir el texto y que Meta apruebe la plantilla.
- **Transcripción de la llamada.** Se graba la llamada, se pasa a texto y una IA rellena el cuestionario del servicio. Los campos rellenados así se marcan para que el comercial los revise antes de cualificar. Antes de grabar hay que avisar al cliente y obtener su consentimiento (RGPD), y elegir la telefonía (centralita con API o app de llamadas).
- **Selección editable.** El comercial puede añadir o quitar proveedores de la propuesta, también después de enviar. Si elige uno que el algoritmo descarta, el envío queda registrado con el aviso. Los envíos quitados antes de facturar no se cobran.

## 4. Orden propuesto

1. Validar el prototipo con el equipo: cuestionarios, reglas del algoritmo, estados.
2. Conseguir acceso al código y a la base de datos de la intranet, y definir las tablas `gl_`.
3. Primera versión real con entrada desde GoHighLevel: se añade un paso de webhook a los workflows «Nuevo lead» y desde la web. La gestión se hace en el gestor y los envíos se escriben también en la intranet antigua.
4. Facturación conectada a Holded (primero en modo borrador).
5. WhatsApp automático y conexión directa con Meta Lead Ads. Cuando funcionen, se puede dar de baja GoHighLevel.

## 5. Accesos necesarios

- Código y base de datos de la intranet (Toni o el hosting).
- Holded: una clave de API, al principio en modo lectura o borrador.
- Meta Business Manager: un usuario administrador para la app de Lead Ads y para WhatsApp Business. Solo en el paso 5.
- Google Ads: configurar el webhook de los formularios. Solo si se usan formularios de Google.
