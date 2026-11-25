import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const storage = process.env.ORIGINLINK_PILOT_DIR || fileURLToPath(new URL('../.pilot-data/', import.meta.url));

async function acceptPilot(req, res, next) {
  if (req.url?.split('?')[0] !== '/api/piloto') return next();
  const reply = (status, message) => {
    res.statusCode = status;
    res.setHeader('Cache-Control', 'no-store');
    if (req.headers.accept?.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: status === 201, message }));
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OriginLink · Solicitud</title><main><h1>' + message + '</h1><p><a href="/#piloto">Volver a OriginLink</a></p></main></html>');
    }
  };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, 'Usa el formulario para registrar tu solicitud.'); }
  if (!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) return reply(415, 'Formato no admitido.');
  try {
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return reply(403, 'Origen de solicitud no permitido.');
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 8192) return reply(413, 'Solicitud demasiado extensa.');
      chunks.push(chunk);
    }
    const values = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
    const field = key => (values.get(key) || '').trim();
    const contacto = field('contacto'), tostadora = field('tostadora'), correo = field('correo');
    if (!contacto || contacto.length > 100 || !tostadora || tostadora.length > 150 || correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return reply(422, 'Revisa el nombre, la tostadora y el correo.');
    await mkdir(storage, { recursive: true });
    await writeFile(join(storage, randomUUID() + '.json'), JSON.stringify({ contacto, tostadora, correo, fecha: new Date().toISOString() }), { flag: 'wx' });
    reply(201, 'Solicitud registrada. Gracias por tu interés en el piloto.');
  } catch {
    reply(500, 'No se pudo registrar la solicitud.');
  }
}

export default {
  name: 'originlink-pilot',
  configureServer(server) { server.middlewares.use(acceptPilot); },
  configurePreviewServer(server) { server.middlewares.use(acceptPilot); }
};
