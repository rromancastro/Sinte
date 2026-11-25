import Link from 'next/link';
import {Photo} from '../Photo/Photo';
import {Icon} from '../Icon/Icon';
import {ars} from '@/lib/utils/media';
import './courtCard.scss';
export const AMENITIES={roof:'Techada',car:'Estacionamiento',hanger:'Vestuarios',bulb:'Iluminación'};
export const CourtCard=({establishment,featured=false,params=''})=>{
    const price=establishment.price||Math.min(...Object.values(establishment.pricesByType));
    const href=`/cancha/${establishment.id}${params?`?${params}`:''}`;
    const integrated=establishment.isDemo&&(establishment.bookingMode==='integrated'||establishment.matchingCourts?.some(court=>court.bookingMode==='integrated'));
    return <article className={`courtCard panel ${featured?'courtCard-featured':''}`}>
        <Link href={href} className='courtPhoto' aria-label={`Ver ${establishment.name}`}><Photo src={establishment.images?.[0]} alt={`Cancha de ${establishment.name}`}/></Link>
        <div className='courtInfo'><h3><Link href={href}>{establishment.name}</Link></h3><p className='courtCity'><Icon name='pin'/>{establishment.cityName||'San Luis'}</p>
            {!featured&&<div className='amenityTags'>{(establishment.amenities||[]).slice(0,2).map(name=><span key={name}><Icon name={name}/>{AMENITIES[name]}</span>)}</div>}
            {featured&&<small className='featuredCaption'>{establishment.isDemo?'Establecimiento de ejemplo':'Consultá disponibilidad'}</small>}
            <div className='courtBottom'><p className='price'>{ars(price)}<small>por hora</small></p>{!featured&&<Link href={href} className='button button-primary'>Ver cancha</Link>}</div>
            {integrated&&!featured&&<span className='bookingBadge'>RESERVÁ ACÁ MISMO <small>Demo</small></span>}
        </div>
    </article>;
};
