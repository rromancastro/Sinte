import Link from 'next/link';
import { Icon } from '../Icon/Icon';
import './navbar.scss';
export const Navbar=({home=false,back='/',owner=false})=><header className={`navbar ${home?'navbar-home':''}`}>
    {!home&&<Link href={back} className='backLink' aria-label='Volver'><Icon name='back'/></Link>}
    <Link href='/' className='brand' aria-label='Sinte, inicio'><img src='/images/brand/logo.svg' width='80' height='27' alt='sinte.'/></Link>
    {home&&<Link href='/propietario/login' className='ownerLink'>Soy propietario</Link>}
    {owner&&<span className='ownerCaption'>Propietarios</span>}
</header>;
