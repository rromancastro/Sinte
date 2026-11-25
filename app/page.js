import {HomeView} from './home/HomeView/HomeView';
import {homeData} from '@/lib/services/public';
export const dynamic='force-dynamic';
export default async function Home(){let initialData=null;try{initialData=await homeData();}catch{}return <HomeView initialData={initialData}/>;}
