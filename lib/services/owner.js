import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { AppError,identifier,dateInRange,slots,weeklySchedule,recurringBlocks,prices } from '../validations/index.js';
import { availabilityFor,weeklyKeys,scheduleSlots } from '../availability/engine.js';
import { isSlot,isFuture } from '../availability/date.js';
export async function ownerData(identity,date){
    const ids=identity.user.establishmentIds;
    const establishments=(await identity.db.getAll(...ids.map(id=>identity.db.collection('establishments').doc(id)))).filter(doc=>doc.exists&&doc.data().active).map(doc=>({...doc.data(),id:doc.id}));
    const groups=await Promise.all(establishments.map(async establishment=>{
        const [courts,overrides]=await Promise.all([identity.db.collection('courts').where('establishmentId','==',establishment.id).where('active','==',true).get(),identity.db.collection('availability').where('establishmentId','==',establishment.id).where('date','==',date).get()]);
        return courts.docs.map(doc=>{const court={...doc.data(),id:doc.id};const day=overrides.docs.find(v=>v.data().courtId===doc.id)?.data()||{};return {...court,day,slots:availabilityFor(court,date,day)};});
    }));
    return JSON.parse(JSON.stringify({establishments,courts:groups.flat(),name:identity.user.name||'Propietario'}));
}
export async function ownerMutation(identity,body){
    const {db,uid}=identity;
    const allowed=['slot','block','schedule','recurring','dateSchedule','prices'];
    if(!allowed.includes(body.action))throw new AppError('Acción inválida.');
    const courtId=body.action==='prices'?null:identifier(body.courtId);
    const establishmentId=body.action==='prices'?identifier(body.establishmentId):null;
    const day=['slot','block','dateSchedule'].includes(body.action)?dateInRange(body.date):null;
    return db.runTransaction(async tx=>{
        // Revalidar permisos dentro de la transacción evita usar una asignación revocada.
        const userDoc=await tx.get(db.collection('users').doc(uid));
        const user=userDoc.data();
        if(!user?.active||user.role!=='owner')throw new AppError('No tenés permisos para realizar este cambio.',403);
        const courtRef=courtId?db.collection('courts').doc(courtId):null;
        const courtDoc=courtRef?await tx.get(courtRef):null;
        const court=courtDoc?.data();
        if(courtRef&&(!courtDoc.exists||!court.active))throw new AppError('Cancha no disponible.',404);
        const estRef=db.collection('establishments').doc(establishmentId||court.establishmentId);
        const estDoc=await tx.get(estRef);
        const establishment=estDoc.data();
        if(!estDoc.exists||!establishment.active||!user.establishmentIds?.includes(estDoc.id))throw new AppError('No podés modificar este establecimiento.',403);
        const stateRef=db.collection('cityState').doc(establishment.cityId);
        const overrideRef=day?db.collection('availability').doc(`${courtId}_${day}`):null;
        const overrideDoc=overrideRef?await tx.get(overrideRef):null;
        const previous=overrideDoc?.data()||{};
        const timestamp=FieldValue.serverTimestamp();
        if(['schedule','recurring'].includes(body.action)&&body.expectedVersion!==(court.configVersion||0))throw new AppError('La configuración cambió en otra sesión. Recargá antes de volver a guardar.',409);
        if(body.action==='prices'&&body.expectedVersion!==(establishment.pricesVersion||0))throw new AppError('Los precios cambiaron en otra sesión. Recargá antes de volver a guardar.',409);
        if(body.action==='dateSchedule'&&body.expectedDayVersion!==(previous.version||0))throw new AppError('La jornada cambió en otra sesión. Recargá antes de modificar sus horarios.',409);
        if(body.action==='prices'){
            const value=prices(body.prices,Object.keys(establishment.pricesByType||{}));
            tx.update(estRef,{pricesByType:{...establishment.pricesByType,...value},pricesVersion:(establishment.pricesVersion||0)+1,updatedAt:timestamp});
        }else if(body.action==='schedule'){
            const value=weeklySchedule(body.weeklySchedule);
            tx.update(courtRef,{weeklySchedule:value,weeklyKeys:weeklyKeys(value),configVersion:(court.configVersion||0)+1,updatedAt:timestamp});
        }else if(body.action==='recurring'){
            tx.update(courtRef,{recurringBlocks:recurringBlocks(body.recurringBlocks),configVersion:(court.configVersion||0)+1,updatedAt:timestamp});
        }else{
            const next={...previous,courtId,establishmentId:estDoc.id,cityId:establishment.cityId,courtType:court.type,date:day,version:(previous.version||0)+1,updatedAt:timestamp};
            if(body.action==='slot'){
                if(!isSlot(body.time)||!isFuture(day,body.time)||typeof body.available!=='boolean'||!scheduleSlots(court,day,previous).includes(body.time))throw new AppError('El turno seleccionado no puede modificarse.');
                if(previous.blocked)throw new AppError('Desbloqueá el día antes de modificar un turno.');
                next.slots={...previous.slots,[body.time]:body.available?'available':'occupied'};
            }
            if(body.action==='block'){
                if(typeof body.blocked!=='boolean')throw new AppError('Estado de bloqueo inválido.');
                next.blocked=body.blocked;
            }
            if(body.action==='dateSchedule'){
                if(body.scheduleSlots===null)delete next.scheduleSlots;
                else next.scheduleSlots=slots(body.scheduleSlots);
            }
            tx.set(overrideRef,next);
            tx.set(stateRef,{version:FieldValue.increment(1),updatedAt:timestamp},{merge:true});
            return {saved:true,availability:{courtId,day:{...previous,...next,updatedAt:undefined},slots:availabilityFor(court,day,next)}};
        }
        tx.set(stateRef,{version:FieldValue.increment(1),updatedAt:timestamp},{merge:true});
        return {saved:true};
    });
}
