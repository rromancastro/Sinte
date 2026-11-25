'use client';
import {useEffect,useState,useCallback,useRef} from 'react';
export function useResource(url,fetcher,initialData=null){
    const first=useRef(Boolean(initialData));
    const [state,setState]=useState({data:initialData,error:'',loading:!initialData});
    const [revision,setRevision]=useState(0);
    const reload=useCallback(()=>setRevision(value=>value+1),[]);
    useEffect(()=>{
        if(first.current){first.current=false;return;}
        if(!url){setState({data:null,error:'',loading:false});return;}
        const controller=new AbortController();
        setState({data:null,error:'',loading:true});
        Promise.resolve(fetcher?fetcher(url,controller.signal):fetch(url,{signal:controller.signal,cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data;})).then(data=>{if(!controller.signal.aborted)setState({data,error:'',loading:false});}).catch(error=>{if(!controller.signal.aborted)setState({data:null,error:error.message||'No pudimos cargar los datos.',loading:false});});
        return()=>controller.abort();
    },[url,revision,fetcher]);
    return {...state,reload,setData:updater=>setState(previous=>({...previous,data:typeof updater==='function'?updater(previous.data):updater}))};
}
