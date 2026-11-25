import { weekday, isFuture } from './date.js';

export function weeklyKeys(schedule) {
    return Object.entries(schedule).flatMap(([day, slots]) => slots.map(slot => `${day}|${slot}`));
}
export function scheduleSlots(court, date, override) {
    return [...new Set(override?.scheduleSlots ?? court.weeklySchedule?.[weekday(date)] ?? [])].sort();
}
export function availabilityFor(court, date, override = {}, now = new Date(), includePast = false) {
    const all = scheduleSlots(court, date, override);
    return all.filter(slot => includePast || isFuture(date, slot, now)).map(slot => {
        const recurring = (court.recurringBlocks || []).some(block => block.active !== false && block.weekday === weekday(date) && block.time === slot && (!block.startDate || date >= block.startDate) && (!block.endDate || date <= block.endDate));
        const explicit = override.slots?.[slot];
        const occupied = override.blocked === true || (explicit !== undefined ? explicit === 'occupied' : recurring);
        return { time: slot, available: !occupied, recurring, blocked: override.blocked === true };
    });
}

export function groupResults(courts, establishments, date, time, overrides, now = new Date()) {
    const groups = new Map();
    for (const court of courts) {
        const establishment = establishments.find(item => item.id === court.establishmentId);
        if (!court.active || !establishment?.active) continue;
        if (!availabilityFor(court, date, overrides.find(item => item.courtId === court.id), now).some(slot => slot.time === time && slot.available)) continue;
        const price = establishment.pricesByType?.[court.type];
        if (!Number.isFinite(price) || price <= 0) continue;
        if (!groups.has(establishment.id)) groups.set(establishment.id, { ...establishment, price, type: court.type, matchingCourts: [] });
        groups.get(establishment.id).matchingCourts.push({ id: court.id, name: court.name, amenities: court.amenities || [], bookingMode: court.bookingMode || establishment.bookingMode });
    }
    return [...groups.values()];
}
export function filterResults(results, { amenities = [], order = 'asc' } = {}) {
    return results.map(result => ({ ...result, matchingCourts: result.matchingCourts.filter(court => amenities.every(amenity => [...(result.amenities || []), ...court.amenities].includes(amenity))) }))
        .filter(result => result.matchingCourts.length)
        .sort((a, b) => (order === 'desc' ? b.price - a.price : a.price - b.price) || a.name.localeCompare(b.name, 'es'));
}
