import 'server-only';
import { adminServices } from '../firebase/admin.js';
import { cached, versioned } from './cache.js';
import { demoCity, demoCourts, demoEstablishments, publicSettings } from '../data/demo.js';
import { groupResults, availabilityFor } from '../availability/engine.js';
import { weekday } from '../availability/date.js';
import { AppError } from '../validations/index.js';
export const demoMode=()=>process.env.SINTE_DEMO_MODE==='true';
const visible=item=>item?.active && (!item.isDemo || process.env.SINTE_SHOW_DEMO_ESTABLISHMENTS==='true');
const rows=snapshot=>snapshot.docs.map(doc=>({ ...doc.data(),id:doc.id }));
function plain(value){return JSON.parse(JSON.stringify(value));}
async function getEstablishments(db,ids){
    if(!ids.length)return [];
    const docs=await db.getAll(...[...new Set(ids)].map(id=>db.collection('establishments').doc(id)));
    return docs.filter(doc=>doc.exists).map(doc=>({...doc.data(),id:doc.id}));
}
export async function homeData(){
    if(demoMode())return {cities:[demoCity],featured:demoEstablishments.filter(v=>v.featured),settings:publicSettings,demo:true};
    const {db}=adminServices();
    const cities=await cached('cities',async()=>rows(await db.collection('cities').where('active','==',true).limit(50).get()),300000);
    const groups=await Promise.all(cities.slice(0,10).map(city=>versioned(db,city.id,'featured',async()=>rows(await db.collection('establishments').where('cityId','==',city.id).where('active','==',true).where('featured','==',true).limit(6).get()).filter(visible))));
    const settings=await cached('settings',async()=>(await db.collection('settings').doc('public').get()).data()||{},300000);
    return plain({cities,featured:groups.flat().slice(0,6),settings,demo:false});
}
export async function searchData(criteria){
    if(demoMode())return {results:criteria.city===demoCity.id?groupResults(demoCourts.filter(v=>v.type===criteria.type),demoEstablishments,criteria.date,criteria.time,[]):[],demo:true};
    const {db}=adminServices();
    const results=await versioned(db,criteria.city,`search:${criteria.date}:${criteria.type}:${criteria.time}`,async()=>{
        const city=await db.collection('cities').doc(criteria.city).get();
        if(!city.data()?.active)return [];
        const [base,exceptions]=await Promise.all([
            db.collection('courts').where('cityId','==',criteria.city).where('active','==',true).where('type','==',criteria.type).where('weeklyKeys','array-contains',`${weekday(criteria.date)}|${criteria.time}`).get(),
            db.collection('availability').where('cityId','==',criteria.city).where('date','==',criteria.date).where('courtType','==',criteria.type).get()
        ]);
        const overrides=rows(exceptions);
        const courts=rows(base);
        const extras=overrides.filter(v=>v.scheduleSlots?.includes(criteria.time)&&!courts.some(c=>c.id===v.courtId)).map(v=>v.courtId);
        if(extras.length){const docs=await db.getAll(...extras.map(id=>db.collection('courts').doc(id)));courts.push(...docs.filter(d=>d.exists).map(d=>({...d.data(),id:d.id})));}
        const availableCourts=courts.filter(court=>visible(court)&&court.cityId===criteria.city&&court.type===criteria.type);
        const establishments=(await getEstablishments(db,availableCourts.map(v=>v.establishmentId))).filter(visible);
        return groupResults(availableCourts,establishments,criteria.date,criteria.time,overrides);
    });
    return plain({results,demo:false});
}
export async function detailData(id,date){
    if(demoMode()){
        const establishment=demoEstablishments.find(v=>v.id===id||v.slug===id);
        if(!establishment)throw new AppError('No encontramos este establecimiento.',404);
        const courts=demoCourts.filter(v=>v.establishmentId===establishment.id);
        return {establishment,courts:courts.map(court=>({...court,slots:availabilityFor(court,date)})),demo:true};
    }
    const {db}=adminServices();
    const doc=await db.collection('establishments').doc(id).get();
    if(!doc.exists||!visible(doc.data()))throw new AppError('No encontramos este establecimiento.',404);
    const result=await versioned(db,doc.data().cityId,`detail:${id}:${date}`,async()=>{
        const establishmentDoc=await db.collection('establishments').doc(id).get();
        const establishment={...establishmentDoc.data(),id};
        if(!visible(establishment))throw new AppError('Este establecimiento no está disponible.',404);
        const [courtDocs,dayDocs]=await Promise.all([db.collection('courts').where('establishmentId','==',id).where('active','==',true).get(),db.collection('availability').where('establishmentId','==',id).where('date','==',date).get()]);
        const overrides=rows(dayDocs);
        return {establishment,courts:rows(courtDocs).filter(visible).map(court=>({...court,slots:availabilityFor(court,date,overrides.find(v=>v.courtId===court.id),new Date(0),true)}))};
    });
    return plain({...result,demo:false});
}
