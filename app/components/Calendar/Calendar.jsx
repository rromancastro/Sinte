'use client';
import {useEffect,useRef,useState} from 'react';
import {dateLabel,addDays,localDate} from '@/lib/availability/date';
import {Icon} from '../Icon/Icon';
import './calendar.scss';
export const Calendar=({value,onChange,min=localDate(),max=addDays(localDate(),29),label='Día',compact=false})=>{
    const [open,setOpen]=useState(false);
    const [month,setMonth]=useState(value.slice(0,7));
    const root=useRef(null);
    const trigger=useRef(null);
    useEffect(()=>{if(!open)return;const close=event=>{if(!root.current?.contains(event.target))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
    const first=`${month}-01`;
    const offset=(new Date(`${first}T12:00:00Z`).getUTCDay()+6)%7;
    const count=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate();
    const days=Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>{const n=i-offset+1;return n>0&&n<=count?`${month}-${String(n).padStart(2,'0')}`:null;});
    function moveMonth(delta){const d=new Date(`${first}T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+delta);setMonth(d.toISOString().slice(0,7));}
    function choose(date){onChange(date);setOpen(false);trigger.current?.focus();}
    return <div ref={root} className={`calendar ${compact?'calendar-compact':''}`} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}}}>
        <button ref={trigger} type='button' className={`calendarTrigger ${open?'is-open':''}`} aria-expanded={open} aria-label={`${label}: ${dateLabel(value)}`} onClick={()=>{setMonth(value.slice(0,7));setOpen(!open);}}>
            <Icon name='calendar'/>{compact?<><span>{label}</span><strong>{value===localDate()?'Hoy':dateLabel(value)}</strong></>:<span>{dateLabel(value)}</span>}<Icon name='chevron'/>
        </button>
        {open&&<div className='calendarPanel' aria-label='Elegir fecha'>
            <div className='calendarMonth'><button type='button' aria-label='Mes anterior' disabled={month<=min.slice(0,7)} onClick={()=>moveMonth(-1)}>‹</button><strong>{dateLabel(first,{weekday:undefined,day:undefined,month:'long',year:'numeric'})}</strong><button type='button' aria-label='Mes siguiente' disabled={month>=max.slice(0,7)} onClick={()=>moveMonth(1)}>›</button></div>
            <div className='calendarGrid'>
                {['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map(day=><small key={day}>{day}</small>)}
                {days.map((date,i)=>date?<button type='button' key={date} data-date={date} aria-label={dateLabel(date,{weekday:'long'})} aria-pressed={date===value} disabled={date<min||date>max} onClick={()=>choose(date)} onKeyDown={event=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];if(delta){event.preventDefault();root.current?.querySelector(`[data-date="${addDays(date,delta)}"]`)?.focus();}}}>{Number(date.slice(-2))}</button>:<span key={`empty-${i}`}/>)}
            </div>
        </div>}
    </div>;
};
