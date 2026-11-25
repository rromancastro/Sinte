'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Navbar,Calendar,Icon,ErrorNotice,Skeletons} from '@/app/components';
import {useOwnerAuth} from '../OwnerAuth/OwnerAuth';
import {useResource} from '@/lib/hooks/useResource';
import {localDate,addDays,slotLabel} from '@/lib/availability/date';
import {ScheduleEditor,PricesEditor} from './OwnerSettings';
import './ownerView.scss';
export const OwnerView=({section})=>{
    const router=useRouter();const auth=useOwnerAuth();
    const [date,setDate]=useState(localDate());const [courtId,setCourtId]=useState('');const [establishmentId,setEstablishmentId]=useState('');
    const [saving,setSaving]=useState(false);const [status,setStatus]=useState('');const [saveError,setSaveError]=useState('');
    const resource=useResource(auth.user?`/api/owner?date=${date}`:null,auth.request);
    useEffect(()=>{if(!auth.loading&&!auth.user)router.replace('/propietario/login');},[auth.loading,auth.user,router]);
    const establishment=resource.data?.establishments.find(v=>v.id===establishmentId)||resource.data?.establishments[0];
    const courts=resource.data?.courts.filter(v=>v.establishmentId===establishment?.id)||[];
    const court=courts.find(v=>v.id===courtId)||courts[0];
    async function mutate(body){
        if(saving)return;setSaving(true);setStatus('Guardando…');setSaveError('');
        try{const result=await auth.request('/api/owner',undefined,body);if(result.availability){resource.setData(data=>({...data,courts:data.courts.map(item=>item.id===result.availability.courtId?{...item,...result.availability}:item)}));}else resource.reload();setStatus('Cambios guardados automáticamente.');return true;}catch(error){setStatus('');setSaveError(`${error.message} Los cambios no se guardaron.`);return false;}finally{setSaving(false);}
    }
    return <main className='pageShell ownerView'><Navbar owner back='/'/>
        {auth.loading||!auth.user||resource.loading?<Skeletons count={2}/>:resource.error?<><ErrorNotice message={resource.error} onRetry={resource.reload}/><button className='textButton' onClick={auth.logout}>Cerrar sesión</button></>:!establishment?<ErrorNotice message='Tu cuenta no tiene establecimientos activos asignados.'/>:<>
            <section className='ownerPanel panel' aria-busy={saving}>
                <h1>{establishment.name}</h1>
                {resource.data.establishments.length>1&&<label className='formLabel'>Establecimiento<select className='field' value={establishment.id} onChange={event=>{setEstablishmentId(event.target.value);setCourtId('');setSaveError('');setStatus('');}}>{resource.data.establishments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
                {section!=='prices'&&<label className='ownerCourtSelect'><Icon name='ball'/><select aria-label='Cancha' value={court?.id||''} disabled={saving} onChange={event=>{setCourtId(event.target.value);setStatus('');setSaveError('');}}>{courts.map(item=><option value={item.id} key={item.id}>{item.name} · Fútbol {item.type}</option>)}</select><Icon name='chevron'/></label>}
                {section==='availability'&&<>
                    <Calendar value={date} min={addDays(localDate(),-1)} onChange={value=>{if(!saving){setDate(value);setStatus('');setSaveError('');}}}/>
                    <div className='slotLegend'><span><i/>Disponible</span><span><i/>Ocupado</span></div><p className='ownerHint'>Tocá un turno para cambiar su estado.</p>
                    <div className='ownerSlots'>{court?.slots.length?court.slots.map(slot=><button type='button' key={slot.time} className={slot.available?'available':'occupied'} disabled={saving||court.day.blocked} aria-label={`${slotLabel(slot.time,true)}: ${slot.available?'disponible, marcar ocupado':'ocupado, marcar disponible'}`} aria-pressed={!slot.available} onClick={()=>mutate({action:'slot',courtId:court.id,date,time:slot.time,available:!slot.available})}><strong>{slotLabel(slot.time)}</strong><small>{slot.available?'Disponible':'Ocupado'}{Number(slot.time.slice(0,2))>=24?' · +1 día':''}</small></button>):<p className='muted small'>No hay turnos futuros para esta jornada. Podés configurarlos en Horarios.</p>}</div>
                    <div className='saveStatus' role='status'><span className={status&&!saving?'lime':''}>{status?(saving?'◌':'✓'):''}</span>{status||'Los cambios se guardan automáticamente.'}</div>
                    <div className='ownerDayActions'><button className='button button-secondary button-small' type='button' disabled={saving||!court} onClick={()=>mutate({action:'block',courtId:court.id,date,blocked:!court.day.blocked})}>{court?.day.blocked?'Desbloquear día':'Bloquear día'}</button><Link className='button button-secondary button-small' href='/propietario/horarios'>Turno fijo</Link></div>
                </>}
                {section==='schedule'&&court&&<ScheduleEditor key={`${court.id}:${court.configVersion||0}`} court={court} date={date} onDateChange={setDate} saving={saving} mutate={mutate}/>}
                {section==='prices'&&<PricesEditor key={`${establishment.id}:${establishment.pricesVersion||0}`} establishment={establishment} saving={saving} mutate={mutate}/>}
                {section!=='availability'&&status&&<p className='statusText' role='status'>{status}</p>}{saveError&&<p className='errorText' role='alert'>{saveError}</p>}
            </section>
            <nav className='ownerNavigation' aria-label='Configuración del establecimiento'>{[['/propietario','Disponibilidad','availability'],['/propietario/horarios','Horarios','schedule'],['/propietario/precios','Precios','prices']].map(([href,label,key])=><Link key={key} href={href} aria-current={section===key?'page':undefined}>{label}</Link>)}</nav>
            <button className='textButton logoutButton' onClick={async()=>{await auth.logout();router.replace('/propietario/login');}}>Cerrar sesión</button>
        </>}
    </main>;
};
