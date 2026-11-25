import {DetailView} from '../DetailView/DetailView';
import {cache} from 'react';
import {detailData} from '@/lib/services/public';
import {identifier,dateInRange} from '@/lib/validations';
import {localDate,isFuture} from '@/lib/availability/date';
const load=cache(async(id,date)=>{try{return await detailData(identifier(id),dateInRange(date));}catch{return null;}});
export async function generateMetadata({params,searchParams}){const {id}=await params;const p=await searchParams;const data=await load(id,p.date||localDate());return {title:data?.establishment.name||'Detalle de cancha',description:data?.establishment.description||'Consultá precios, servicios y horarios disponibles.',...(data?.establishment.isDemo?{robots:{index:false,follow:false}}:{})};}
export default async function CourtPage({params,searchParams}){const {id}=await params;const criteria=await searchParams;const data=await load(id,criteria.date||localDate());const initialData=data?{...data,courts:data.courts.map(court=>({...court,slots:court.slots.filter(slot=>isFuture(criteria.date||localDate(),slot.time))}))}:null;return <DetailView id={id} criteria={criteria} initialData={initialData}/>;}
