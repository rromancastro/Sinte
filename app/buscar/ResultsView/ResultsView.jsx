'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Navbar,SearchForm,CourtCard,ErrorNotice,Skeletons,DemoNotice,Icon,AMENITIES} from '@/app/components';
import {useResource} from '@/lib/hooks/useResource';
import {dateLabel,slotLabel} from '@/lib/availability/date';
import './resultsView.scss';
export const ResultsView=({criteria})=>{
    const router=useRouter();
    const [editing,setEditing]=useState(false);
    const [filtersOpen,setFiltersOpen]=useState(false);
    const params=new URLSearchParams(criteria);
    const meta=useResource('/api/public?resource=home');
    const resource=useResource(`/api/public?resource=search&${params}`);
    const selected=(criteria.amenities||'').split(',').filter(Boolean);
    function change(key,value){const next=new URLSearchParams(criteria);if(value)next.set(key,value);else next.delete(key);next.delete('page');router.replace(`/buscar?${next}`);}
    return <main className='pageShell resultsView'><Navbar/>{resource.data?.demo&&<DemoNotice/>}<div className='resultsLayout'><aside>
        <section className='searchSummary panel'><div>{[['pin',meta.data?.cities.find(v=>v.id===criteria.city)?.name||criteria.city||'Ciudad'],['calendar',criteria.date?dateLabel(criteria.date):'Día'],['clock',criteria.time?slotLabel(criteria.time,true):'Hora'],['ball',`Fútbol ${criteria.type||'5'}`]].map(([icon,label])=><span key={icon}><Icon name={icon}/><strong>{label}</strong></span>)}</div><button type='button' onClick={()=>setEditing(!editing)}><Icon name='edit'/>Editar búsqueda</button></section>
        {editing&&<SearchForm key={params.toString()} initial={criteria} cities={meta.data?.cities||[]} onCancel={()=>setEditing(false)}/>}
        <div className='resultsTools'><button type='button' className='button button-secondary button-small' aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(!filtersOpen)}><Icon name='filter'/>Filtros{selected.length?` (${selected.length})`:''}</button><label className='priceOrder'>Precio<select aria-label='Ordenar por precio' value={criteria.order||'asc'} onChange={event=>change('order',event.target.value)}><option value='asc'>Menor primero</option><option value='desc'>Mayor primero</option></select><Icon name='chevron'/></label></div>
        {filtersOpen&&<fieldset className='filtersPanel panel'><legend>Servicios</legend>{Object.entries(AMENITIES).map(([key,label])=><label key={key}><input type='checkbox' checked={selected.includes(key)} onChange={()=>change('amenities',(selected.includes(key)?selected.filter(v=>v!==key):[...selected,key]).join(','))}/><Icon name={key}/>{label}</label>)}</fieldset>}
    </aside><section className='resultsList' aria-live='polite'>
        <h1>{resource.loading?'Buscando canchas…':`${resource.data?.total||0} ${(resource.data?.total||0)===1?'establecimiento disponible':'establecimientos disponibles'}`}</h1>
        {resource.loading?<Skeletons count={4}/>:resource.error?<ErrorNotice message={resource.error} onRetry={resource.reload}/>:resource.data.results.length?<>{resource.data.results.map(establishment=><CourtCard key={establishment.id} establishment={establishment} params={params.toString()}/>)}<nav className='pagination' aria-label='Páginas de resultados'>{resource.data.page>1&&<button className='button button-secondary' onClick={()=>{const p=new URLSearchParams(criteria);p.set('page',String(resource.data.page-1));router.push(`/buscar?${p}`);}}>Anterior</button>}{resource.data.total>resource.data.page*12&&<button className='button button-secondary' onClick={()=>{const p=new URLSearchParams(criteria);p.set('page',String(resource.data.page+1));router.push(`/buscar?${p}`);}}>Más canchas</button>}</nav></>:<div className='feedback panel'><h2>No encontramos canchas disponibles</h2><p>Probá con otro horario, día o tipo de cancha.</p><button className='button button-primary' onClick={()=>setEditing(true)}>Modificar búsqueda</button></div>}
    </section></div></main>;
};
