'use client';
import {Navbar,ErrorNotice} from './components';
export default function ErrorPage({reset}){return <main className='pageShell'><Navbar/><ErrorNotice message='No pudimos cargar esta pantalla.' onRetry={reset}/></main>;}
