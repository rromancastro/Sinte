export const ErrorNotice=({message,onRetry})=><div className='feedback panel' role='alert'><p>{message}</p>{onRetry&&<button className='button button-outline' type='button' onClick={onRetry}>Volver a intentar</button>}</div>;
export const Skeletons=({count=3})=><div className='skeletons' role='status' aria-label='Cargando canchas'>{Array.from({length:count},(_,i)=><div className='skeleton' key={i}/>)}<span className='srOnly'>Cargando…</span></div>;
export const DemoNotice=()=> <p className='demoNotice'>Demostración · establecimientos y precios ficticios</p>;
