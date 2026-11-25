import 'server-only';
import { createHash } from 'node:crypto';
import { adminServices } from '../firebase/admin.js';
import { AppError } from '../validations/index.js';
const windows = new Map();
export function limitRequest(request, namespace = 'public', max = 60) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const key = `${namespace}:${createHash('sha256').update(ip).digest('hex').slice(0, 20)}`;
    const now = Date.now();
    if (windows.size > 5000) for (const [id, value] of windows) if (value.until < now) windows.delete(id);
    const state = windows.get(key);
    if (!state || state.until < now) { windows.set(key, { count: 1, until: now + 60000 }); return; }
    if (++state.count > max) throw new AppError('Demasiadas consultas. Esperá un minuto para volver a intentar.', 429);
}
export async function readBody(request) {
    if (Number(request.headers.get('content-length') || 0) > 20000) throw new AppError('La solicitud es demasiado grande.', 413);
    const raw = await request.text();
    if (raw.length > 20000) throw new AppError('La solicitud es demasiado grande.', 413);
    try { return JSON.parse(raw); } catch { throw new AppError('Solicitud inválida.'); }
}
export function assertOrigin(request) {
    const origin = request.headers.get('origin');
    const expected = new Set([new URL(request.url).origin,new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin]);
    if (!origin || !expected.has(origin)) throw new AppError('Origen de solicitud no autorizado.', 403);
}
export async function ownerIdentity(request) {
    const token = request.headers.get('authorization');
    if (!token?.startsWith('Bearer ')) throw new AppError('Iniciá sesión para continuar.', 401);
    const { auth, db } = adminServices();
    let identity;
    try { identity = await auth.verifyIdToken(token.slice(7), true); } catch { throw new AppError('Tu sesión venció. Volvé a iniciar sesión.', 401); }
    const user = (await db.collection('users').doc(identity.uid).get()).data();
    if (!user?.active || user.role !== 'owner' || !Array.isArray(user.establishmentIds) || !user.establishmentIds.length) throw new AppError('Tu cuenta no tiene establecimientos asignados.', 403);
    return { uid: identity.uid, user, db };
}
export function json(data, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function failure(error) {
    const status = error.status || 500;
    if (status >= 500) console.error('[Sinte]', error.code || error.message);
    return json({ error: status === 500 ? 'No pudimos consultar los datos. Intentá nuevamente.' : error.message }, status);
}
