import { weeklyKeys } from '../availability/engine.js';
export const demoCity = { id:'san-luis', name:'San Luis', province:'San Luis', slug:'san-luis', active:true, timeZone:'America/Argentina/San_Luis' };
export const publicSettings = { whatsapp:'5492665036482' };
const map='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1402.3191775475518!2d-66.31549783121483!3d-33.28492132623825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95d43ebc01880e2d%3A0x85d8f90bf73cccff!2sLos%20Olivos%20Futbol!5e0!3m2!1ses-419!2sar!4v1795626822345!5m2!1ses-419!2sar';
const definitions=[
    ['la-estacion','La Estación',18000,['roof','bulb','hanger'],'whatsapp',['5','5','7']],
    ['potrero-norte','Potrero Norte',16000,['bulb','car'],'whatsapp',['5','7']],
    ['club-5','Club 5',20000,['roof','bulb'],'integrated',['5']],
    ['el-galpon','El Galpón',22000,['roof','car'],'whatsapp',['5','7']],
    ['la-redonda','La Redonda',17000,['bulb','hanger'],'whatsapp',['5','11']],
    ['punto-gol','Punto Gol',19000,['car','bulb'],'whatsapp',['7','11']],
    ['tercer-tiempo','Tercer Tiempo',21000,['roof','hanger','car'],'whatsapp',['5']]
];
export const demoEstablishments=definitions.map(([slug,name,price,amenities,bookingMode],index)=>({
    id:`demo-${slug}`,slug,name,cityId:'san-luis',cityName:'San Luis',address:`Dirección de ejemplo ${100+index*120}, San Luis`,
    description:'Un espacio para compartir el fútbol con amigos. Canchas de césped sintético e iluminación para jugar de día y de noche. Este establecimiento es ficticio y sus datos se usan únicamente para demostrar Sinte.',
    whatsapp:publicSettings.whatsapp,images:[`/images/establishments/${slug}/main.avif`,...(index===0?['/images/establishments/la-estacion/cancha-1.avif']:[])],amenities,
    googleMapsEmbedUrl:map,featured:index<3,active:true,bookingMode,pricesByType:{'5':price,'7':price+7000,'11':price+20000},isDemo:true
}));
export const demoCourts=definitions.flatMap(([slug,,,amenities,,types],index)=>types.map((type,courtIndex)=>{
    const weeklySchedule=Object.fromEntries(Array.from({length:7},(_,day)=>[day,day===0&&index===2?[]:Array.from({length:day===6?11:8},(_,i)=>`${String(i+(day===6?15:18)).padStart(2,'0')}:00`)]));
    return {id:`demo-${slug}-${courtIndex+1}`,establishmentId:`demo-${slug}`,cityId:'san-luis',name:`Cancha ${courtIndex+1}`,type,active:true,amenities,
        weeklySchedule,weeklyKeys:weeklyKeys(weeklySchedule),slotDuration:60,isDemo:true,recurringBlocks:index===0&&courtIndex===0?[{id:'demo-fijo',weekday:2,time:'21:00',active:true,startDate:'2026-01-01',endDate:null}]:[]};
}));
