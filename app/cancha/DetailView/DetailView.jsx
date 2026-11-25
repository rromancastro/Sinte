'use client';
import {useEffect,useState} from 'react';
import {Navbar,Photo,Icon,Calendar,AMENITIES,ErrorNotice,Skeletons,DemoNotice} from '@/app/components';
import {useResource} from '@/lib/hooks/useResource';
import {localDate,addDays,isDate,slotLabel,dateLabel} from '@/lib/availability/date';
import {mapsUrl,ars} from '@/lib/utils/media';
import {track} from '@/lib/firebase/client';
import './detailView.scss';
export const DetailView=({id,criteria,initialData})=>{
    const [date,setDate]=useState(isDate(criteria.date)?criteria.date:localDate());
    const [courtId,setCourtId]=useState(criteria.court||'');
    const [time,setTime]=useState(criteria.time||'');
    const [photo,setPhoto]=useState(0);
    const [contacting,setContacting]=useState(false);
    const [contactError,setContactError]=useState('');
    const resource=useResource(`/api/public?resource=detail&id=${encodeURIComponent(id)}&date=${date}`,undefined,initialData);
    const data=resource.data;
    const establishment=data?.establishment;
    const court=data?.courts.find(v=>v.id===courtId)||data?.courts.find(v=>v.type===criteria.type)||data?.courts[0];
    const integrated=establishment?.isDemo&&(court?.bookingMode||establishment?.bookingMode)==='integrated';
    const available=court?.slots.filter(v=>v.available)||[];
    useEffect(()=>{if(data&&time&&!available.some(v=>v.time===time)){setTime('');setContactError('Ese horario ya no está disponible. Elegí otro turno.');}},[data,court?.id,time]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(()=>{const refresh=()=>resource.reload();window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[resource.reload]);
    useEffect(()=>{track('view_item',{item_id:id});},[id]);
    const back=criteria.city?`/buscar?${new URLSearchParams(criteria)}`:'/';
    async function contact(){
        if(!court||!time){setContactError('Seleccioná una fecha y un horario disponible.');return;}
        setContactError('');setContacting(true);
        const popup=window.open('about:blank','_blank');
        if(popup)popup.opener=null;
        try{
            const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({establishmentId:id,courtId:court.id,date,time})});
            const result=await response.json();if(!response.ok)throw new Error(result.error);
            track('whatsapp_contact',{establishment_id:id,court_id:court.id});
            if(popup)popup.location.replace(result.url);else window.location.assign(result.url);
        }catch(error){popup?.close();setContactError(error.message);resource.reload();}finally{setContacting(false);}
    }
    return <main className='pageShell detailView'><Navbar back={back}/>{data?.demo&&<DemoNotice/>}
        {resource.loading?<Skeletons count={3}/>:resource.error?<ErrorNotice message={resource.error} onRetry={resource.reload}/>:<>
            <div className='detailLayout'><div className='detailVisual'>
                <section className='gallery' aria-label={`Fotografías de ${establishment.name}`}>
                    <Photo key={establishment.images?.[photo]} src={establishment.images?.[photo]} alt={`${establishment.name}, fotografía ${photo+1}`} sizes='(max-width: 767px) 100vw, 650px' priority/>
                    {establishment.images?.length>1&&<><button className='galleryPrevious' aria-label='Foto anterior' onClick={()=>setPhoto((photo-1+establishment.images.length)%establishment.images.length)}>‹</button><button className='galleryNext' aria-label='Foto siguiente' onClick={()=>setPhoto((photo+1)%establishment.images.length)}>›</button><div className='galleryDots'>{establishment.images.map((_,i)=><button key={i} className={i===photo?'active':''} aria-label={`Ver fotografía ${i+1}`} aria-pressed={i===photo} onClick={()=>setPhoto(i)}/>)}</div></>}
                </section>
                <section className='establishmentInfo panel'><h1>{establishment.name}</h1><p className='detailCity'><Icon name='pin'/>{establishment.cityName||'San Luis'}</p><p className='detailPrice'>{ars(establishment.pricesByType?.[court?.type]||0)} <small>por hora</small></p><p className='small'>{court?`${court.name} · Fútbol ${court.type}`:'No hay canchas habilitadas'}</p>
                    {!integrated&&<button type='button' className='button button-primary contactButton' disabled={!time||contacting||!court} onClick={contact}><Icon name='whatsapp'/>{contacting?'Consultando…':'Consultar por WhatsApp'}</button>}
                    {!integrated&&<small className='confirmationNote'>La reserva se confirma directamente con el establecimiento.</small>}
                </section>
                <section className='descriptionSection'><h2>Descripción</h2><p>{establishment.description}</p></section>
            </div><div className='detailActions'>
                {court&&<section className={`availabilitySection ${integrated?'panel integratedPanel':''}`}><h2>{integrated?'Reservar cancha':'Horarios disponibles'}</h2><p className='muted small'>{integrated?'Elegí día y horario para ver la demostración.':'Elegí un horario para consultar la reserva.'}</p>
                    {data.courts.length>1&&<label className='formLabel'>Cancha<select className='field' value={court.id} onChange={event=>{setCourtId(event.target.value);setTime('');setContactError('');}}>{data.courts.map(item=><option key={item.id} value={item.id}>{item.name} · Fútbol {item.type}</option>)}</select></label>}
                    <label className='formLabel'><span>Jornada</span><Calendar value={date} min={addDays(localDate(),-1)} onChange={value=>{setDate(value);setTime('');setContactError('');}}/></label>
                    <div className='slotOptions' role='group' aria-label='Horarios disponibles'>{available.length?available.map(slot=><button type='button' className={`slotOption ${time===slot.time?'selected':''}`} key={slot.time} aria-pressed={time===slot.time} onClick={()=>{setTime(slot.time);setContactError('');}}>{slotLabel(slot.time)}{Number(slot.time.slice(0,2))>=24&&<small>día siguiente</small>}</button>):<p className='muted small'>No quedan horarios disponibles para esta fecha. Probá con otra jornada.</p>}</div>
                    {time&&<p className='selectionNote'>{dateLabel(date)} · {slotLabel(time,true)}</p>}
                    {integrated&&<><button type='button' className='paymentDemo' aria-disabled='true' aria-describedby='payment-note'><img src='/images/brand/payment-demo.svg' width='304' height='44' alt='Reservar y pagar · Mercado Pago'/></button><p id='payment-note' className='small muted'>Demostración: la reserva y el pago todavía no están habilitados.</p></>}
                </section>}
                {contactError&&<p className='errorText' role='alert'>{contactError}</p>}
                <section className='servicesSection'><h2>Servicios</h2><div className='serviceTiles'>{[...new Set([...(establishment.amenities||[]),...(court?.amenities||[])])].filter(key=>AMENITIES[key]).map(key=><div key={key} className='panel'><Icon name={key}/><span>{AMENITIES[key]}</span></div>)}</div></section>
                <section className='mapSection panel'><h2><Icon name='pin'/>{establishment.cityName||'Ubicación'}</h2><p>{establishment.address}</p>{mapsUrl(establishment.googleMapsEmbedUrl)?<iframe title={`Ubicación de ${establishment.name}`} src={mapsUrl(establishment.googleMapsEmbedUrl)} loading='lazy' allowFullScreen referrerPolicy='strict-origin-when-cross-origin'/>:<p className='muted small'>El establecimiento todavía no publicó su ubicación en el mapa.</p>}{establishment.isDemo&&<small className='muted'>Ubicación ilustrativa de la demostración.</small>}</section>
            </div></div>
        </>}
    </main>;
};
