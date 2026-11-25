import { dateLabel, slotInstant, localDate, slotLabel } from '../availability/date.js';
import { ars } from './media.js';
export function whatsappLink(number, message) {
    const phone = String(number || '').replace(/[+\s()-]/g, '');
    if (!/^\d{10,15}$/.test(phone)) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
export function contactMessage(establishment, court, date, time) {
    const realDate = localDate(slotInstant(date, time));
    return `¡Hola! Encontré ${establishment.name} en Sinte y quisiera consultar por ${court.name}, de fútbol ${court.type}, para el ${dateLabel(realDate, { weekday: 'long', month: 'long' })} a las ${slotLabel(time)}. El precio publicado es ${ars(establishment.pricesByType[court.type])} por hora. ¿Podrían confirmarme la disponibilidad?`;
}
