'use client';
import {Navbar,SearchForm,CourtCard,ErrorNotice,Skeletons,DemoNotice} from '@/app/components';
import {useResource} from '@/lib/hooks/useResource';
import './homeView.scss';
export const HomeView=({initialData})=>{
    const {data,error,loading,reload}=useResource('/api/public?resource=home',undefined,initialData);
    return <main className='pageShell homeView'><Navbar home/>{data?.demo&&<DemoNotice/>}
        <div className='homeColumns'><section className='homeSearch'><h1>Encontrá cancha <span>rápido</span></h1><p className='homeSubtitle'>Elegí ciudad, día, hora y el tipo de cancha.</p>
            {loading?<Skeletons count={1}/>:error?<ErrorNotice message={error} onRetry={reload}/>:<SearchForm cities={data.cities}/>}
        </section><section className='featuredSection'><h2>Canchas destacadas</h2><p className='muted small'>Opciones populares y con buena disponibilidad.</p>
            {loading?<Skeletons/>:<div className='featuredList'>{data?.featured.map(establishment=><CourtCard key={establishment.id} establishment={establishment} featured/>)}{data&&!data.featured.length&&<p className='small muted'>Próximamente, más canchas para encontrar tu próximo partido.</p>}</div>}
        </section></div>
    </main>;
};
