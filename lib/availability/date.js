export const TIME_ZONE = 'America/Argentina/San_Luis';
export const SEARCH_DAYS = 30;
export const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

export function localDate(now = new Date()) {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    return `${p.find(v => v.type === 'year').value}-${p.find(v => v.type === 'month').value}-${p.find(v => v.type === 'day').value}`;
}
export function addDays(date, days) {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}
export function isDate(date) {
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}
export function isSlot(slot) { return typeof slot === 'string' && /^(0\d|1\d|2\d|3\d|4[0-7]):00$/.test(slot); }
export function slotLabel(slot, withDay = false) {
    const hour = Number(slot.split(':')[0]);
    return `${String(hour % 24).padStart(2, '0')}:00${withDay && hour >= 24 ? ' · día siguiente' : ''}`;
}
export function slotInstant(date, slot) {
    const hour = Number(slot.split(':')[0]);
    return new Date(`${addDays(date, Math.floor(hour / 24))}T${String(hour % 24).padStart(2, '0')}:00:00-03:00`);
}
export function isFuture(date, slot, now = new Date()) { return slotInstant(date, slot).getTime() > now.getTime(); }
export function weekday(date) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
export function dateLabel(date, options = {}) {
    if (!isDate(date)) return '';
    return new Intl.DateTimeFormat('es-AR', { timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short', ...options }).format(new Date(`${date}T12:00:00Z`));
}
export function validateSearch(values, now = new Date()) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(values.city || '')) throw new Error('Elegí una ciudad.');
    if (!['5', '7', '11'].includes(String(values.type))) throw new Error('Elegí el tipo de cancha.');
    if (!isDate(values.date) || values.date < addDays(localDate(now), -1) || values.date > addDays(localDate(now), SEARCH_DAYS - 1)) throw new Error('Elegí una jornada dentro de los próximos 30 días.');
    if (!isSlot(values.time) || !isFuture(values.date, values.time, now)) throw new Error('Elegí un horario que todavía no haya pasado.');
    return { city: values.city, type: String(values.type), date: values.date, time: values.time };
}
