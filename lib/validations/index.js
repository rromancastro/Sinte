import { isDate, isSlot, addDays, localDate } from '../availability/date.js';
export class AppError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export function identifier(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new AppError('Identificador inválido.'); return value; }
export function dateInRange(value) {
    if (!isDate(value) || value < addDays(localDate(), -1) || value > addDays(localDate(), 29)) throw new AppError('La fecha está fuera del período habilitado.');
    return value;
}
export function slots(value) {
    if (!Array.isArray(value) || value.length > 48 || value.some(slot => !isSlot(slot))) throw new AppError('Los turnos deben empezar a las horas en punto.');
    return [...new Set(value)].sort();
}
export function weeklySchedule(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(day => !/^[0-6]$/.test(day))) throw new AppError('Configuración semanal inválida.');
    return Object.fromEntries(Array.from({length: 7}, (_, day) => [day, slots(value[day] || [])]));
}
export function recurringBlocks(value) {
    if (!Array.isArray(value) || value.length > 168) throw new AppError('Revisá los turnos fijos.');
    return value.map(block => {
        if (!Number.isInteger(block.weekday) || block.weekday < 0 || block.weekday > 6 || !isSlot(block.time) || !isDate(block.startDate) || (block.endDate && (!isDate(block.endDate) || block.endDate < block.startDate))) throw new AppError('Revisá el día, horario y período del turno fijo.');
        return { id: identifier(block.id), weekday: block.weekday, time: block.time, active: true, startDate: block.startDate, endDate: block.endDate || null };
    });
}
export function prices(value, allowedTypes) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0 || Object.keys(value).some(type => !allowedTypes.includes(type))) throw new AppError('Tipo de cancha inválido.');
    for (const price of Object.values(value)) if (!Number.isSafeInteger(price) || price <= 0 || price > 10000000) throw new AppError('Ingresá precios positivos en pesos argentinos, sin centavos.');
    return value;
}
