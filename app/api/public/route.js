import { homeData,searchData,detailData } from '@/lib/services/public';
import { json,failure,limitRequest } from '@/lib/services/http';
import { identifier,dateInRange,AppError } from '@/lib/validations';
import { validateSearch,isFuture } from '@/lib/availability/date';
import { filterResults } from '@/lib/availability/engine';
export const runtime='nodejs';
export async function GET(request){
    try{
        limitRequest(request);
        const p=new URL(request.url).searchParams;
        if(p.get('resource')==='home')return json(await homeData());
        if(p.get('resource')==='detail'){
            const date=dateInRange(p.get('date'));
            const data=await detailData(identifier(p.get('id')),date);
            return json({...data,courts:data.courts.map(court=>({...court,slots:court.slots.filter(slot=>isFuture(date,slot.time))}))});
        }
        if(p.get('resource')==='search'){
            let criteria;try{criteria=validateSearch(Object.fromEntries(p));}catch(error){throw new AppError(error.message);}
            const data=await searchData(criteria);
            const filters={amenities:(p.get('amenities')||'').split(',').filter(Boolean),order:p.get('order')==='desc'?'desc':'asc'};
            const results=filterResults(data.results,filters);
            const page=Math.max(1,Math.min(10000,Number(p.get('page'))||1));
            return json({...data,results:results.slice((page-1)*12,page*12),total:results.length,page});
        }
        throw new AppError('Consulta no válida.');
    }catch(error){return failure(error);}
}
