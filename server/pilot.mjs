import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const storage = process.env.ORIGINLINK_PILOT_DIR || fileURLToPath(new URL('../.pilot-data/', import.meta.url));

const messages = {
  es: {
    title: 'OriginLink · Solicitud',
    back: 'Volver a OriginLink',
    invalid: 'Revisa el nombre, la tostadora y el correo.',
    success: 'Solicitud registrada. Gracias por tu interés en el piloto.',
    error: 'No se pudo registrar la solicitud.'
  },
  en: {
    title: 'OriginLink · Pilot request',
    back: 'Back to OriginLink',
    invalid: 'Check your name, roastery, and email address.',
    success: 'Request received. Thank you for your interest in the pilot.',
    error: 'We couldn’t save your request.'
  }
};

async function acceptPilot(req, res, next) {
  if (req.url?.split('?')[0] !== '/api/piloto') return next();
  let locale = 'es';
  const reply = (status, message) => {
    res.statusCode = status;
    res.setHeader('Cache-Control', 'no-store');
    if (req.headers.accept?.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: status === 201, message }));
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const { title, back } = messages[locale];
      const returnUrl = locale === 'en' ? '/en/#piloto' : '/#piloto';
      res.end(`<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><main><h1>${message}</h1><p><a href="${returnUrl}">${back}</a></p></main></html>`);
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
    locale = values.get('locale') === 'en' ? 'en' : 'es';
    const field = key => (values.get(key) || '').trim();
    const contacto = field('contacto'), tostadora = field('tostadora'), correo = field('correo');
    if (!contacto || contacto.length > 100 || !tostadora || tostadora.length > 150 || correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return reply(422, messages[locale].invalid);
    await mkdir(storage, { recursive: true });
    await writeFile(join(storage, randomUUID() + '.json'), JSON.stringify({ contacto, tostadora, correo, fecha: new Date().toISOString() }), { flag: 'wx' });
    reply(201, messages[locale].success);
  } catch {
    reply(500, messages[locale].error);
  }
}

export default {
  name: 'originlink-pilot',
  configureServer(server) { server.middlewares.use(acceptPilot); },
  configurePreviewServer(server) { server.middlewares.use(acceptPilot); }
};
