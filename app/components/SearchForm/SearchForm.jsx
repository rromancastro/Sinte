'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Calendar} from '../Calendar/Calendar';
import {Icon} from '../Icon/Icon';
import {HOURS,localDate,addDays,isFuture,slotLabel,validateSearch} from '@/lib/availability/date';
import {track} from '@/lib/firebase/client';
import './searchForm.scss';
export const SearchForm=({cities=[],initial={},onCancel})=>{
    const router=useRouter();
    const today=localDate();
    const initialDate=initial.date||today;
    const [values,setValues]=useState({city:initial.city||cities[0]?.id||'',date:initialDate,time:initial.time||(isFuture(initialDate,'21:00')?'21:00':HOURS.find(time=>isFuture(initialDate,time))||'24:00'),type:initial.type||'5'});
    const [error,setError]=useState('');
    const change=(key,value)=>{setValues(prev=>({...prev,[key]:value}));setError('');};
    function submit(event){event.preventDefault();try{const criteria=validateSearch(values);track('search',{city_id:criteria.city,court_type:criteria.type});router.push(`/buscar?${new URLSearchParams(criteria)}`);onCancel?.();}catch(error){setError(error.message);}}
    return <form className='searchForm panel' onSubmit={submit}>
        <label className='searchRow'><Icon name='pin'/><span>Ciudad</span><select aria-label='Ciudad' required value={values.city} onChange={event=>change('city',event.target.value)}><option value='' disabled>Elegí ciudad</option>{cities.map(city=><option key={city.id} value={city.id}>{city.name}</option>)}</select><Icon name='chevron'/></label>
        <Calendar label='Día' compact value={values.date} min={Number(values.time.slice(0,2))>=24?addDays(today,-1):today} max={addDays(today,29)} onChange={date=>change('date',date)}/>
        <label className='searchRow'><Icon name='clock'/><span>Hora</span><select aria-label='Hora' value={values.time} onChange={event=>change('time',event.target.value)}>{HOURS.map(time=><option key={time} value={time} disabled={!isFuture(values.date,time)}>{slotLabel(time,true)}</option>)}</select><Icon name='chevron'/></label>
        <label className='searchRow'><Icon name='ball'/><span>Tipo de cancha</span><select aria-label='Tipo de cancha' value={values.type} onChange={event=>change('type',event.target.value)}>{['5','7','11'].map(type=><option key={type} value={type}>Fútbol {type}</option>)}</select><Icon name='chevron'/></label>
        {error&&<p className='errorText' role='alert'>{error}</p>}
        <button className='button button-primary' type='submit' disabled={!cities.length}><Icon name='search'/>Buscar</button>
        {onCancel&&<button type='button' className='textButton' onClick={onCancel}>Cerrar edición</button>}
    </form>;
};
