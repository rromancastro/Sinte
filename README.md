# Sinte

MVP mobile-first para buscar canchas y consultar por WhatsApp. Next.js App Router, JavaScript, Sass y Firebase. Organización basada en `D:\Proyectos\nodo`: componentes con exportaciones nombradas, JSX y SCSS juntos, secciones por ruta y archivos `index.js`.

## Estado de esta entrega

- Pantallas públicas, login y panel de propietario implementados.
- Recursos originales exportados desde la app de Figma en `design/`; fotografías, logo e iconos en `public/images/`.
- Demostración local explícita con siete establecimientos ficticios. No utiliza emuladores ni escribe en Firestore.
- Backend preparado para Firebase real. Faltan las credenciales administrativas, por decisión del usuario.
- No se cargó el seed, no se crearon propietarios, no se desplegaron reglas o índices y no se publicó la aplicación.
- Los tests verifican lógica y autorización del backend con dobles de prueba; no sustituyen pruebas de reglas o integración contra Firebase real.
- La revisión del sitio renderizado en Brave quedó pendiente: expiró la autorización de control de esa aplicación. Las siete vistas y la biblioteca de Figma sí fueron inspeccionadas en la app de escritorio. No se afirma fidelidad visual verificada al píxel.

## Instalación

Node.js 22 o superior; se desarrolló con Node 24 y npm 11.

```sh
npm ci
```

Copiar `.env.example` a `.env.local` y completar las variables. En esta entrega ya existe un `.env.local` ignorado por Git, con la configuración web proporcionada y la demostración activada.

```sh
npm run dev
npm test
npm run build
npm start
```

En PowerShell con scripts deshabilitados, usar `npm.cmd`. No es necesario cambiar la política de ejecución.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración pública de la app web, Authentication y Analytics. |
| `FIREBASE_ADMIN_PROJECT_ID` | Proyecto del backend; inicialmente `sinte-7dbec`. |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email de cuenta de servicio, exclusivamente servidor. |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clave privada, exclusivamente servidor. Se aceptan saltos de línea escapados con `\n`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Alternativa local: ruta absoluta a una cuenta de servicio fuera del repositorio. |
| `SINTE_DEMO_MODE` | `true` sirve los datos ficticios locales; `false` consulta Firestore. |
| `SINTE_SHOW_DEMO_ESTABLISHMENTS` | Permite mostrar documentos `isDemo` desde Firestore; mantener `false` en producción real. |
| `NEXT_PUBLIC_SITE_URL` | URL canónica del despliegue, utilizada en metadata y comprobación de origen. |
| `NEXT_PUBLIC_FIREBASE_ANALYTICS_ENABLED` | Habilita Analytics web únicamente si es `true`, en navegador compatible. Mantener `false` en desarrollo. |
| `SINTE_ANALYTICS_HASH_SECRET` | Secreto aleatorio del servidor para deduplicar clics de contacto entre instancias. Sin esta variable no se escriben agregados de clics. |

Las variables `NEXT_PUBLIC_*` forman parte del bundle público y requieren un nuevo build al modificarse. Ninguna credencial administrativa puede llevar ese prefijo. No incorporar archivos de cuentas de servicio a Git.

## Firebase

1. Firestore y el proveedor Email/Password ya fueron creados por el usuario.
2. Configurar las credenciales administrativas en el entorno del servidor. El módulo administrativo es lazy: el build funciona sin credenciales.
3. Revisar los dominios autorizados de Authentication para desarrollo y para el dominio definitivo. Configurar en Firebase Console los emails de recuperación en español.
4. Revisar las reglas e índices versionados antes de autorizar su despliegue.
5. Desactivar la demostración local solamente cuando estén listos credenciales, índices, reglas y datos.

El SDK cliente centraliza `getApps()/getApp()`, Authentication persistente y Firestore. Analytics se carga dinámicamente y comprueba `isSupported()`. El backend utiliza Firebase ID Tokens, comprueba revocación y vuelve a verificar los permisos dentro de cada transacción. No hay registro público de propietarios.

No se inicializa ni importa el servicio de almacenamiento de Firebase. El SDK oficial agregado incluye módulos opcionales transitivos en el lockfile; la aplicación no utiliza esos módulos.

## Datos y fuentes de verdad

| Colección | Responsabilidad |
| --- | --- |
| `cities/{id}` | Ciudad activa, provincia, slug y zona horaria. |
| `establishments/{id}` | Datos públicos, WhatsApp internacional, rutas locales ordenadas de imágenes, servicios, mapa, modalidad, destacados y `pricesByType`. |
| `courts/{id}` | Cancha individual, tipo `5`, `7` u `11`, plantilla semanal, recurrencias y claves semanales consultables. |
| `availability/{courtId}_{date}` | Excepciones de una jornada: bloqueo completo, estados explícitos por turno y reemplazo opcional de horarios. Sólo se crea al modificar una jornada. |
| `users/{uid}` | Rol, estado y establecimientos asignados. Privado para otros usuarios. |
| `cityState/{cityId}` | Versión monotónica para invalidar la caché de una ciudad. Sólo servidor. |
| `settings/public` | Configuración pública, incluido `whatsapp`; contacto inicial `5492665036482`. |
| `analytics/{establishmentId}_{date}` | Agregado privado de clics de WhatsApp y hashes recientes para deduplicación. No representa reservas. |

`recurringBlocks` se guarda como un array acotado dentro de cada cancha, en lugar de crear otra consulta por recurrencia. No contiene información de jugadores. La plantilla tiene claves `0` a `6` (domingo a sábado), con arrays de turnos. `weeklyKeys` deriva exclusivamente de esa plantilla, y se actualiza en la misma transacción.

Los precios tienen una única fuente de verdad en `establishments.pricesByType`; no se copian a cada cancha ni a cada fecha. Las imágenes se guardan como rutas relativas; nunca como HTML o Base64 en la base.

### Disponibilidad y madrugada

Prioridad: bloqueo completo → excepción individual → turno fijo vigente → plantilla semanal. Una excepción de horarios sustituye la plantilla para esa fecha; no elimina ocupaciones ni bloqueos. Desbloquear un día conserva sus estados individuales.

La búsqueda cubre 30 jornadas, sin precrear documentos y sin cron. La madrugada pertenece a la jornada anterior, según lo indicado por el usuario. Internamente `24:00` significa las `00:00` del día siguiente y `25:00` las `01:00`; la interfaz siempre muestra formato de 24 horas, con la indicación “día siguiente” o “+1”. La zona horaria inicial es `America/Argentina/San_Luis`. El mensaje de WhatsApp y la validación de turnos pasados utilizan el instante y la fecha reales.

El selector público ofrece jornadas de 06:00 a 05:00 del día siguiente. El motor admite offsets hasta 47:00; la frontera visual puede ampliarse en `HOURS` de `lib/availability/date.js` si se necesitan otras jornadas. La jornada anterior sólo permite consultar sus turnos de madrugada que todavía sean futuros.

### Consultas y consumo

1. Consultar canchas activas por ciudad, tipo y `weeklyKeys array-contains weekday|time`.
2. Consultar excepciones por ciudad, fecha y tipo. Incorporar canchas con horarios extraordinarios y quitar ocupaciones o bloqueos.
3. Obtener los establecimientos coincidentes con una lectura por ID distinto en una operación agrupada.
4. Filtrar servicios sobre una misma cancha disponible y agrupar por establecimiento. Ordenar por precio y paginar en el servidor, 12 establecimientos por respuesta.

El cliente no descarga toda la colección de establecimientos. El servidor resuelve las coincidencias de una ciudad/fecha/tipo/horario para contar grupos y ordenar correctamente. Esta estrategia está orientada a los siete establecimientos iniciales; las nuevas ciudades quedan aisladas por las consultas y por la versión de caché. Si una ciudad crece mucho, evaluar una proyección agrupada para evitar materializar todas sus coincidencias antes de paginar.

La caché en memoria tiene como máximo 200 entradas, TTL de un minuto y deduplicación de solicitudes concurrentes. Cada consulta comprueba la versión vigente en Firestore, incluso cuando la caché está caliente. Al cargar una entrada se vuelve a leer la versión para detectar modificaciones simultáneas. Las instancias no dependen de una caché compartida externa. Los turnos pasados se vuelven a filtrar al responder.

Costos orientativos, sujetos a documentos devueltos, reintentos y consultas vacías:

- Búsqueda caliente: normalmente una lectura de versión, cero escrituras.
- Búsqueda fría: lectura de versión, consultas de candidatos y excepciones, establecimientos distintos y comprobación final de versión.
- Cambio de turno: dos escrituras en una transacción: excepción diaria y versión de ciudad. No recarga todos los datos del panel después de cada toque.
- Cambio de plantilla, recurrencia o precio: dos escrituras. No propaga datos a 30 fechas.
- Clic de contacto válido: como máximo una escritura de agregado, con deduplicación por visitante/establecimiento durante 15 minutos. En la demostración no escribe.

Para dar contexto: 10.000 búsquedas calientes y 1.000 frías de unas 20 lecturas consumirían aproximadamente 30.000 lecturas. No es una garantía de cuotas: también cuentan panel, consultas vacías, reintentos y accesos desde Firebase Console. Revisar la pestaña Usage de Firestore. La aplicación limita peticiones por proceso; en un VPS el proxy debe sobrescribir de forma confiable `X-Forwarded-For`. El límite local no es una cuota global entre réplicas.

## Seguridad, reglas e índices

`firestore.rules` impide escrituras desde SDKs cliente. Los propietarios escriben a través de `/api/owner`, con token y validación de pertenencia, tipos, precios, fechas y campos editables. El backend nunca acepta cambios de rol, asignaciones, modalidad comercial o propiedades administrativas del propietario.

Las configuraciones tienen versiones para rechazar cambios desde pantallas desactualizadas. Los turnos individuales se combinan mediante transacciones para no sobrescribir cambios en otros horarios. Sólo se informa guardado después de la confirmación de Firestore.

El Admin SDK no está sujeto a Security Rules: la autorización del backend es obligatoria. Las estadísticas y `cityState` no son accesibles directamente desde el cliente. El endpoint de contacto verifica nuevamente turno, cancha y establecimiento, valida origen, aplica límites y deduplica. Nunca cambia la disponibilidad.

`firestore.indexes.json` contiene los índices compuestos de las consultas anteriores, y excluye mapas o textos que no se consultan. No se configuraron ni ejecutaron emuladores, por indicación expresa del usuario. Las reglas no se han probado contra un motor de reglas de Firebase.

Solamente después de la revisión y autorización del usuario, con Firebase CLI instalada:

```sh
firebase deploy --only firestore:rules,firestore:indexes --project sinte-7dbec
```

## Datos de demostración

Los datos reutilizables están en `lib/data/demo.js`, separados de los componentes. La demostración local y el seed usan la misma fuente. Las fotografías se reutilizan entre ejemplos; las direcciones y mapas son ilustrativos. La modalidad integrada sólo se renderiza como demo en establecimientos `isDemo`.

```sh
npm run seed
```

Por defecto sólo muestra el plan y no se conecta a Firebase. La ejecución real requiere credenciales y autorización explícita:

```sh
npm run seed -- --apply --project=sinte-7dbec --demo-data-authorized
```

El seed usa IDs `demo-*`, crea documentos faltantes mediante transacción y no actualiza los existentes. Se aborta si encuentra un establecimiento real con uno de esos IDs. No ejecutar el comando de aplicación en producción sin autorización.

## Incorporar establecimientos y fotografías

1. Crear o elegir una ciudad activa en `cities`.
2. Crear el documento público en `establishments`, con `active`, `cityId`, `pricesByType`, `bookingMode: "whatsapp"` e `isDemo: false`. No incluir datos personales privados.
3. Crear cada cancha en `courts`, con `establishmentId`, `cityId`, `type`, `active`, `slotDuration: 60`, `weeklySchedule`, `weeklyKeys`, `recurringBlocks: []` y `configVersion: 0`.
4. Copiar fotografías optimizadas a `public/images/establishments/<slug>/`. Usar AVIF o WebP y procurar menos de 200 KB por imagen. Actualizar el array `images` con las rutas y su orden.
5. Configurar `googleMapsEmbedUrl` como URL HTTPS de `www.google.com/maps/embed...` o `maps.google.com/maps/embed...`. No guardar HTML.
6. Incrementar `cityState/<cityId>.version` en la misma operación administrativa que modifique horarios, precios, estado o datos públicos consultables. Las escrituras manuales en Console no ejecutan automáticamente lógica de la aplicación.
7. Incorporar las nuevas fotografías al repositorio y desplegar. Después pueden cambiarse las rutas y el orden desde Firestore sin modificar componentes.

No hay subida de imágenes ni escritura a `public` en runtime. `npm run assets` es una herramienta manual de preparación a partir de las exportaciones originales de Figma; volver a ejecutarla regenera los recursos de ejemplo. Las fuentes se sirven localmente y pueden obtenerse con `node scripts/fetch-fonts.mjs`.

## Propietarios

Se pueden crear cuentas desde Firebase Console y asignar un documento `users/<uid>` con:

```json
{"uid":"UID_DE_AUTH","email":"propietario@ejemplo.com","name":"Nombre","role":"owner","active":true,"establishmentIds":["ID_DEL_ESTABLECIMIENTO"]}
```

También existe un script administrativo. Primero revisar su simulación:

```sh
npm run owner -- --email=propietario@ejemplo.com --name=Nombre --establishments=id1,id2
```

Agregar `--apply --project=sinte-7dbec` solamente con autorización. Crea o reutiliza la cuenta, valida los establecimientos y establece la asignación completa. Una cuenta nueva puede establecer su contraseña mediante el flujo de recuperación por email. No se imprimen contraseñas ni claves de recuperación.

## Despliegue

Vercel: proyecto Next.js estándar, comando `npm run build`, variables del entorno y dominio autorizado en Firebase Authentication. `SINTE_DEMO_MODE=false` para datos reales y `SINTE_SHOW_DEMO_ESTABLISHMENTS=false` para ocultar ejemplos.

VPS: instalar Node, ejecutar `npm ci` y `npm run build`, configurar las variables privadas y ejecutar `npm start` detrás de un proxy HTTPS. Mantener el proceso con el supervisor del servidor. También se genera `.next/standalone`; para ese formato copiar `public` y `.next/static` junto al servidor standalone según la documentación de Next.js. No hay dependencia de cron, almacenamiento de disco en runtime ni servicios exclusivos de Vercel.

No habilitar reserva integrada para establecimientos reales. El botón de pago es visual, con `aria-disabled`; no tiene handler, SDK, checkout, reservas, transacciones ni cambios de disponibilidad.

## Verificación

```sh
npm test
npm run build
```

Con el servidor local ejecutándose y `SINTE_DEMO_MODE=true`:

```sh
node scripts/smoke.mjs
```

Las pruebas HTTP abortan si no detectan la demostración; no envían mensajes de WhatsApp ni escriben datos en Firebase. Las pruebas unitarias cubren recurrencias, excepciones, madrugada, agrupación, filtros, mensajes, URL permitidas, caché, permisos ajenos y conflictos de configuración. Quedan pendientes las pruebas de persistencia, recuperación de contraseña, aislamiento entre cuentas reales, reglas, índices y responsive visual en navegador.

Los generadores `npm run component -- NombreComponente` y `npm run section -- NombreSeccion carpeta` se conservaron del proyecto de referencia.
