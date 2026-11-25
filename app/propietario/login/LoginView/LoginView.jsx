'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {signInWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'firebase/auth';
import {Navbar,Icon} from '@/app/components';
import {getClientServices,authError} from '@/lib/firebase/client';
import {useOwnerAuth} from '../../OwnerAuth/OwnerAuth';
import {useResource} from '@/lib/hooks/useResource';
import {localDate} from '@/lib/availability/date';
import {whatsappLink} from '@/lib/utils/whatsapp';
import './loginView.scss';
export const LoginView=()=>{
    const router=useRouter();const session=useOwnerAuth();const settings=useResource('/api/public?resource=home');
    const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [visible,setVisible]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
    useEffect(()=>{if(session.user&&!busy){let cancelled=false;session.request(`/api/owner?date=${localDate()}`).then(()=>{if(!cancelled)router.replace('/propietario');}).catch(error=>{if(!cancelled)setError(error.message);});return()=>{cancelled=true;};}},[session.user,session.request,router,busy]);
    async function login(event){event.preventDefault();setBusy(true);setError('');setMessage('');try{const {auth,persistence}=getClientServices();await persistence;const result=await signInWithEmailAndPassword(auth,email.trim(),password);const response=await fetch(`/api/owner?date=${localDate()}`,{headers:{Authorization:`Bearer ${await result.user.getIdToken()}`},cache:'no-store'});const data=await response.json();if(!response.ok){await signOut(auth);throw new Error(data.error);}router.replace('/propietario');}catch(error){setError(error.code?authError(error):error.message);}finally{setBusy(false);}}
    async function recover(){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError('Ingresá tu email para recuperar la contraseña.');return;}setBusy(true);setError('');try{await sendPasswordResetEmail(getClientServices().auth,email.trim());setMessage('Si el email tiene una cuenta asociada, recibirás las instrucciones para recuperar tu contraseña.');}catch(error){setError(authError(error));}finally{setBusy(false);}}
    const contact=whatsappLink(settings.data?.settings.whatsapp,'¡Hola! Quisiera postular mi establecimiento para aparecer en Sinte.');
    return <main className='pageShell loginView'><Navbar/><section className='loginContent'><span className='establishmentBadge'><Icon name='roof'/>Establecimientos</span><h1>Iniciá sesión</h1><p className='loginSubtitle'>Accedé a tu panel de gestión.</p>
        <form onSubmit={login}><label className='loginField'><span className='srOnly'>Email</span><Icon name='mail'/><input type='email' autoComplete='username' placeholder='Email' value={email} onChange={event=>setEmail(event.target.value)} required maxLength={254}/></label><label className='loginField'><span className='srOnly'>Contraseña</span><Icon name='lock'/><input type={visible?'text':'password'} autoComplete='current-password' placeholder='Contraseña' value={password} onChange={event=>setPassword(event.target.value)} required/><button type='button' aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Icon name='eye'/></button></label><button type='button' className='forgotPassword' disabled={busy} onClick={recover}>¿Olvidaste tu contraseña?</button>
            {(error||session.error)&&<p className='errorText' role='alert'>{error||session.error}</p>}{message&&<p className='recoveryMessage' role='status'>{message}</p>}<button className='button button-primary' type='submit' disabled={busy||session.loading}>{busy?'Ingresando…':'Iniciar sesión'}</button>
        </form><div className='ownerApplication'><p>¿Querés postular tu establecimiento?<br/>Contactanos</p>{contact?<a className='button button-outline' href={contact} target='_blank' rel='noopener noreferrer'><Icon name='whatsapp'/>WhatsApp</a>:<p className='muted small'>El contacto todavía no está disponible.</p>}</div>
    </section></main>;
};
