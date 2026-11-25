export const FALLBACK_IMAGE = '/images/placeholders/court.avif';
export function localImage(path) {
    return typeof path === 'string' && /^\/images\/[a-zA-Z0-9_./-]+\.(avif|webp|png|jpe?g|svg)$/.test(path) && !path.includes('..') ? path : FALLBACK_IMAGE;
}
export function mapsUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && ['www.google.com', 'maps.google.com'].includes(url.hostname) && !url.username && !url.password && !url.port && url.pathname.startsWith('/maps/embed') ? url.href : null; } catch { return null; }
}
export function ars(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); }
