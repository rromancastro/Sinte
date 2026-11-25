'use client';
import {createContext,useContext,useEffect,useState,useCallback} from 'react';
import {onAuthStateChanged,signOut} from 'firebase/auth';
import {getClientServices} from '@/lib/firebase/client';
const Context=createContext(null);
export const OwnerAuth=({children})=>{
    const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
    useEffect(()=>{let unsubscribe;try{const {auth}=getClientServices();unsubscribe=onAuthStateChanged(auth,value=>{setUser(value);setLoading(false);});}catch{setError('Falta completar la configuración de Firebase.');setLoading(false);}return()=>unsubscribe?.();},[]);
    const request=useCallback(async(url,signal,body)=>{
        if(!user)throw new Error('Iniciá sesión para continuar.');
        const token=await user.getIdToken();
        const response=await fetch(url,{signal,method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
        const data=await response.json();if(!response.ok)throw new Error(data.error);return data;
    },[user]);
    const logout=async()=>{await signOut(getClientServices().auth);};
    return <Context.Provider value={{user,loading,error,request,logout}}>{children}</Context.Provider>;
};
export const useOwnerAuth=()=>useContext(Context);
