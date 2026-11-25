import Link from 'next/link';
import {Navbar} from './components';
export default function NotFound(){return <main className='pageShell'><Navbar/><div className='feedback panel'><h1>No encontramos esta página</h1><Link className='button button-primary' href='/'>Buscar una cancha</Link></div></main>;}
