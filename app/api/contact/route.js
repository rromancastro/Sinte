import {createHmac} from 'node:crypto';
import {FieldValue} from 'firebase-admin/firestore';
import {json,failure,limitRequest,assertOrigin,readBody} from '@/lib/services/http';
import {detailData,demoMode} from '@/lib/services/public';
import {identifier,dateInRange,AppError} from '@/lib/validations';
import {isSlot,isFuture,localDate} from '@/lib/availability/date';
import {whatsappLink,contactMessage} from '@/lib/utils/whatsapp';
import {adminServices} from '@/lib/firebase/admin';
export const runtime='nodejs';
export async function POST(request){try{
    assertOrigin(request);limitRequest(request,'contact',6);
    const body=await readBody(request);const id=identifier(body.establishmentId);const courtId=identifier(body.courtId);const date=dateInRange(body.date);
    if(!isSlot(body.time)||!isFuture(date,body.time))throw new AppError('Elegí un horario que todavía no haya pasado.');
    const data=await detailData(id,date);const court=data.courts.find(v=>v.id===courtId);
    if(!court||!court.slots.some(v=>v.time===body.time&&v.available))throw new AppError('Ese turno ya no está disponible. Elegí otro horario.',409);
    if((court.bookingMode||data.establishment.bookingMode)==='integrated'&&data.establishment.isDemo)throw new AppError('Esta modalidad es solamente una demostración.');
    const url=whatsappLink(data.establishment.whatsapp,contactMessage(data.establishment,court,date,body.time));
    if(!url)throw new AppError('El establecimiento todavía no configuró su WhatsApp.');
    let tracked=false;
    if(!demoMode()&&process.env.SINTE_ANALYTICS_HASH_SECRET){
        // Un agregado por establecimiento/día. Sin IP, teléfonos ni datos de jugadores.
        // La deduplicación está en la misma transacción y funciona entre instancias.
        const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
        const day=localDate();const now=Date.now();
        const fingerprint=createHmac('sha256',process.env.SINTE_ANALYTICS_HASH_SECRET).update(`${day}|${ip}|${id}`).digest('hex').slice(0,24);
        const {db}=adminServices();const ref=db.collection('analytics').doc(`${id}_${day}`);
        try{tracked=await db.runTransaction(async tx=>{const doc=await tx.get(ref);const recent=Object.fromEntries(Object.entries(doc.data()?.recent||{}).filter(([,at])=>now-at<900000));if(recent[fingerprint]||Object.keys(recent).length>=500)return false;tx.set(ref,{establishmentId:id,date:day,whatsappClicks:(doc.data()?.whatsappClicks||0)+1,recent:{...recent,[fingerprint]:now},updatedAt:FieldValue.serverTimestamp()});return true;});}catch(error){console.error('[Sinte analytics]',error.code||'unavailable');}
    }
    return json({url,tracked});
}catch(error){return failure(error);}}
