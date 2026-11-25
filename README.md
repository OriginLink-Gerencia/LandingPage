# OriginLink

Landing del piloto para tostadoras de Lima. Usa Astro, TypeScript y CSS. Las fotografías de Figma, los SVG de la marca y las fuentes se sirven desde el propio proyecto.

## Desarrollo

Con Node.js 24 y npm, ejecuta en esta carpeta:

~~~sh
npm ci
npm run dev
~~~

Abre la dirección local que muestra la terminal. Para probar el resultado de producción, ejecuta `npm run build` y después `npm run preview`.

## Solicitudes del piloto

En desarrollo y en la vista previa, el formulario registra cada solicitud en un archivo JSON dentro de `.pilot-data/`. La carpeta es privada, está excluida de Git y queda fuera de la compilación. Puedes elegir otra ubicación mediante `ORIGINLINK_PILOT_DIR`. El registro local no envía correos.

Para publicar `dist/` en un alojamiento estático, configura `PUBLIC_PILOT_ENDPOINT` antes de compilar. El servicio debe aceptar un POST con `application/x-www-form-urlencoded` y los campos `contacto`, `tostadora` y `correo`. Tras guardar la solicitud debe responder con HTTP 201 y `{"ok":true}`. Si el servicio vive en otro dominio, permite el origen de la landing mediante CORS.
